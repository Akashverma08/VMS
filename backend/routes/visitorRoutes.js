// backend/routes/visitorRoutes.js
const crypto = require("crypto");
const express = require("express");
const QRCode = require("qrcode");
const Visitor = require("../models/Visitor");
const nodemailer = require("nodemailer");
const { generatePassPDF } = require("../utils/generatePassPDF");



const router = express.Router();

/* -------------------------------
   📧 Setup SMTP Transport with better error handling
-------------------------------- */
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // Use false for port 587, true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // For self-signed certificates
    }
  });

  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log("❌ SMTP Connection failed:", error);
    } else {
      console.log("✅ SMTP Server is ready to take our messages");
    }
  });
} catch (error) {
  console.error("❌ SMTP Configuration error:", error);
}

/* -------------------------------
   🔑 Utility Functions
-------------------------------- */
const generateVisitorCode = () =>
  `LOGIC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const sendEmail = async (options) => {
  if (!transporter) {
    console.error("❌ SMTP transporter not initialized");
    return null;
  }

  try {
    // Set default from address
    options.from = options.from || process.env.FROM_EMAIL;
    
    const info = await transporter.sendMail(options);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    console.error("❌ Error details:", err);
    return null;
  }
};

/* -------------------------------
   📌 Routes
-------------------------------- */

// ✅ Get all visitors
router.get("/", async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: visitors });
  } catch (err) {
    console.error("❌ Error fetching visitors:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Register visitor
router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, aadhar, purpose, toMeet, hostEmail, photo } = req.body;
    
    // Validation
    if (!name || !mobile || !aadhar || !purpose || !photo || !hostEmail) {
      return res.status(400).json({
        success: false,
        error: "Name, mobile, Aadhaar, purpose, photo, and host email are required.",
      });
    }

    const visitorCode = generateVisitorCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Generate QR code
    const qrPayload = { 
      code: visitorCode, 
      name, 
      expiresAt: expiresAt.toISOString() 
    };
    const qrImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

    const approvalToken = crypto.randomBytes(16).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const visitor = new Visitor({
      name,
      email: email || '',
      mobile,
      aadhar,
      purpose,
      toMeet: toMeet || '',
      hostEmail,
      photo,
      status: "pending",
      visitorCode,
      qrCode: qrImage,
      expiresAt,
      approvalToken,
      tokenExpiresAt,
    });

    await visitor.save();

    // Emit socket event if available
    if (req.app.get("io")) {
      req.app.get("io").emit("visitorRegistered", visitor);
    }

    // Create approval links
    const baseUrl = process.env.HOST_DECISION_BASE_URL || "http://localhost:5000/api";
    const approveLink = `${baseUrl}/visitors/decision/${visitor.approvalToken}?status=approved`;
    const rejectLink = `${baseUrl}/visitors/decision/${visitor.approvalToken}?status=rejected`;

    // Send email to host
    const emailResult = await sendEmail({
      to: hostEmail,
      subject: `Approval Needed: Visitor ${name} wants to meet you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Visitor Approval Request</h2>
          <p>Hello,</p>
          <p>You have a visitor waiting for approval:</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Aadhar:</strong> ${aadhar}</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
            ${toMeet ? `<p><strong>To Meet:</strong> ${toMeet}</p>` : ''}
          </div>
          
          <p>Please click one of the buttons below to approve or reject this visitor:</p>
          
          <div style="margin: 25px 0;">
            <a href="${approveLink}" style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; margin-right: 15px;">Approve Visitor</a>
            <a href="${rejectLink}" style="background: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;">Reject Visitor</a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This link will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult) {
      console.warn("⚠️ Host email might not have been sent");
    }

    res.status(201).json({ 
      success: true, 
      data: visitor,
      message: "Visitor registered successfully. Approval email sent to host."
    });

  } catch (err) {
    console.error("❌ Error registering visitor:", err);
    res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

// ✅ Host decision via email link
router.get("/decision/:token", async (req, res) => {
  const { token } = req.params;
  const { status } = req.query;

  try {
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Invalid Decision</h1>
            <p>Please use a valid decision link.</p>
          </body>
        </html>
      `);
    }

    const visitor = await Visitor.findOne({ approvalToken: token });
    if (!visitor) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Invalid or Expired Link</h1>
            <p>This approval link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    if (visitor.tokenExpiresAt && new Date() > visitor.tokenExpiresAt) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Link Expired</h1>
            <p>This approval link has expired.</p>
          </body>
        </html>
      `);
    }

    if (visitor.status !== "pending") {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>⚠️ Already Processed</h1>
            <p>This visitor request has already been ${visitor.status}.</p>
          </body>
        </html>
      `);
    }

    // Update visitor status
    visitor.status = status;
    visitor.decisionAt = new Date();
    if (status === "approved") {
      visitor.approvedBy = visitor.toMeet || "Host";
    }
    await visitor.save();

    // Send email to visitor based on decision
    if (visitor.email) {
      if (status === "approved") {
        try {
          console.log(`Generating PDF for approved visitor: ${visitor._id}`);

          // ✅ Pass full visitor object instead of just ID
          const pdfBuffer = await generatePassPDF(
            visitor, 
            process.env.FRONTEND_BASE_URL
          );

          await sendEmail({
            to: visitor.email,
            subject: "✅ Your Visit Has Been Approved - Visitor Pass Attached",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Visit Approved!</h2>
                <p>Dear ${visitor.name},</p>
                <p>Your visit request has been <strong>approved</strong>.</p>
                <p>Your visitor details:</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Visitor Code:</strong> ${visitor.visitorCode}</p>
                  <p><strong>Purpose:</strong> ${visitor.purpose}</p>
                  <p><strong>Approved By:</strong> ${visitor.approvedBy}</p>
                </div>
                <p>Please find your visitor pass attached to this email. Show it at the reception when you arrive.</p>
                <p style="color: #666;">This is an automated message. Please do not reply to this email.</p>
              </div>
            `,
            attachments: [
              {
                filename: `visitor-pass-${visitor.visitorCode}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
        } catch (pdfError) {
          console.error("❌ PDF generation failed, sending approval email without PDF:", pdfError);

          await sendEmail({
            to: visitor.email,
            subject: "✅ Your Visit Has Been Approved",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Visit Approved!</h2>
                <p>Dear ${visitor.name},</p>
                <p>Your visit request has been <strong>approved</strong>.</p>
                <p>Your visitor details:</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Visitor Code:</strong> ${visitor.visitorCode}</p>
                  <p><strong>Purpose:</strong> ${visitor.purpose}</p>
                  <p><strong>Approved By:</strong> ${visitor.approvedBy}</p>
                </div>
                <p>Please show your visitor code at the reception when you arrive.</p>
                <p style="color: #666;">This is an automated message. Please do not reply to this email.</p>
              </div>
            `,
          });
        }
      } else {
        // Rejected
        await sendEmail({
          to: visitor.email,
          subject: "❌ Your Visit Request Has Been Declined",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc3545;">Visit Declined</h2>
              <p>Dear ${visitor.name},</p>
              <p>We regret to inform you that your visit request has been <strong>declined</strong>.</p>
              <p>If you believe this is an error, please contact the reception.</p>
              <p style="color: #666;">This is an automated message. Please do not reply to this email.</p>
            </div>
          `,
        });
      }
    }

    // Emit socket event for real-time updates
    if (req.app.get("io")) {
      req.app.get("io").emit("visitorDecision", visitor);
    }

    // Send success response
    return res.send(`
      <html>
        <head>
          <title>Visitor ${status}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .success { color: #28a745; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="${status === 'approved' ? 'success' : 'error'}">
              ✅ Visitor <span style="color: #333;">${visitor.name}</span> has been <b>${status.toUpperCase()}</b>
            </h1>
            <p>An email notification has been sent to the visitor.</p>
            <p>You can safely close this window.</p>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("❌ Decision error:", err);
    return res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Server Error</h1>
          <p>An unexpected error occurred. Please try again or contact support.</p>
          <p style="color: #666; font-size: 12px;">Error: ${err.message}</p>
        </body>
      </html>
    `);
  }
});


// ✅ Get single visitor by ID (NEW ROUTE)
router.get("/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, error: "Visitor not found" });
    }
    res.json({ success: true, data: visitor });
  } catch (err) {
    console.error("❌ Error fetching visitor:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;