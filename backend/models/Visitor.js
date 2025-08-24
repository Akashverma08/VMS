// models/Visitor.js
const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String }, // optional, visitor may not always have
    mobile: { type: String, required: true },
    aadhar: { type: String, required: true },
    purpose: { type: String, required: true },
    toMeet: { type: String },
    otherPerson: String,
    photo: { type: String, required: true }, // base64 from webcam

    // 🔑 Visitor Code + QR
    visitorCode: { type: String, unique: true },
    qrData: String,
    qrCode: String, // Data URL (PNG image of QR)

    // 🔑 Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"], // lowercase
      default: "pending",
      index: true,
    },

    // 🔑 Optional approval/rejection audit
    approvalToken: String, 
    tokenExpiresAt: Date,
    decisionAt: Date,

    // 🔑 Host details
    hostEmail: String,
    hostPhone: String,
    // ✅ NEW FIELD: who approved
    approvedBy: { type: String, default: null }, 

  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", VisitorSchema);
