/**
 * Pre-filled state-specific RERA Form M / Complaint templates.
 * Provides fallback values so the document can be edited/filled by the user.
 */

const fallback = (val, placeholder) => (val && String(val).trim() !== "" ? val : placeholder);

export function getFormMTemplate(stateId, data = {}) {
  const cName = fallback(data.complainantName, "[Complainant Name]");
  const cAddress = fallback(data.complainantAddress, "[Complainant Address]");
  const cContact = fallback(data.complainantContact, "[Complainant Phone / Email]");
  
  const pName = fallback(data.promoterName, "[Promoter / Developer Name]");
  const pAddress = fallback(data.promoterAddress, "[Promoter Office Address]");
  
  const projName = fallback(data.projectName, "[Project Name]");
  const regNo = fallback(data.reraRegNo, "[RERA Registration Number]");
  
  const bookingDate = fallback(data.bookingDate, "[Booking Date]");
  const agreementDate = fallback(data.agreementDate, "[Agreement for Sale Date]");
  
  const amtPaid = fallback(data.amountPaid, "[Amount Paid in ₹]");
  const promised = fallback(data.promisedDate, "[Promised Possession Date]");
  const end = fallback(data.endDate, "[Actual / Delay End Date]");
  
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
COMPLAINT UNDER SECTION 31 OF THE RERA ACT, 2016

For Office Use Only:
Complaint No: ..........................
Date of filing: ..........................

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant:
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Contact Details (Phone/Email): ${cContact}

2. Particulars of the Respondent:
   (i) Name of the respondent: ${pName}
   (ii) Address of the office / residence: ${pAddress}

3. Particulars of the Project:
   (i) Project Name: ${projName}
   (ii) RERA Registration Number: ${regNo}
   (iii) Location of Project: [Project Location / Address]

4. Facts of the Case:
   (i) The Complainant booked apartment/plot in project "${projName}" on ${bookingDate} and paid a sum of ${amtPaid} towards booking and subsequent milestones.
   (ii) The parties executed an Agreement for Sale dated ${agreementDate}, wherein the Respondent undertook to deliver possession of the flat on or before ${promised}.
   (iii) The Complainant has paid a total principal consideration of ${amtPaid} till date, constituting a significant portion of the total flat cost.
   (iv) The Respondent failed to deliver possession by the promised date (${promised}) and is currently in delay of ${delay} days.
   (v) Pursuant to Section 18 of the RERA Act, 2016, the Complainant is entitled to receive interest on the amount paid for every month of delay at the rate prescribed by the Karnataka RERA Rules (SBI Highest MCLR + 2% Compounded Monthly), which computes to ${rate}% p.a.

5. Details of RERA Interest Calculation:
   - Principal Amount Paid: ${amtPaid}
   - Promised Possession Date: ${promised}
   - Calculation End Date (for interest): ${end}
   - Total Delay Duration: ${delay} days
   - Prescribed RERA Interest Rate: ${rate}% p.a.
   - Statutory Interest Due: ${interest}
   - Total Claim (Principal + Interest): ${total}

6. Relief(s) Sought:
   The Complainant prays for the following relief(s):
   (i) Direct the Respondent to pay interest for delayed possession under Section 18 of the Act at the rate of ${rate}% p.a. for the delay period from ${promised} to ${end}, amounting to ${interest}.
   (ii) Direct the Respondent to hand over immediate possession of the flat complete with Occupancy Certificate (OC).
   (iii) Direct the Respondent to pay litigation expenses of ₹50,000 to the Complainant.

7. Declaration:
   I, the Complainant, do hereby declare that the particulars given above are true and correct to the best of my knowledge and belief.

Date: ${today}
Place: Bengaluru, Karnataka

Signature of the Complainant`;

    case "up": // Uttar Pradesh
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, UTTAR PRADESH

FORM M
[See Rule 33(1)]
COMPLAINT UNDER SECTION 31 OF THE RERA ACT, 2016

Complaint Registration No: ..........................
Date of filing: ${today}

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant:
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Contact Details (Phone/Email): ${cContact}

2. Particulars of the Respondent:
   (i) Name of the respondent: ${pName}
   (ii) Address of the office / residence: ${pAddress}

3. Particulars of the Project:
   (i) Project Name: ${projName}
   (ii) RERA Registration Number: ${regNo}

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

6. Declaration:
   The complainant declares that the facts stated above are true to his/her personal knowledge.

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

5. Financial Details & Claim Summary:
   - Principal Amount Paid: ${amtPaid}
   - Promised Possession Date: ${promised}
   - Calculation End Date: ${end}
   - Total Delay Duration: ${delay} days
   - Statutory Interest Rate: ${rate}% p.a. Simple Interest
   - Total Interest Due: ${interest}
   - Total Claim Value: ${total}

6. Reliefs Sought:
   (i) Direct the Respondent to pay interest of ${interest} under Section 18 for delay in possession.
   (ii) Order the Respondent to complete work and hand over possession with valid OC immediately.
   (iii) Order refund of any excess charges collected.

7. Verification:
   I, the Complainant, verify that the contents of paragraphs 1 to 6 are true and correct.

Date: ${today}
Place: Mumbai, Maharashtra

Signature of the Complainant`;

    case "hr": // Haryana
      return `BEFORE THE HARYANA REAL ESTATE REGULATORY AUTHORITY (HRERA)

COMPLAINT UNDER SECTION 31 OF THE RERA ACT, 2016
FOR DELAY IN POSSESSION INTEREST (SECTION 18)

Complaint No: ..........................
Date of filing: ${today}

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

6. Declaration:
   The complainant declares that the facts stated above are true to his/her personal knowledge.

Date: ${today}
Place: Haryana

Signature of the Complainant`;

    default: // Generic Model RERA Form M
      return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, ${stateId ? stateId.toUpperCase() : "REGIONAL"} RERA

FORM M
[See Rule Section 31]
COMPLAINT UNDER SECTION 31 OF THE RERA ACT, 2016

Date of filing: ${today}

Between:
${cName}
Address: ${cAddress}
Contact: ${cContact}
... Complainant(s)

And

${pName}
Address: ${pAddress}
... Respondent(s)

1. Particulars of the Complainant:
   (i) Name of the complainant: ${cName}
   (ii) Address of the office / residence: ${cAddress}
   (iii) Contact Details: ${cContact}

2. Particulars of the Respondent:
   (i) Name of the respondent: ${pName}
   (ii) Address: ${pAddress}

3. Project Details:
   (i) Project Name: ${projName}
   (ii) RERA Registration Number: ${regNo}

4. Facts of the Case:
   (i) The Complainant paid ${amtPaid} for booking flat in "${projName}" on ${bookingDate}.
   (ii) The Agreement for Sale was signed on ${agreementDate}, promising possession on ${promised}.
   (iii) The Respondent has failed to deliver possession within the committed timeline.
   (iv) Total delay is ${delay} days. The Complainant is entitled to statutory interest at ${rate}% p.a. under Section 18.
   (v) Total calculated interest is ${interest}, making the total claim ${total}.

5. Reliefs Sought:
   (i) Order the Respondent to pay interest of ${interest} for the possession delay.
   (ii) Immediate possession of the unit.

6. Verification:
   Complainant declares that the facts above are true.

Date: ${today}
Place: India

Signature of the Complainant`;
  }
}
