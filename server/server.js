'use strict';

const express = require('express');
const Razorpay = require('razorpay');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

// ─── Validation ───────────────────────────────────────────────────────────────
const required = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ─── Firebase Admin SDK ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Razorpay ─────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Premium price in INR (hard-coded server-side for security)
const PREMIUM_PRICE_INR = 499;

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Middleware: raw body ONLY for webhook ────────────────────────────────────
// Razorpay HMAC verification requires the exact raw bytes from the request.
app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }));
// All other routes use parsed JSON
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

// ─── POST /api/create-order ───────────────────────────────────────────────────
// Creates a Razorpay order for the premium plan.
// Requires: Authorization: Bearer <firebase-id-token>
// Returns: Razorpay order object
app.post('/api/create-order', async (req, res) => {
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  const { uid, email } = decoded;

  // Idempotency: if already premium, return early
  const snap = await db
    .collection('orders')
    .where('userId', '==', uid)
    .where('status', '==', 'PAID')
    .limit(1)
    .get();

  if (!snap.empty) {
    return res.status(200).json({ alreadyPremium: true });
  }

  try {
    const order = await razorpay.orders.create({
      amount: PREMIUM_PRICE_INR * 100, // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        firebase_uid: uid,
        firebase_email: email || '',
        product: 'rera_hub_premium_v1',
      },
    });

    // Create a pending order record in Firestore immediately
    await db.collection('orders').doc(order.id).set({
      orderId: order.id,
      userId: uid,
      userEmail: email || '',
      amount: PREMIUM_PRICE_INR,
      currency: 'INR',
      status: 'PENDING',
      product: 'rera_hub_premium_v1',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json(order);
  } catch (err) {
    console.error('[create-order] Razorpay error:', err.message);
    res.status(500).json({ error: 'Failed to create Razorpay order', detail: err.message });
  }
});

// ─── GET /api/user-status ─────────────────────────────────────────────────────
// Checks whether the authenticated user has a PAID order.
// Requires: Authorization: Bearer <firebase-id-token>
// Returns: { isPremium: boolean, orderId?: string, paidAt?: string }
app.get('/api/user-status', async (req, res) => {
  const decoded = await verifyToken(req, res);
  if (!decoded) return;

  try {
    const snap = await db
      .collection('orders')
      .where('userId', '==', decoded.uid)
      .where('status', '==', 'PAID')
      .orderBy('paidAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(200).json({ isPremium: false });
    }

    const doc = snap.docs[0].data();
    return res.status(200).json({
      isPremium: true,
      orderId: doc.orderId,
      paymentId: doc.paymentId,
      paidAt: doc.paidAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[user-status] Firestore error:', err.message);
    res.status(500).json({ error: 'Failed to query user status', detail: err.message });
  }
});

// ─── POST /webhooks/razorpay ──────────────────────────────────────────────────
// Receives Razorpay webhook events and writes verified payment records to Firestore.
// IMPORTANT: Must receive raw body (see middleware above).
app.post('/webhooks/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, due to express.raw()

  if (!signature) {
    return res.status(400).send('Missing signature header');
  }

  // Verify HMAC-SHA256 signature
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
    const orderId = entity.order_id;
    const paymentId = entity.id;

    if (!firebaseUid) {
      console.error('[webhook] payment.captured missing firebase_uid in notes');
      return res.status(200).json({ status: 'ok', warning: 'no_uid' });
    }

    try {
      // Update the order document (keyed by orderId) to PAID
      await db.collection('orders').doc(orderId).set(
        {
          userId: firebaseUid,
          orderId,
          paymentId,
          amount: entity.amount / 100,
          currency: entity.currency,
          status: 'PAID',
          method: entity.method || null,
          userEmail: entity.email || entity.notes?.firebase_email || '',
          product: entity.notes?.product || 'rera_hub_premium_v1',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          rawEvent: event,
        },
        { merge: true } // merge so PENDING fields (createdAt) are preserved
      );

      console.log(`[webhook] Order ${orderId} marked PAID for uid ${firebaseUid}`);
    } catch (err) {
      console.error('[webhook] Firestore write error:', err.message);
      // Return 500 so Razorpay retries
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
