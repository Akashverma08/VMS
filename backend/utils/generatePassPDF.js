// utils/generatePassPDF.js
const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");

/**
 * Generate visitor pass PDF.
 * 1. Tries Puppeteer → captures styled React page as PDF.
 * 2. Falls back to PDFKit → simple text layout.
 * @param {Object} visitorData - Visitor details
 * @param {string} frontendBaseUrl - Frontend base URL (e.g., http://localhost:3000)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePassPDF(visitorData, frontendBaseUrl) {
  let browser;

  try {
    console.log(`📄 Starting PDF generation for visitor: ${visitorData._id}`);
    console.log("🚀 Using Chrome path:", process.env.CHROME_PATH || "Bundled Chromium");

    // Launch Puppeteer (system Chrome if CHROME_PATH is set, else bundled Chromium)
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Construct the QR page URL
    const url = `${frontendBaseUrl.replace(/\/$/, "")}/qrcode/${visitorData._id}`;
    console.log("🌐 Navigating to URL:", url);

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // ✅ Ensure React pass page is ready
    await page.waitForSelector("#pass-ready", { timeout: 15000 });

    // ✅ Use print CSS (important for hiding navbar/footer with @media print)
    await page.emulateMediaType("print");

    console.log("⚡ Generating PDF via Puppeteer...");
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // respect CSS @page size
      format: "A4",
      margin: { top: "0", right: "0", bottom: "0", left: "0" }, // no extra margin
    });

    console.log("✅ PDF generated successfully (Puppeteer)");
    return pdfBuffer;
  } catch (error) {
    console.error("❌ Puppeteer PDF failed:", error.message);
    console.log("➡️ Falling back to PDFKit...");
    return generateFallbackPDF(visitorData);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn("⚠️ Browser close failed:", closeErr.message);
      }
    }
  }
}

/**
 * Fallback PDF generator using PDFKit (simple layout)
 * @param {Object} visitorData - Visitor details
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateFallbackPDF(visitorData) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Header
    doc
      .fontSize(22)
      .fillColor("#2c3e50")
      .text("VISITOR PASS", { align: "center" })
      .moveDown(2);

    // Visitor details
    doc.fontSize(14).fillColor("black");
    const details = [
      { label: "Name", value: visitorData.name },
      { label: "Visitor Code", value: visitorData.visitorCode || visitorData._id },
      { label: "Purpose", value: visitorData.purpose },
      { label: "To Meet", value: visitorData.toMeet },
      { label: "Status", value: visitorData.status },
      { label: "Approved By", value: visitorData.approvedBy },
    ];

    details.forEach((field) => {
      if (field.value) doc.text(`${field.label}: ${field.value}`);
    });

    doc.moveDown();

    // Footer
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
  });
}

module.exports = { generatePassPDF };
