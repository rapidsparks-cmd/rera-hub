import { jsPDF } from "jspdf";

/**
 * Downloads a plain text block as a styled Word Document (.doc) compatible with MS Word,
 * Google Docs, LibreOffice, etc.
 * @param {string} filename - The output file name (e.g. karnataka_form_m.doc).
 * @param {string} text - The plain text legal document.
 */
export function downloadAsWord(filename, text) {
  // Convert line breaks and spacing into HTML paragraphs
  const htmlContent = text
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (trimmed === "") return "<p>&nbsp;</p>";
      
      // Basic formatting for titles
      const isTitle =
        trimmed.startsWith("BEFORE THE") ||
        trimmed.startsWith("FORM M") ||
        trimmed.startsWith("COMPLAINT UNDER") ||
        trimmed.startsWith("COMPLAINT Registration") ||
        trimmed.startsWith("In the matter of:") ||
        trimmed.startsWith("VERSUS") ||
        trimmed.startsWith("Between:") ||
        trimmed.startsWith("And");
      
      if (isTitle) {
        return `<p style="text-align: center; font-weight: bold; text-transform: uppercase;">${line.replace(/\s/g, "&nbsp;")}</p>`;
      }
      return `<p style="text-indent: 0.25in; text-align: justify;">${line.replace(/\s/g, "&nbsp;")}</p>`;
    })
    .join("");

  const header = `
    <html xmlns:o="urn:schemas-microsoft-doc:office:document" xmlns:w="urn:schemas-microsoft-doc:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <title>RERA Complaint Form</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 1in;
        }
        p {
          margin: 0;
          margin-bottom: 6pt;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
  
  const blob = new Blob([header], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : filename + ".doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a plain text block as a well-aligned A4 legal PDF using jsPDF.
 * Handles page margins, text wrapping, and page overflow.
 * @param {string} filename - The output file name (e.g. karnataka_form_m.pdf).
 * @param {string} text - The plain text legal document.
 */
export function downloadAsPDF(filename, text) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // 20mm margins
  const contentWidth = pageWidth - (margin * 2);

  doc.setFont("Times", "normal");
  doc.setFontSize(10.5);

  const lines = text.split("\n");
  let y = margin;
  const lineHeight = 6.2; // mm spacing between lines

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Style check for centering
    const isTitle =
      trimmed.startsWith("BEFORE THE") ||
      trimmed.startsWith("FORM M") ||
      trimmed.startsWith("COMPLAINT UNDER") ||
      trimmed.startsWith("COMPLAINT Registration") ||
      trimmed.startsWith("In the matter of:") ||
      trimmed.startsWith("VERSUS") ||
      trimmed.startsWith("Between:") ||
      trimmed.startsWith("And");

    if (isTitle) {
      doc.setFont("Times", "bold");
      const splitHeader = doc.splitTextToSize(line, contentWidth);
      splitHeader.forEach((hLine) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        const textWidth = doc.getTextWidth(hLine);
        const x = margin + (contentWidth - textWidth) / 2;
        doc.text(hLine, x, y);
        y += lineHeight;
      });
      doc.setFont("Times", "normal");
    } else {
      // Indent numbered lists or headers slightly differently, or just wrap
      const isBoldHeader = trimmed.match(/^\d+\.\s+/) || trimmed.startsWith("Signature");
      if (isBoldHeader) {
        doc.setFont("Times", "bold");
      }

      const wrappedLines = doc.splitTextToSize(line, contentWidth);
      wrappedLines.forEach((wLine) => {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wLine, margin, y);
        y += lineHeight;
      });
      
      if (isBoldHeader) {
        doc.setFont("Times", "normal");
      }
    }

    // Add extra padding for empty paragraphs
    if (trimmed === "") {
      y += 2.5;
    }
  });

  doc.save(filename.endsWith(".pdf") ? filename : filename + ".pdf");
}
