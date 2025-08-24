const nodemailer = require("nodemailer");
require("dotenv").config();
const { generatePassPDF } = require("./generatePassPDF"); // Fixed function name

// 📌 Setup transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Important for some SMTP servers
  }
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log("❌ SMTP Connection error:", error);
  } else {
    console.log("✅ SMTP Server is ready to send emails");
  }
});

const sendApprovalMail = async (to, visitorName, visitor) => {
  try {
    console.log(`📧 Preparing approval email for: ${visitorName} (${to})`);

    // ✅ Generate PDF as Buffer (not file path)
    const pdfBuffer = await generatePassPDF(visitor._id.toString(), process.env.FRONTEND_BASE_URL);

    // Format date/time
    const visitDate = new Date(visitor.createdAt).toLocaleDateString();
    const visitTime = new Date(visitor.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f9f9f9; border: 1px solid #eee;">
        <h2 style="color: #28a745;">✅ Approval Confirmed</h2>
        <p>Hello <strong>${visitorName}</strong>,</p>
        <p>Your visitor request has been <span style="color: #28a745; font-weight: bold;">APPROVED</span>.</p>

        <h3>📌 Visit Details</h3>
        <ul style="line-height: 1.6; color: #333; padding-left: 15px;">
          <li><strong>Visitor ID:</strong> ${visitor.visitorCode}</li>
          <li><strong>Host Name:</strong> ${visitor.toMeet}</li>
          <li><strong>Date:</strong> ${visitDate}</li>
          <li><strong>Time:</strong> ${visitTime}</li>
        </ul>

        <p style="margin-top: 15px; color: #555;">
          Please find your attached visitor pass (PDF). Show it at the gate.
        </p>

        <p style="margin-top: 25px; font-size: 0.9rem; color: #888;">
          Issued by <strong>LogicLens</strong>
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject: "✅ Your Visitor Request Approved",
      html,
      attachments: [
        {
          filename: `visitor-pass-${visitor.visitorCode}.pdf`,
          content: pdfBuffer, // Use Buffer directly
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Email sent with PDF:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending approval email:", error.message);
    throw error; // Re-throw to handle in the route
  }
};

// Add other email functions you might need
const sendRejectionMail = async (to, visitorName) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #dc3545;">❌ Visit Request Declined</h2>
        <p>Hello <strong>${visitorName}</strong>,</p>
        <p>We regret to inform you that your visitor request has been declined.</p>
        <p>Please contact the reception for more information.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject: "Visitor Request Declined",
      html,
    });

    console.log("✅ Rejection email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending rejection email:", error.message);
    throw error;
  }
};

module.exports = { 
  sendApprovalMail, 
  sendRejectionMail,
  transporter // Export transporter for other uses
};