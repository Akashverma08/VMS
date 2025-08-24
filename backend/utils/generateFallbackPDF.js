const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate Fallback PDF (when Puppeteer fails)
 * @param {Object} visitor - Visitor object with all details
 * @returns {Promise<Buffer>}
 */
async function generateFallbackPDF(visitor) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      /* -------------------------------
         Background (light gradient style)
      -------------------------------- */
      doc.rect(0, 0, doc.page.width, doc.page.height)
        .fill("#e0f7fa");

      // Reset fill for content
      doc.fillColor("black");

      /* -------------------------------
         Card Container
      -------------------------------- */
      const cardX = 70;
      const cardY = 80;
      const cardWidth = doc.page.width - 140;
      const cardHeight = 500;

      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 20)
        .fill("#ffffff")
        .strokeColor("#cccccc")
        .lineWidth(1)
        .stroke();

      // Move inside card
      doc.fillColor("#000000");

      /* -------------------------------
         Header (Title + Logo)
      -------------------------------- */
      doc.fontSize(20).fillColor("#1e3d59").font("Helvetica-Bold");
      doc.text("Visitor Gate Pass", cardX, cardY + 20, {
        align: "center",
        width: cardWidth,
      });

      // Sub text
      doc.fontSize(10).fillColor("gray").font("Helvetica");
      doc.text("Issued by LogicLens", cardX, cardY + 50, {
        align: "center",
        width: cardWidth,
      });

      // Add Logo (if available in /public/logo.png)
      const logoPath = path.join(__dirname, "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, cardX + cardWidth / 2 + 50, cardY + 35, {
          width: 20,
          height: 20,
        });
      }

      /* -------------------------------
         Profile Image (Circle Crop)
      -------------------------------- */
      if (visitor.photoPath && fs.existsSync(visitor.photoPath)) {
        const imgX = cardX + cardWidth / 2 - 50;
        const imgY = cardY + 80;
        doc.save();
        doc.circle(imgX + 50, imgY + 50, 50).clip(); // circular mask
        doc.image(visitor.photoPath, imgX, imgY, { width: 100, height: 100 });
        doc.restore();
      }

      /* -------------------------------
         Visitor Name
      -------------------------------- */
      doc.fontSize(16).fillColor("#1e3d59").font("Helvetica-Bold");
      doc.text(visitor.name || "N/A", cardX, cardY + 200, {
        align: "center",
        width: cardWidth,
      });

      /* -------------------------------
         Visitor Details
      -------------------------------- */
      doc.fontSize(12).fillColor("#000000").font("Helvetica");

      const details = [
        { label: "Visitor Code", value: visitor.visitorCode, color: "blue" },
        { label: "Date & Time", value: new Date(visitor.createdAt).toLocaleString() },
        { label: "Status", value: `✅ APPROVED by ${visitor.approvedBy}`, color: "green" },
      ];

      let detailY = cardY + 240;
      details.forEach((d) => {
        doc.font("Helvetica-Bold").fillColor("#333333").text(d.label + ": ", cardX + 100, detailY, { continued: true });
        doc.font("Helvetica").fillColor(d.color || "#000000").text(d.value || "N/A");
        detailY += 30;
      });

      /* -------------------------------
         Footer Strip (Green Bar)
      -------------------------------- */
      doc.rect(cardX, cardY + cardHeight - 50, cardWidth, 50).fill("#2ecc71");

      doc.fontSize(16).fillColor("#ffffff").font("Helvetica-Bold");
      doc.text("GATE PASS", cardX, cardY + cardHeight - 40, {
        align: "center",
        width: cardWidth,
      });

      // End PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateFallbackPDF };
