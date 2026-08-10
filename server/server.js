'use strict';

const express = require('express');
const Razorpay = require('razorpay');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });


// ─── Validation & Init ────────────────────────────────────────────────────────
const required = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(`[startup] Warning: Missing env vars: ${missing.join(', ')}. Set these in server/.env or Render Dashboard for full payment functionality.`);
}

// ─── Firebase Admin SDK ───────────────────────────────────────────────────────
let db = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
  } catch (e) {
    console.warn('[startup] Failed to init Firebase Admin SDK:', e.message);
  }
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}


// Pricing constants in INR
const PRICE_BREAKDOWN = 29; // ₹29 for breakdown report
const PRICE_FORM_M = 49;    // ₹49 for Form M (includes breakdown report)
const PRICE_LEGAL_GUIDANCE = 299; // ₹299 for Expert E2E Legal Guidance

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'https://rerainterestcalculator.in',
      'https://www.rerainterestcalculator.in',
      'https://rera-hub.onrender.com'
    ];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Middleware: raw body ONLY for webhook ────────────────────────────────────
app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use((req, _res, next) => {
  if (req.path.startsWith('/webhooks/')) return next();
  express.json()(req, _res, next);
});

// ─── Helper: verify Firebase ID token ────────────────────────────────────────
async function verifyToken(req, res) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return null;
  }
  const idToken = authHeader.slice(7);
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired Firebase token', detail: err.message });
    return null;
  }
}

// Helper to sanitize RERA ID
function normalizeReraId(id) {
  if (!id || typeof id !== 'string') return 'DEFAULT';
  return id.trim().toUpperCase();
}

// ─── POST /api/create-order ───────────────────────────────────────────────────
// Creates a Razorpay order for a specified plan ('breakdown' | 'form_m' | 'legal_guidance') and reraId.
// Body: { plan: 'breakdown' | 'form_m' | 'legal_guidance', reraId: string }
app.post('/api/create-order', async (req, res) => {
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { uid, email } = decoded;
  const plan = ['form_m', 'breakdown', 'legal_guidance'].includes(req.body.plan) ? req.body.plan : 'breakdown';
  const reraId = normalizeReraId(req.body.reraId);

  try {
    // Check existing entitlement doc
    const entitlementRef = db.collection('entitlements').doc(`${uid}_${reraId}`);
    const entSnap = await entitlementRef.get();
    const existing = entSnap.exists ? entSnap.data() : null;

    let price = PRICE_BREAKDOWN;
    if (plan === 'form_m') price = PRICE_FORM_M;
    else if (plan === 'legal_guidance') price = PRICE_LEGAL_GUIDANCE;

    // Check if user already owns access
    if (existing) {
      if (plan === 'legal_guidance' && existing.hasLegalGuidance) {
        return res.status(200).json({ alreadyUnlocked: true, plan: 'legal_guidance', reraId });
      }
      if (existing.hasFormM && plan !== 'legal_guidance') {
        // User already has full access to this RERA ID
        return res.status(200).json({ alreadyUnlocked: true, plan: 'form_m', reraId });
      }
      if (plan === 'breakdown' && existing.hasBreakdown) {
        // User already owns breakdown for this RERA ID
        return res.status(200).json({ alreadyUnlocked: true, plan: 'breakdown', reraId });
      }
      // If user owns breakdown and is buying form_m -> upgrade price is ₹20 (49 - 29)
      if (plan === 'form_m' && existing.hasBreakdown) {
        price = PRICE_FORM_M - PRICE_BREAKDOWN; // ₹20
      }
    }

    const order = await razorpay.orders.create({
      amount: price * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firebase_uid: uid,
        firebase_email: email || '',
        plan: plan,
        rera_id: reraId,
        product: `rera_hub_${plan}_v1`,
      },
    });

    // Save PENDING order in Firestore
    await db.collection('orders').doc(order.id).set({
      orderId: order.id,
      userId: uid,
      userEmail: email || '',
      amount: price,
      currency: 'INR',
      plan: plan,
      reraId: reraId,
      status: 'PENDING',
      product: `rera_hub_${plan}_v1`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      ...order,
      plan,
      reraId,
      chargedAmount: price,
    });
  } catch (err) {
    console.error('[create-order] Razorpay error:', err.message);
    res.status(500).json({ error: 'Failed to create Razorpay order', detail: err.message });
  }
});

// ─── POST /api/verify-payment ────────────────────────────────────────────────
// Instantly verifies Razorpay client payment signature and updates Firestore.
// Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
app.post('/api/verify-payment', async (req, res) => {
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment signature verification fields' });
  }

  // Verify HMAC-SHA256 signature (order_id + "|" + payment_id)
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    console.warn('[verify-payment] Signature mismatch!');
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    // 1. Fetch order details from Firestore
    let orderData = null;
    if (db) {
      const orderDoc = await db.collection('orders').doc(razorpay_order_id).get();
      if (orderDoc.exists) {
        orderData = orderDoc.data();
      }
    }

    const firebaseUid = decoded.uid;
    const plan = orderData?.plan || 'breakdown';
    const reraId = normalizeReraId(orderData?.reraId);

    // 2. Mark order as PAID
    if (db) {
      await db.collection('orders').doc(razorpay_order_id).set(
        {
          userId: firebaseUid,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          status: 'PAID',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Grant entitlement doc in Firestore: entitlements/${uid}_${reraId}
      const entitlementRef = db.collection('entitlements').doc(`${firebaseUid}_${reraId}`);
      const entSnap = await entitlementRef.get();
      const existing = entSnap.exists ? entSnap.data() : {};

      await entitlementRef.set(
        {
          userId: firebaseUid,
          reraId: reraId,
          hasBreakdown: true,
          hasFormM: plan === 'form_m' || existing.hasFormM === true,
          hasLegalGuidance: plan === 'legal_guidance' || existing.hasLegalGuidance === true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`[verify-payment] Order ${razorpay_order_id} verified & unlocked for ${firebaseUid} (${reraId})`);
    }

    return res.status(200).json({
      success: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      plan,
      reraId,
    });
  } catch (err) {
    console.error('[verify-payment] Error:', err.message);
    res.status(500).json({ error: 'Failed to verify payment', detail: err.message });
  }
});

// ─── GET /api/user-status ─────────────────────────────────────────────────────
// Returns map of all unlocked RERA IDs and their entitlements for the user.
// Returns: { entitlements: { [reraId]: { hasBreakdown: boolean, hasFormM: boolean } } }
app.get('/api/user-status', async (req, res) => {
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  try {
    const snap = await db
      .collection('entitlements')
      .where('userId', '==', decoded.uid)
      .get();

    const entitlements = {};
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.reraId) {
        entitlements[data.reraId] = {
          hasBreakdown: data.hasBreakdown === true || data.hasFormM === true,
          hasFormM: data.hasFormM === true,
          hasLegalGuidance: data.hasLegalGuidance === true,
        };
      }
    });

    return res.status(200).json({
      entitlements,
      isPremium: Object.values(entitlements).some((e) => e.hasFormM || e.hasBreakdown || e.hasLegalGuidance),
    });
  } catch (err) {
    console.error('[user-status] Firestore error:', err.message);
    res.status(500).json({ error: 'Failed to query user status', detail: err.message });
  }
});

// ─── POST /webhooks/razorpay ──────────────────────────────────────────────────
// Webhook receiver for Razorpay payment notifications.
app.post('/webhooks/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  if (!signature) {
    return res.status(400).send('Missing signature header');
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    console.warn('[webhook] Signature verification FAILED');
    return res.status(403).send('Signature verification failed');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).send('Invalid JSON payload');
  }

  const event = payload.event;
  console.log(`[webhook] Received event: ${event}`);

  if (event === 'payment.captured') {
    const entity = payload.payload.payment.entity;
    const firebaseUid = entity.notes?.firebase_uid;
    const plan = entity.notes?.plan || 'breakdown';
    const reraId = normalizeReraId(entity.notes?.rera_id);
    const orderId = entity.order_id;
    const paymentId = entity.id;

    if (!firebaseUid) {
      console.error('[webhook] payment.captured missing firebase_uid in notes');
      return res.status(200).json({ status: 'ok', warning: 'no_uid' });
    }

    try {
      // 1. Mark order document as PAID
      await db.collection('orders').doc(orderId).set(
        {
          userId: firebaseUid,
          orderId,
          paymentId,
          amount: entity.amount / 100,
          currency: entity.currency,
          plan,
          reraId,
          status: 'PAID',
          method: entity.method || null,
          userEmail: entity.email || entity.notes?.firebase_email || '',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          rawEvent: event,
        },
        { merge: true }
      );

      // 2. Grant or update entitlement record: entitlements/${uid}_${reraId}
      const entitlementRef = db.collection('entitlements').doc(`${firebaseUid}_${reraId}`);
      const entSnap = await entitlementRef.get();
      const existing = entSnap.exists ? entSnap.data() : {};

      const isFormM = plan === 'form_m' || existing.hasFormM === true;
      const isLegalGuidance = plan === 'legal_guidance' || existing.hasLegalGuidance === true;
      const isBreakdown = true;

      await entitlementRef.set(
        {
          userId: firebaseUid,
          reraId: reraId,
          hasBreakdown: isBreakdown,
          hasFormM: isFormM,
          hasLegalGuidance: isLegalGuidance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`[webhook] Entitlement updated for ${firebaseUid} on RERA ID ${reraId}: plan=${plan}`);
    } catch (err) {
      console.error('[webhook] Firestore write error:', err.message);
      return res.status(500).json({ error: 'Firestore write failed' });
    }
  }

  if (event === 'payment.failed') {
    const entity = payload.payload.payment.entity;
    const orderId = entity.order_id;
    if (orderId) {
      await db
        .collection('orders')
        .doc(orderId)
        .set({ status: 'FAILED', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        .catch((err) => console.error('[webhook] Failed to update FAILED status:', err.message));
    }
  }

  res.status(200).json({ status: 'ok' });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'rera-hub-api' }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[server] rera-hub-api running on port ${PORT}`));
