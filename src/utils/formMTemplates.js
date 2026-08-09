/**
 * Officially compliant state-specific RERA Form M / Complaint templates
 * supporting English (en), Hindi (hi), Marathi (mr), and Kannada (kn).
 */

const fallback = (val, placeholder) => (val && String(val).trim() !== "" ? val : placeholder);

export function getFormMTemplate(stateId, data = {}, lang = "en") {
  const cName = fallback(data.complainantName, lang === "en" ? "[Complainant Full Name]" : lang === "hi" ? "[शिकायतकर्ता का पूरा नाम]" : lang === "mr" ? "[तक्रारदाराचे पूर्ण नाव]" : "[ದೂರುದಾರರ ಪೂರ್ಣ ಹೆಸರು]");
  const cAddress = fallback(data.complainantAddress, lang === "en" ? "[Complainant Address]" : lang === "hi" ? "[शिकायतकर्ता का पता]" : lang === "mr" ? "[तक्रारदाराचा पत्ता]" : "[ದೂರುದಾರರ ವಿಳಾಸ]");
  const cContact = fallback(data.complainantContact, lang === "en" ? "[Complainant Contact]" : lang === "hi" ? "[शिकायतकर्ता का संपर्क विवरण]" : lang === "mr" ? "[तक्रारदाराचा संपर्क]" : "[ದೂರುದಾರರ ಸಂಪರ್ಕ ವಿವರ]");
  
  const pName = fallback(data.promoterName, lang === "en" ? "[Promoter / Developer Name]" : lang === "hi" ? "[प्रमोटर / डेवलपर का नाम]" : lang === "mr" ? "[प्रमोटर / डेव्हलपरचे नाव]" : "[ಪ್ರವರ್ತಕರು / ಡೆವಲಪರ್ ಹೆಸರು]");
  const pAddress = fallback(data.promoterAddress, lang === "en" ? "[Promoter Office Address]" : lang === "hi" ? "[प्रमोटर कार्यालय का पता]" : lang === "mr" ? "[प्रमोटरचा पत्ता]" : "[ಪ್ರವರ್ತಕರ ವಿಳಾಸ]");
  
  const projName = fallback(data.projectName, lang === "en" ? "[RERA Project Name]" : lang === "hi" ? "[परियोजना का नाम]" : lang === "mr" ? "[प्रकल्पाचे नाव]" : "[ಯೋಜನೆಯ ಹೆಸರು]");
  const regNo = fallback(data.reraRegNo, lang === "en" ? "[RERA Registration Number]" : lang === "hi" ? "[रेरा पंजीकरण संख्या]" : lang === "mr" ? "[रेरा नोंदणी क्रमांक]" : "[ರೇರಾ ನೋಂದಣಿ ಸಂಖ್ಯೆ]");
  
  const bookingDate = fallback(data.bookingDate, lang === "en" ? "[Booking Date]" : lang === "hi" ? "[बुकिंग की तारीख]" : lang === "mr" ? "[बुकिंगची तारीख]" : "[ಬುಕಿಂಗ್ ದಿನಾಂಕ]");
  const agreementDate = fallback(data.agreementDate, lang === "en" ? "[Agreement Date]" : lang === "hi" ? "[समझौते की तारीख]" : lang === "mr" ? "[कराराची तारीख]" : "[ಒಪ್ಪಂದದ ದಿನಾಂಕ]");
  
  const amtPaid = fallback(data.amountPaid, "[Amount Paid]");
  const promised = fallback(data.promisedDate, "[Promised Date]");
  const end = fallback(data.endDate, "[End Date]");
  
  const delay = fallback(data.delayDays, "[Delay Days]");
  const interest = fallback(data.interestAmount, "[Interest Amount]");
  const rate = fallback(data.interestRate, "[Interest Rate %]");
  const total = fallback(data.totalClaim, "[Total Claim]");
  
  const today = new Date().toLocaleDateString(lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "kn-IN");

  // Karnataka RERA Templates (ka)
  if (stateId === "ka") {
    if (lang === "kn") {
      return `ಕರ್ನಾಟಕ ರಿಯಲ್ ಎಸ್ಟೇಟ್ ನಿಯಂತ್ರಣ ಪ್ರಾಧಿಕಾರ, ಕರ್ನಾಟಕ

ಫಾರ್ಮ್ M
[ನಿಯಮ 34(1) ನೋಡಿ]
ಕಾನೂನಿನ ಸೆಕ್ಷನ್ 31 ರ ಅಡಿಯಲ್ಲಿ ದೂರು ಅರ್ಜಿ

ಕಚೇರಿ ಬಳಕೆಗೆ ಮಾತ್ರ:
ದೂರು ಸಂಖ್ಯೆ: ..........................
ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ: ${today}

ನಡುವೆ:
${cName}
ವಿಳಾಸ: ${cAddress}
ಸಂಪರ್ಕ: ${cContact}
... ದೂರುದಾರರು

ಮತ್ತು

${pName}
ವಿಳಾಸ: ${pAddress}
... ಪ್ರತಿವಾದಿ(ಗಳು)

1. ದೂರುದಾರರ ವಿವರಗಳು:
   (i) ದೂರುದಾರರ ಹೆಸರು: ${cName}
   (ii) ಕಚೇರಿ / ನಿವಾಸದ ವಿಳಾಸ: ${cAddress}
   (iii) ಸಂಪರ್ಕ ವಿವರಗಳು (ದೂರವಾಣಿ/ಇಮೇಲ್): ${cContact}

2. ಪ್ರತಿವಾದಿಯ ವಿವರಗಳು:
   (i) ಪ್ರತಿವಾದಿಯ ಹೆಸರು: ${pName}
   (ii) ಕಚೇರಿ ವಿಳಾಸ: ${pAddress}

3. ಯೋಜನೆಯ ವಿವರಗಳು:
   (i) ಯೋಜನೆಯ ಹೆಸರು: ${projName}
   (ii) ರೇರಾ ನೋಂದಣಿ ಸಂಖ್ಯೆ: ${regNo}

4. ಪ್ರಕರಣದ ಸತ್ಯಾಂಶಗಳು:
   (i) ದೂರುದಾರರು "${projName}" ಯೋಜನೆಯಲ್ಲಿ ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಅನ್ನು ${bookingDate} ರಂದು ಬುಕ್ ಮಾಡಿದ್ದರು ಮತ್ತು ಒಟ್ಟು ${amtPaid} ಪಾವತಿಸಿದ್ದಾರೆ.
   (ii) ದಿನಾಂಕ ${agreementDate} ರಂದು ಮಾರಾಟ ಒಪ್ಪಂದವನ್ನು ಮಾಡಿಕೊಳ್ಳಲಾಗಿದ್ದು, ಅದರಂತೆ ಪ್ರತಿವಾದಿಯು ${promised} ರೊಳಗೆ ಸ್ವಾಧೀನವನ್ನು ನೀಡಬೇಕಾಗಿತ್ತು.
   (iii) ಪ್ರತಿವಾದಿಯು ನಿಗದಿತ ದಿನಾಂಕದೊಳಗೆ ಸ್ವಾಧೀನ ನೀಡಲು ವಿಫಲರಾಗಿದ್ದು, ಸದ್ಯಕ್ಕೆ ${delay} ದಿನಗಳ ವಿಳಂಬವಾಗಿದೆ.
   (iv) ಸೆಕ್ಷನ್ 18 ರ ಅಡಿಯಲ್ಲಿ ದೂರುದಾರರು ಪಾವತಿಸಿದ ಮೊತ್ತಕ್ಕೆ ವಾರ್ಷಿಕ ಶೇ. ${rate} ರಷ್ಟು ಬಡ್ಡಿ ಪಡೆಯಲು ಅರ್ಹರಾಗಿದ್ದಾರೆ.
   - ಒಟ್ಟು ಅಸಲು ಪಾವತಿ: ${amtPaid}
   - ವಿಳಂಬದ ದಿನಗಳು: ${delay} ದಿನಗಳು
   - ಸಂಚಿತ ಬಡ್ಡಿ: ${interest}
   - ಒಟ್ಟು ಹಕ್ಕು ಮೊತ್ತ (ಅಸಲು + ಬಡ್ಡಿ): ${total}

5. ಕೋರಿದ ಪರಿಹಾರಗಳು:
   (i) ಪ್ರತಿವಾದಿಗೆ ಸೆಕ್ಷನ್ 18 ರ ಅಡಿಯಲ್ಲಿ ವಿಳಂಬ ಅವಧಿಗೆ ಶೇ. ${rate} ರ ದರದಲ್ಲಿ ${interest} ಬಡ್ಡಿಯನ್ನು ಪಾವತಿಸಲು ನಿರ್ದೇಶಿಸಬೇಕು.
   (ii) ಸಕಲ ಸೌಕರ್ಯಗಳೊಂದಿಗೆ ತಕ್ಷಣವೇ ಸ್ವಾಧೀನ ನೀಡಲು ಆದೇಶಿಸಬೇಕು.

6. ಘೋಷಣೆ:
   ಮೇಲೆ ನೀಡಲಾದ ವಿವರಗಳು ನನ್ನ ಜ್ಞಾನ ಮತ್ತು ನಂಬಿಕೆಗೆ ಸರಿಯಾಗಿವೆ ಎಂದು ಘೋಷಿಸುತ್ತೇನೆ.

ದಿನಾಂಕ: ${today}
ಸ್ಥಳ: ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ

ದೂರುದಾರರ ಸಹಿ`;
    }
    
    if (lang === "hi") {
      return `कर्नाटक रियल एस्टेट नियामक प्राधिकरण, कर्नाटक

फॉर्म M
[नियम 34(1) देखें]
अधिनियम की धारा 31 के तहत शिकायत

कार्यालय उपयोग के लिए:
शिकायत संख्या: ..........................
दाखिल करने की तिथि: ${today}

बीच में:
${cName}
पता: ${cAddress}
संपर्क: ${cContact}
... शिकायतकर्ता

और

${pName}
पता: ${pAddress}
... प्रतिवादी

1. शिकायतकर्ता का विवरण:
   (i) शिकायतकर्ता का नाम: ${cName}
   (ii) कार्यालय / निवास का पता: ${cAddress}
   (iii) संपर्क विवरण: ${cContact}

2. प्रतिवादी का विवरण:
   (i) प्रतिवादी का नाम: ${pName}
   (ii) कार्यालय का पता: ${pAddress}

3. परियोजना का विवरण:
   (i) परियोजना का नाम: ${projName}
   (ii) रेरा पंजीकरण संख्या: ${regNo}

4. मामले के तथ्य:
   (i) शिकायतकर्ता ने परियोजना "${projName}" में ${bookingDate} को बुकिंग की थी और कुल ${amtPaid} का भुगतान किया।
   (ii) विक्रय समझौता ${agreementDate} को निष्पादित किया गया था, जिसमें प्रतिवादी ने ${promised} को या उससे पहले कब्जा देने का वादा किया था।
   (iii) प्रतिवादी कब्जा देने में विफल रहा है और वर्तमान में ${delay} दिनों की देरी है।
   (iv) धारा 18 के तहत शिकायतकर्ता ब्याज पाने का हकदार है, जो एसबीआई उच्चतम एमसीएलआर + 2% चक्रवृद्धि मासिक दर (यानी ${rate}% वार्षिक) पर ${interest} बनता है।
   - मूलधन: ${amtPaid}
   - संचित ब्याज: ${interest}
   - कुल दावा: ${total}

5. मांगे गए राहत:
   (i) प्रतिवादी को धारा 18 के तहत ${rate}% वार्षिक की दर से ${interest} ब्याज का भुगतान करने का निर्देश दिया जाए।
   (ii) परियोजना का पूर्ण कब्जा दिया जाए।

6. घोषणा:
   मैं घोषित करता हूँ कि ऊपर दिए गए विवरण मेरे सर्वोत्तम ज्ञान और विश्वास के अनुसार सत्य हैं।

तिथि: ${today}
स्थान: बेंगलुरु, कर्नाटक

शिकायतकर्ता के हस्ताक्षर`;
    }
  }

  // UP RERA Templates (up)
  if (stateId === "up") {
    if (lang === "hi") {
      return `उत्तर प्रदेश रियल एस्टेट नियामक प्राधिकरण, उत्तर प्रदेश

फॉर्म M
[नियम 33(1) देखें]
अधिनियम की धारा 31 के तहत शिकायत

शिकायत पंजीकरण संख्या: ..........................
दाखिल करने की तिथि: ${today}

बीच में:
${cName}
पता: ${cAddress}
संपर्क: ${cContact}
... शिकायतकर्ता

और

${pName}
पता: ${pAddress}
... प्रतिवादी

1. शिकायतकर्ता का विवरण:
   (i) शिकायतकर्ता का नाम: ${cName}
   (ii) कार्यालय / निवास का पता: ${cAddress}
   (iii) संपर्क विवरण: ${cContact}

2. प्रतिवादी का विवरण:
   (i) प्रतिवादी का नाम: ${pName}
   (ii) कार्यालय का पता: ${pAddress}

3. परियोजना का विवरण:
   (i) परियोजना का नाम: ${projName}
   (ii) यूपी रेरा पंजीकरण संख्या: ${regNo}

4. मामले के तथ्य:
   (i) शिकायतकर्ता ने "${projName}" में ${bookingDate} को इकाई बुक की और प्रमोटर को ${amtPaid} का भुगतान किया।
   (ii) बिक्री का समझौता ${agreementDate} को हस्ताक्षरित किया गया था। कब्जा सौंपने की प्रतिबद्ध तिथि ${promised} थी।
   (iii) प्रतिवादी वादा की गई तिथि तक कब्जा देने में विफल रहा है, जिससे अधिनियम की धारा 18 का उल्लंघन हुआ है।
   (iv) कुल देरी ${delay} दिन है। प्रमोटर को कुल भुगतान ${amtPaid} है।
   - यूपी रेरा नियमों (एसबीआई एमसीएलआर + 1% चक्रवृद्धि मासिक) के अनुसार ब्याज दर ${rate}% वार्षिक है।
   - देरी के दौरान अर्जित ब्याज: ${interest}।
   - कुल दावा: ${total}।

5. दावा की गई राहत:
   (i) प्रमोटर को धारा 18 के तहत ${promised} से ${end} की अवधि के लिए ${rate}% वार्षिक ब्याज दर से ${interest} भुगतान करने का आदेश दिया जाए।
   (ii) मानसिक उत्पीड़न और मुकदमेबाजी लागत के लिए मुआवजा दिया जाए।

6. घोषणा:
   शिकायतकर्ता घोषित करता है कि ऊपर दी गई जानकारी सत्य और सही है।

तिथि: ${today}
स्थान: उत्तर प्रदेश

शिकायतकर्ता के हस्ताक्षर`;
    }
  }

  // MahaRERA Templates (mh)
  if (stateId === "mh") {
    if (lang === "mr") {
      return `महाराष्ट्र स्थावर मालमत्ता नियामक प्राधिकरण (महारेरा), महाराष्ट्र

कलम ३१ अन्वये तक्रार अर्ज (स्थावर मालमत्ता कायदा, २०१६)

तक्रारदार:
${cName}
पत्ता: ${cAddress}
संपर्क: ${cContact}
... तक्रारदार

विरुद्ध

${pName}
पत्ता: ${pAddress}
... प्रतिवादी

१. तक्रारीचा विषय:
   प्रकल्प "${projName}" (नोंदणी क्रमांक: ${regNo}) मधील सदनिकेचा ताबा वेळेत न दिल्याबद्दल कलम १८ अंतर्गत वैधानिक व्याजाची मागणी.

२. तक्रारदाराचा तपशील:
   नाव: ${cName}
   पत्ता: ${cAddress}
   संपर्क: ${cContact}

೩. प्रतिवादीचा तपशील:
   नाव: ${pName}
   पत्ता: ${pAddress}

४. संक्षिप्त वस्तुस्थिती:
   (i) तक्रारदाराने प्रकल्प "${projName}" मध्ये सदनिका ${bookingDate} रोजी बुक केली होती.
   (ii) खरेदी करार ${agreementDate} रोजी नोंदणीकृत झाला. करारातील तरतुदीनुसार ताबा देण्याची वचनबद्ध तारीख ${promised} होती.
   (iii) तक्रारदाराने सदनिकेसाठी एकूण ${amtPaid} चा भरणा केला आहे.
   (iv) प्रतिवादी ताबा देण्यास अपयशी ठरला असून प्रकल्प सध्या ${delay} दिवस विलंबाने चालत आहे.
   (v) महारेरा नियमांनुसार, तक्रारदार एसबीआय सर्वोच्च एमसीएलआर + २% सरळ व्याजासह (सध्या ${rate}% प्रति वर्ष) व्याज मिळण्यास पात्र आहे.
   - मूळ मुद्दल: ${amtPaid}
   - थकीत व्याज: ${interest}
   - एकूण हक्क मोबदला: ${total}

५. मागितलेली दाद/राहत:
   (i) प्रतिवादीला विलंबासाठी कलम १८ अंतर्गत ${interest} व्याज देण्याचे आदेश द्यावेत.
   (ii) सदनिकेचा भोगवटा प्रमाणपत्र (OC) सह त्वरित ताबा देण्याचे आदेश द्यावेत.

६. घोषणापत्र:
   मी, तक्रारदार, असे घोषित करतो की वरील सर्व मजकूर माझ्या माहितीनुसार सत्य आणि अचूक आहे.

दिनांक: ${today}
स्थळ: मुंबई, महाराष्ट्र

तक्रारदाराची स्वाक्षरी`;
    }
    
    if (lang === "hi") {
      return `महाराष्ट्र रियल एस्टेट नियामक प्राधिकरण (महारेरा), महाराष्ट्र

स्थावर संपदा अधिनियम, 2016 की धारा 31 के तहत शिकायत पत्र

शिकायतकर्ता:
${cName}
पता: ${cAddress}
संपर्क: ${cContact}
... शिकायतकर्ता

बनाम

${pName}
पता: ${pAddress}
... प्रतिवादी

1. शिकायत का विषय:
   परियोजना "${projName}" (पंजीकरण संख्या: ${regNo}) में फ्लैट का कब्जा समय पर न मिलने के कारण धारा 18 के तहत वैधानिक ब्याज की मांग।

2. शिकायतकर्ता का विवरण:
   नाम: ${cName}
   पता: ${cAddress}
   संपर्क: ${cContact}

3. प्रतिवादी का विवरण:
   नाम: ${pName}
   पता: ${pAddress}

4. संक्षिप्त तथ्य:
   (i) शिकायतकर्ता ने परियोजना "${projName}" में ${bookingDate} को फ्लैट बुक किया था।
   (ii) विक्रय समझौता ${agreementDate} को पंजीकृत किया गया था। कब्जा देने की तारीख ${promised} थी।
   (iii) प्रतिवादी कब्जा देने में असमर्थ रहा है और परियोजना वर्तमान में ${delay} दिन विलंबित है।
   (iv) महारेरा नियमों के तहत शिकायतकर्ता एसबीआई उच्चतम एमसीएलआर + 2% साधारण ब्याज (${rate}% वार्षिक) पर ब्याज का पात्र है।
   - मूलधन: ${amtPaid}
   - देय ब्याज: ${interest}
   - कुल राशि: ${total}

5. मांगी गई राहत:
   (i) प्रतिवादी को कब्जे में देरी के लिए धारा 18 के तहत ${interest} ब्याज देने का आदेश दिया जाए।
   (ii) वैध ओसी के साथ फ्लैट का कब्जा तुरंत दिलाया जाए।

6. घोषणा:
   मैं सत्यापित करता हूँ कि ऊपर दी गई जानकारी सत्य और सही है।

तिथि: ${today}
स्थान: मुंबई, महाराष्ट्र

शिकायतकर्ता के हस्ताक्षर`;
    }
  }

  // Haryana RERA (hr)
  if (stateId === "hr") {
    if (lang === "hi") {
      return `हरियाणा रियल एस्टेट नियामक प्राधिकरण (एचआरईआरए)

अधिनियम की धारा 31 के तहत शिकायत
कब्जे में देरी के ब्याज के लिए (धारा 18)

शिकायत संख्या: ..........................
दाकिल तिथि: ${today}

शिकायतकर्ता:
${cName}
पता: ${cAddress}
संपर्क: ${cContact}
... शिकायतकर्ता

बनाम

${pName}
पता: ${pAddress}
... प्रतिवादी

1. शिकायतकर्ता का विवरण:
   नाम: ${cName}
   पता: ${cAddress}

2. प्रतिवादी का विवरण:
   नाम: ${pName}
   पता: ${pAddress}

3. परियोजना विवरण:
   परियोजना का नाम: ${projName}
   एचआरईआरए पंजीकरण संख्या: ${regNo}

4. तथ्य:
   (i) शिकायतकर्ता ने "${projName}" में ${bookingDate} को बुकिंग की और कुल ${amtPaid} का भुगतान किया।
   (ii) अनुबंध ${agreementDate} को हस्ताक्षरित किया गया। कब्जा देने की तिथि ${promised} थी।
   (iii) प्रतिवादी कब्जा देने में विफल रहा है और कुल देरी ${delay} दिन है।
   - एचआरईआरए नियमों (एसबीआई एमसीएलआर + 2% साधारण ब्याज) के तहत दर ${rate}% वार्षिक है।
   - अर्जित ब्याज: ${interest}।
   - कुल दावा: ${total}।

5. राहत:
   (i) प्रतिवादी को धारा 18 के तहत विलंब अवधि के लिए ${interest} ब्याज का भुगतान करने का आदेश दिया जाए।
   (ii) मुकदमेबाजी व्यय के लिए मुआवजा दिया जाए।

6. घोषणा:
   शिकायतकर्ता घोषित करता है कि तथ्य सत्य हैं।

तिथि: ${today}
स्थान: हरियाणा

शिकायतकर्ता के हस्ताक्षर`;
    }
  }

  // Default Language / English template fallback (and any non-translated combination)
  if (lang === "hi") {
    return `रियल एस्टेट नियामक प्राधिकरण, ${stateId ? stateId.toUpperCase() : "क्षेत्रीय"} रेरा

फॉर्म M
[धारा 31 देखें]
अधिनियम की धारा 31 के तहत शिकायत

दाखिल तिथि: ${today}

शिकायतकर्ता:
${cName}
पता: ${cAddress}
संपर्क: ${cContact}
... शिकायतकर्ता

बनाम

${pName}
पता: ${pAddress}
... प्रतिवादी

1. शिकायतकर्ता का विवरण:
   (i) शिकायतकर्ता का नाम: ${cName}
   (ii) पता: ${cAddress}

2. प्रतिवादी का विवरण:
   (i) प्रतिवादी का नाम: ${pName}
   (ii) पता: ${pAddress}

3. परियोजना का विवरण:
   (i) परियोजना का नाम: ${projName}
   (ii) रेरा पंजीकरण संख्या: ${regNo}

4. तथ्य:
   (i) शिकायतकर्ता ने ${bookingDate} को "${projName}" में बुकिंग की और ${amtPaid} का भुगतान किया।
   (ii) विक्रय समझौता ${agreementDate} को हस्ताक्षरित किया गया था, जिसमें कब्जा देने की तिथि ${promised} थी।
   (iii) प्रतिवादी वादा की गई तिथि तक कब्जा देने में विफल रहा है और कुल देरी ${delay} दिन है।
   - ब्याज दर: ${rate}% वार्षिक।
   - अर्जित ब्याज: ${interest}।
   - कुल दावा: ${total}।

5. राहत:
   (i) कब्जे में देरी के लिए धारा 18 के तहत ${interest} ब्याज देने का आदेश दिया जाए।
   (ii) इकाई का भौतिक कब्जा दिलाया जाए।

6. घोषणा:
   शिकायतकर्ता सत्यापित करता है कि तथ्य सही हैं।

तिथि: ${today}
स्थान: भारत

शिकायतकर्ता के हस्ताक्षर`;
  }
  
  if (lang === "mr") {
    return `स्थावर मालमत्ता नियामक प्राधिकरण, ${stateId ? stateId.toUpperCase() : "प्रादेशिक"} रेरा

फॉर्म M
[कलम ३१ अन्वये]
अधिनियम कलम ३१ अंतर्गत तक्रार

दाखल दिनांक: ${today}

तक्रारदार:
${cName}
पत्ता: ${cAddress}
संपर्क: ${cContact}
... तक्रारदार

विरुद्ध

${pName}
पत्ता: ${pAddress}
... प्रतिवादी

१. तक्रारदाराचा तपशील:
   (i) नाव: ${cName}
   (ii) पत्ता: ${cAddress}

२. प्रतिवादीचा तपशील:
   (i) नाव: ${pName}
   (ii) पत्ता: ${pAddress}

३. प्रकल्पाचे तपशील:
   (i) प्रकल्पाचे नाव: ${projName}
   (ii) रेरा नोंदणी क्रमांक: ${regNo}

४. तथ्ये:
   (i) तक्रारदाराने ${bookingDate} रोजी "${projName}" प्रकल्पात सदनिका बुक केली आणि ${amtPaid} भरले.
   (ii) खरेदी करार ${agreementDate} रोजी झाला, ज्यामध्ये ताबा देण्याची अंतिम तारीख ${promised} होती.
   (iii) प्रतिवादी वचनबद्ध तारखेला ताबा देण्यास असमर्थ ठरला आणि एकूण विलंब ${delay} दिवस आहे.
   - व्याज दर: ${rate}% प्रति वर्ष.
   - थकीत व्याज: ${interest}.
   - एकूण दावा: ${total}.

५. राहत/मागणी:
   (i) विलंबासाठी कलम १८ अंतर्गत ${interest} व्याज देण्याचे आदेश द्यावेत.
   (ii) सदनिकेचा ताबा देण्यात यावा.

६. पडताळणी:
   तक्रारदार घोषित करतो की वरील सर्व तपशील सत्य आहेत.

दिनांक: ${today}
स्थळ: भारत

तक्रारदाराची स्वाक्षरी`;
  }

  if (lang === "kn") {
    return `ರಿಯಲ್ ಎಸ್ಟೇಟ್ ನಿಯಂತ್ರಣ ಪ್ರಾಧಿಕಾರ, ${stateId ? stateId.toUpperCase() : "ಪ್ರಾದೇಶಿಕ"} ರೇರಾ

ಫಾರ್ಮ್ M
[ಸೆಕ್ಷನ್ 31 ನೋಡಿ]
ಸೆಕ್ಷನ್ 31 ರ ಅಡಿಯಲ್ಲಿ ದೂರು ಅರ್ಜಿ

ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ: ${today}

ನಡುವೆ:
${cName}
ವಿಳಾಸ: ${cAddress}
ಸಂಪರ್ಕ: ${cContact}
... ದೂರುದಾರರು

ಮತ್ತು

${pName}
ವಿಳಾಸ: ${pAddress}
... ಪ್ರತಿವಾದಿ(ಗಳು)

1. ದೂರುದಾರರ ವಿವರಗಳು:
   (i) ಹೆಸರು: ${cName}
   (ii) ವಿಳಾಸ: ${cAddress}

2. ಪ್ರತಿವಾದಿಯ ವಿವರಗಳು:
   (i) ಹೆಸರು: ${pName}
   (ii) ವಿಳಾಸ: ${pAddress}

3. ಯೋಜನೆಯ ವಿವರಗಳು:
   (i) ಯೋಜನೆಯ ಹೆಸರು: ${projName}
   (ii) ರೇರಾ ನೋಂದಣಿ ಸಂಖ್ಯೆ: ${regNo}

4. ಪ್ರಕರಣದ ಸತ್ಯಾಂಶಗಳು:
   (i) ದೂರುದಾರರು ${bookingDate} ರಂದು "${projName}" ನಲ್ಲಿ ಯುನಿಟ್ ಬುಕ್ ಮಾಡಿದ್ದರು ಮತ್ತು ${amtPaid} ಪಾವತಿಸಿದ್ದಾರೆ.
   (ii) ದಿನಾಂಕ ${agreementDate} ರಂದು ಒಪ್ಪಂದ ಮಾಡಿಕೊಳ್ಳಲಾಗಿದ್ದು, ಅದರಂತೆ ${promised} ರೊಳಗೆ ಸ್ವಾಧೀನ ನೀಡಬೇಕಾಗಿತ್ತು.
   (iii) ಪ್ರತಿವಾದಿಯು ಸ್ವಾಧೀನ ನೀಡಲು ವಿಫಲರಾಗಿದ್ದು, ಸದ್ಯಕ್ಕೆ ${delay} ದಿನಗಳ ವಿಳಂಬವಾಗಿದೆ.
   - ಬಡ್ಡಿ ದರ: ಶೇ. ${rate} ರಷ್ಟು ವಾರ್ಷಿಕ.
   - ಸಂಚಿತ ಬಡ್ಡಿ: ${interest}.
   - ಒಟ್ಟು ಹಕ್ಕು ಮೊತ್ತ: ${total}.

5. ಕೋರಿದ ಪರಿಹಾರಗಳು:
   (i) ವಿಳಂಬ ಅವಧಿಗೆ ಸೆಕ್ಷನ್ 18 ರ ಅಡಿಯಲ್ಲಿ ${interest} ಬಡ್ಡಿಯನ್ನು ಪಾವತಿಸಲು ಪ್ರತಿವಾದಿಗೆ ನಿರ್ದೇಶಿಸಬೇಕು.
   (ii) ಯುನಿಟ್‌ನ ಸ್ವಾಧೀನ ನೀಡಲು ಆದೇಶಿಸಬೇಕು.

6. ಘೋಷಣೆ:
   ದೂರುದಾರರು ಪ್ರಕರಣದ ವಿವರಗಳು ಸತ್ಯವೆಂದು ಘೋಷಿಸುತ್ತಾರೆ.

ದಿನಾಂಕ: ${today}
ಸ್ಥಳ: ಭಾರತ

ದೂರುದಾರರ ಸಹಿ`;
  }

  // English Template (default)
  return `BEFORE THE REAL ESTATE REGULATORY AUTHORITY, ${stateId ? stateId.toUpperCase() : "REGIONAL"} RERA

FORM M
[See Section 31]
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
