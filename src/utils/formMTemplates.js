/**
 * Pre-filled, officially compliant state-specific RERA Form M / Complaint templates.
 * Based on rules from the respective state authorities.
 */

const fallback = (val, placeholder) => (val && String(val).trim() !== "" ? val : placeholder);

export function getFormMTemplate(stateId, data = {}) {
  const cName = fallback(data.complainantName, "[Complainant Full Name]");
  const cAddress = fallback(data.complainantAddress, "[Complainant Address for Service]");
  const cContact = fallback(data.complainantContact, "[Complainant Phone / Email]");
  
  const pName = fallback(data.promoterName, "[Promoter / Developer Company Name]");
  const pAddress = fallback(data.promoterAddress, "[Promoter Registered Office Address]");
  
  const projName = fallback(data.projectName, "[RERA Project Name]");
  const regNo = fallback(data.reraRegNo, "[RERA Registration Number]");
  
  const bookingDate = fallback(data.bookingDate, "[Booking Date]");
  const agreementDate = fallback(data.agreementDate, "[Agreement for Sale Execution Date]");
  
  const amtPaid = fallback(data.amountPaid, "[Amount Paid in ₹]");
  const promised = fallback(data.promisedDate, "[Promised Delivery Date in Agreement]");
  const end = fallback(data.endDate, "[Delay Calculation End Date]");
  
  const delay = fallback(data.delayDays, "[Delay Days]");
  const interest = fallback(data.interestAmount, "[Interest Accrued in ₹]");
  const rate = fallback(data.interestRate, "[Interest Rate %]");
  const total = fallback(data.totalClaim, "[Total Claim Amount in ₹]");
  
  const today = new Date().toLocaleDateString("en-IN");

  switch (stateId) {
    case "ka": // Karnataka
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, KARNATAKA

FORM M
[See Rule 34(1)]
COMPLAINT UNDER SECTION 31 OF THE ACT

For Office Use Only:
Complaint Number: ..........................
Date of Filing: ${today}
Date of Receipt by Post: ....................
Registration Number: ........................

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant(s):
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Address for service of all notices: Same as above
   (iv) Contact Details (Phone/Email): ${cContact}

2. Particulars of the Respondent(s):
   (i) Name of the respondent: ${pName}
   (ii) Address of the registered office: ${pAddress}
   (iii) Address for service of all notices: Same as above

3. Particulars of the Project:
   (i) Project Name: ${projName}
   (ii) RERA Registration Number: ${regNo}
   (iii) Location / Address: [Project Site Location]

4. Facts of the Case:
   (i) The Complainant booked a residential apartment / unit in the project "${projName}" on ${bookingDate}.
   (ii) Subsequently, an Agreement for Sale was executed on ${agreementDate}. Under Clause [Possession Clause Number], the Respondent undertook to deliver possession of the unit on or before ${promised}.
   (iii) The Complainant has paid a total principal consideration of ${amtPaid} till date, for which receipts are attached.
   (iv) The Respondent has failed to deliver possession by the promised date (${promised}) and is currently in delay of ${delay} days.
   (v) Pursuant to Section 18 of the RERA Act, 2016, the Complainant is entitled to receive interest on the amount paid for every month of delay at the rate prescribed by the Karnataka RERA Rules (SBI Highest MCLR + 2% Compounded Monthly), which computes to ${rate}% p.a.
   - Statutory Interest Due: ${interest}
   - Total Payout Claimed (Principal + Interest): ${total}

5. Relief(s) Sought:
   In view of the facts mentioned above, the Complainant prays for the following relief(s):
   (i) Direct the Respondent to pay delay possession interest under Section 18 of the Act at the rate of ${rate}% p.a. from ${promised} to ${end}, amounting to ${interest}.
   (ii) Direct the Respondent to hand over immediate possession of the unit complete in all respects with Occupancy Certificate (OC).
   (iii) Order the Respondent to pay litigation expenses of ₹50,000.

6. Interim Order, if any prayed for:
   Pending final decision, direct the Respondent not to create any third-party rights or encumbrance on the subject unit.

7. List of Enclosures:
   (i) Copy of Booking Receipt / Application Form.
   (ii) Copy of Registered Agreement for Sale.
   (iii) All receipts/bank statements proving payment of ${amtPaid}.
   (iv) RERA Interest Calculation Report showing ${interest} interest.
   (v) Copy of official communications/notices sent to the promoter.

8. Declaration:
   I, the Complainant, do hereby declare that the particulars given above are true and correct to the best of my knowledge and belief.

Date: ${today}
Place: Bengaluru, Karnataka

Signature of the Complainant`;

    case "up": // Uttar Pradesh
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, UTTAR PRADESH

FORM M
[See Rule 33(1)]
COMPLAINT UNDER SECTION 31 OF THE ACT

For Office Use Only:
Complaint Registration Number: ..........................
Date of Filing: ${today}

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant(s):
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Contact Details (Phone/Email): ${cContact}

2. Particulars of the Respondent(s):
   (i) Name of the respondent: ${pName}
   (ii) Address of the office / residence: ${pAddress}

3. Particulars of the Project:
   (i) Project Name: ${projName}
   (ii) UP RERA Registration Number: ${regNo}

4. Facts of the Case:
   (i) The Complainant booked a unit in "${projName}" on ${bookingDate} and paid a sum of ${amtPaid} to the Respondent.
   (ii) An Agreement for Sale was signed on ${agreementDate}. The committed date for delivery of possession was ${promised}.
   (iii) The Respondent has failed to offer possession by the committed date, thereby violating Section 18 of the Real Estate (Regulation and Development) Act, 2016.
   (iv) The delay as of date is ${delay} days. The Complainant has paid a total principal of ${amtPaid}.
   - Interest is calculated under the UP RERA rules (SBI MCLR + 1% Compounded Monthly), yielding a rate of ${rate}% p.a.
   - Prescribed interest amount accrued during the delay: ${interest}.
   - Total payout claimed: ${total}.

5. Relief(s) Claimed:
   (i) Direct the promoter/respondent to pay delayed possession interest at the rate of ${rate}% p.a. on the amount of ${amtPaid} from ${promised} to ${end}, amounting to ${interest}.
   (ii) Grant compensation for mental harassment and cost of proceedings.

6. Interim Order, if any prayed for:
   Pending final decision, direct the Respondent not to create any third-party rights or encumbrance on the subject unit.

7. List of Enclosures:
   (i) Booking Application & Registration Receipt.
   (ii) Copy of Agreement for Sale.
   (iii) All receipts/bank statements proving payment of ${amtPaid}.
   (iv) RERA Interest Calculation Report showing ${interest} interest.

8. Declaration:
   The complainant declares that the facts stated above are true to his/her personal knowledge and belief.

Date: ${today}
Place: Uttar Pradesh

Signature of the Complainant`;

    case "mh": // Maharashtra
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY (MahaRERA), MAHARASHTRA

COMPLAINT UNDER SECTION 31 OF THE REAL ESTATE (REGULATION & DEVELOPMENT) ACT, 2016

In the matter of:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

Versus

${pName}
Address: ${pAddress}
... Respondent(s)

1. Subject Matter of Complaint:
   Seeking statutory interest under Section 18 of the RERA Act, 2016 for delay in handing over possession of Flat/Apartment in project "${projName}" (MahaRERA Reg No: ${regNo}).

2. Particulars of the Complainant:
   Name: ${cName}
   Address: ${cAddress}
   Contact: ${cContact}

3. Particulars of the Respondent:
   Name: ${pName}
   Address: ${pAddress}

4. Concise Statement of Facts:
   (i) The Complainant purchased a flat in the project "${projName}" under booking date ${bookingDate}.
   (ii) The Agreement for Sale was registered on ${agreementDate}. The committed possession date under Clause 11/12 of the agreement was ${promised}.
   (iii) The Complainant has paid an aggregate amount of ${amtPaid} towards the flat.
   (iv) The Respondent has failed to procure the Occupancy Certificate and hand over possession by the promised date. The project is delayed by ${delay} days.
   (v) Under MahaRERA rules, the Complainant is entitled to statutory interest of SBI highest MCLR + 2% Simple Interest (currently ${rate}% p.a.) on the amounts paid from the date of promised possession till actual possession.
   - Statutory Interest Due: ${interest}
   - Total Claim Value: ${total}

5. Reliefs Sought:
   (i) Direct the Respondent to pay interest of ${interest} under Section 18 for delay in possession.
   (ii) Order the Respondent to complete work and hand over possession with valid OC immediately.
   (iii) Order refund of any excess charges collected.

6. Interim Order, if any:
   Direct the Respondent not to assign or create third-party rights on the flat until disposal of this complaint.

7. List of Documents Annexed:
   (i) Copy of Booking Receipt / Application Form.
   (ii) Copy of Registered Agreement for Sale.
   (iii) All receipts/bank statements proving payment of ${amtPaid}.
   (iv) RERA Interest Calculation Report showing ${interest} interest.

8. Verification:
   I, the Complainant, verify that the contents of paragraphs 1 to 7 are true and correct to the best of my knowledge and belief.

Date: ${today}
Place: Mumbai, Maharashtra

Signature of the Complainant`;

    case "hr": // Haryana
      return `BEFORE THE HARYANA REAL ESTATE REGULATORY AUTHORITY (HRERA)

COMPLAINT UNDER SECTION 31 OF THE RERA ACT, 2016
FOR DELAY IN POSSESSION INTEREST (SECTION 18)

Complaint Number: ..........................
Date of Filing: ${today}

In the matter of:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

Versus

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant:
   Name: ${cName}
   Address: ${cAddress}
   Contact: ${cContact}

2. Particulars of the Respondent:
   Name: ${pName}
   Address: ${pAddress}

3. Project Details:
   Project Name: ${projName}
   HRERA Registration Number: ${regNo}

4. Facts of the Complaint:
   (i) The Complainant booked a unit in "${projName}" on ${bookingDate} and paid a sum of ${amtPaid} to the Respondent.
   (ii) An Agreement for Sale was signed on ${agreementDate}. The committed date for delivery of possession was ${promised}.
   (iii) The Respondent has failed to offer possession by the committed date, thereby violating Section 18 of the Real Estate (Regulation and Development) Act, 2016.
   (iv) The delay as of date is ${delay} days. The Complainant has paid a total principal of ${amtPaid}.
   - Interest is calculated under the HRERA rules (SBI MCLR + 2% Simple Interest), yielding a rate of ${rate}% p.a.
   - Prescribed interest amount accrued during the delay: ${interest}.
   - Total payout claimed: ${total}.

5. Reliefs Sought:
   (i) Direct the Respondent to pay interest of ${interest} under Section 18 for delay in possession from ${promised} to ${end}.
   (ii) Grant compensation for mental harassment and cost of proceedings.

6. Interim Order, if any prayed for:
   Pending final decision, direct the Respondent not to create any third-party rights or encumbrance on the subject unit.

7. List of Enclosures:
   (i) Booking Application & Registration Receipt.
   (ii) Copy of Agreement for Sale.
   (iii) All receipts/bank statements proving payment of ${amtPaid}.
   (iv) RERA Interest Calculation Report showing ${interest} interest.

8. Declaration:
   The complainant declares that the facts stated above are true to his/her personal knowledge and belief.

Date: ${today}
Place: Haryana

Signature of the Complainant`;

    default: // Generic Model RERA Form M
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, ${stateId ? stateId.toUpperCase() : "REGIONAL"} RERA

FORM M
[See Rule Section 31]
COMPLAINT UNDER SECTION 31 OF THE ACT

Date of Filing: ${today}

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant(s):
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Contact Details: ${cContact}

2. Particulars of the Respondent(s):
   (i) Name of the respondent: ${pName}
   (ii) Address: ${pAddress}

3. Project Details:
   (i) Project Name: ${projName}
   (ii) RERA Registration Number: ${regNo}

4. Facts of the Case:
   (i) The Complainant paid ${amtPaid} for booking flat in "${projName}" on ${bookingDate}.
   (ii) The Agreement for Sale was signed on ${agreementDate}, promising possession on ${promised}.
   (iii) The Respondent has failed to deliver possession within the committed timeline.
   - Total delay is ${delay} days. The Complainant is entitled to statutory interest at ${rate}% p.a. under Section 18.
   - Total calculated interest is ${interest}, making the total claim ${total}.

5. Reliefs Sought:
   (i) Order the Respondent to pay interest of ${interest} for the possession delay.
   (ii) Immediate possession of the unit.

6. Interim Order, if any:
   Direct the Respondent not to assign or create third-party rights on the flat until disposal of this complaint.

7. List of Documents Annexed:
   (i) Booking Receipt and Agreement copy.
   (ii) Payment proofs of ${amtPaid}.
   (iii) Interest Calculation breakdown.

8. Verification:
   Complainant declares that the facts above are true and correct to the best of my knowledge and belief.

Date: ${today}
Place: India

Signature of the Complainant`;
  }
}
