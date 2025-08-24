const crypto = require("crypto");
const Visitor = require("../models/Visitor");
const QRCode = require("qrcode");
const { sendMail } = require("../utils/mailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { sendApprovalMail, sendRejectionMail } = require("../utils/mailer");

// Helper: generate visitor code
const generateVisitorCode = () => {
  return `LOGIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Helper: generate PDF pass
const generateVisitorPass = async (visitor) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 40 });
      const filePath = path.join(tempDir, `pass_${visitor._id}.pdf`);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(18).text("Visitor Pass", { align: "center" });
      doc.moveDown();

      // Add Logo (optional)
      const logoPath = path.join(__dirname, "../logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { fit: [80, 80], align: "center" });
        doc.moveDown();
      }

      // Visitor Info
      doc.fontSize(12).text(`Visitor Name: ${visitor.name}`);
      doc.text(`Visitor Code: ${visitor.visitorCode}`);
      doc.text(`Meeting With: ${visitor.toMeet}`);
      doc.text(`Purpose: ${visitor.purpose}`);
      doc.text(`Date: ${new Date(visitor.createdAt).toLocaleDateString()}`);
      doc.text(`Time: ${new Date(visitor.createdAt).toLocaleTimeString()}`);
      doc.moveDown();

      // QR Code
      if (visitor.qrCode) {
        const qrImageBuffer = Buffer.from(visitor.qrCode.split(",")[1], "base64");
        const qrPath = path.join(tempDir, `qr_${visitor._id}.png`);
        fs.writeFileSync(qrPath, qrImageBuffer);
        doc.image(qrPath, { fit: [150, 150], align: "center" });
        
        // Clean up QR temp file after adding to PDF
        setTimeout(() => {
          if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
          }
        }, 1000);
      }

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

// 📌 Register Visitor
exports.registerVisitor = async (req, res) => {
  try {
    const { name, mobile, email, aadhar, purpose, toMeet, photo } = req.body;

    if (!name || !mobile || !photo || !aadhar || !purpose) {
      return res.status(400).json({
        success: false,
        error: "Name, mobile, Aadhaar, purpose, and photo are required"
      });
    }

    const hostEmail = "akashverma0401@gmail.com";

    const visitorCode = generateVisitorCode();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 min expiry
    const approvalToken = crypto.randomBytes(16).toString("hex"); // ADDED
    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // ADDE

    // Generate QR first
    const qrData = JSON.stringify({
      code: visitorCode,
      expiresAt: expiresAt.toISOString(),
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);

    const newVisitor = new Visitor({
      name,
      mobile,
      hostEmail,
      email,
      aadhar,
      purpose,
      toMeet,
      photo,
      visitorCode,
      status: "pending",
      expiresAt,
      qrCode: qrCodeImage,
      approvalToken,       // ADDED
      tokenExpiresAt, 
    });

    const savedVisitor = await newVisitor.save();

    // 🔹 Approve / Reject links for HOST
    const baseUrl = process.env.HOST_DECISION_BASE_URL || "http://localhost:5000/api";
    const approveLink = `${baseUrl}/visitors/decision/${savedVisitor._id}?status=approved`; // CHANGED to _id
    const rejectLink = `${baseUrl}/visitors/decision/${savedVisitor._id}?status=rejected`;   // CHANGED to _id

    // 🔹 Mail → HOST
    const mailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3>New Visitor Request</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Mobile:</b> ${mobile}</p>
        <p><b>Purpose:</b> ${purpose}</p>
        <p><b>Visitor Code:</b> ${visitorCode}</p>
        <p><b>Expires at:</b> ${expiresAt.toLocaleTimeString()}</p>
        <br/>
        <div>
          <a href="${approveLink}" style="background: green; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px;">✅ Approve</a>
          <a href="${rejectLink}" style="background: red; color: white; padding: 10px 20px; text-decoration: none;">❌ Reject</a>
        </div>
        <br/>
        <img src="${qrCodeImage}" alt="QR Code" width="150" />
      </div>
    `;

    await sendMail(hostEmail, "New Visitor Registered", mailHtml);

    res.status(201).json({
      success: true,
      data: savedVisitor,
    });
  } catch (err) {
    console.error("Error in registerVisitor:", err);
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};

// 📌 Update Visitor Status (Approve/Reject)
exports.updateVisitorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).json({ success: false, error: "Visitor not found" });

    visitor.status = status.toLowerCase();
    visitor.decisionAt = new Date();
    await visitor.save();

    // Send email based on status
    if (visitor.email) {
      if (status.toLowerCase() === "approved") {
        await sendApprovalMail(visitor.email, visitor.name, visitor);
      } else {
        await sendRejectionMail(visitor.email, visitor.name);
      }
    }

    res.json({ success: true, data: visitor });
  } catch (err) {
    console.error("Error in updateVisitorStatus:", err);
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};

// 📌 Handle Approve/Reject via Email Link
exports.visitorDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Visitor Not Found</h1>
          <p>The visitor record could not be found.</p>
        </body>
      </html>
    `);

    if (!["approved", "rejected"].includes(status.toLowerCase())) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Invalid Status</h1>
            <p>Please use 'approved' or 'rejected' status.</p>
          </body>
        </html>
      `);
    }

    visitor.status = status.toLowerCase();
    visitor.decisionAt = new Date();
    await visitor.save();

    // Send email based on status
    if (visitor.email) {
      if (status.toLowerCase() === "approved") {
        await sendApprovalMail(visitor.email, visitor.name, visitor);
      } else {
        await sendRejectionMail(visitor.email, visitor.name);
      }
    }

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ Visitor ${status}</h1>
          <p>Visitor ${visitor.name} has been ${status}.</p>
          <p>An email has been sent to the visitor.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error in visitorDecision:", err);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Server Error</h1>
          <p>An error occurred while processing your request.</p>
        </body>
      </html>
    `);
  }
};

// 📌 Get all visitors
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: visitors });
  } catch (err) {
    console.error("Error in getAllVisitors:", err);
    res.status(500).json({ success: false, error: "Server error: " + err.message });
  }
};