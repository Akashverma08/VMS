import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function VisitorForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    aadhar: "",
    purpose: "",
    toMeet: "",
    otherPerson: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const personsList = [
  { name: "GAURAV BHALOTIA", email: "akashverma0401@gmail.com" },
  { name: "NAVEEN BHALOTIA", email: "akashverm0701@gmail.com" },
  { name: "ASHWINI KUMAR", email: "akashverma0401@gmail.com" },
  { name: "SHAFIQULLAH", email: "akashverm0701@gmail.com" },
  { name: "SHAILENDRA SINGH", email: "akashverm0701@gmail.com" },
  { name: "NIRAJ KISHORE", email: "akashverm0701@gmail.com" },
  ];


  // handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // open webcam
  const handleOpenCamera = () => setIsCameraOpen(true);

  // capture photo
  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhotoUrl(imageSrc);
      setIsCameraOpen(false);
    }
  };

  // form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !photoUrl
    ) {
      toast.warn("⚠️ Please fill in Name, Email, Mobile, and capture a Photo before submitting.");
      return;
    }

    // find selected host
    const selectedHost = personsList.find(
    (p) => p.name === formData.toMeet
    );

    const payload = {
      name: formData.name,
      email: formData.email, // visitor email
      mobile: formData.mobile,
      aadhar: formData.aadhar,
      purpose: formData.purpose,
      hostEmail: selectedHost?.email || "default@gmail.com", // 👈 dynamic host email
      toMeet: formData.toMeet ,
      photo: photoUrl,
    };





    try {
      setLoading(true);
      setStep(2);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/visitors/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success || !data?.data?._id) {
        throw new Error(data?.error || "Registration failed, please try again.");
      }

      toast.success("✅ Visitor registered successfully!");
      navigate(`/loading/${data.data._id}`);

      setFormData({
        name: "",
        email: "",
        mobile: "",
        aadhar: "",
        purpose: "",
        toMeet: "",
        otherPerson: "",
      });
      setPhotoUrl("");
      setIsCameraOpen(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(`⚠️ ${err.message || "Error submitting form. Check server connection."}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column"
      style={{ background: "linear-gradient(to right, #4ba9d1, #f1f8e9)" }}
    >
      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />

<header 
  className="d-flex align-items-center justify-content-between shadow-sm bg-white px-4" 
  style={{ 
    background: "#2c3e50",
    color: "black",
    position: "fixed", 
    top: 0, 
    left: 0, 
    width: "100%", 
    height: "80px",   // Increased height
    zIndex: 1000 
  }}
>
  {/* Logo + Brand */}
  <div className="d-flex align-items-center">
    <img
      src="/logo.png"
      alt="Logo"
      style={{ height: "60px", marginRight: "12px" }}
    />
    <h4 className="fw-bold m-0">LogicLens</h4>
  </div>

  {/* Title */}
  <h1 className="fw-bold text-center m-0 flex-grow-1">
    LogicLens - Visitor Management System
  </h1>

  <div style={{ minWidth: "220px" }}></div>
</header>



{/* Push page content down so it's not hidden under navbar */}
<div style={{ marginTop: "90px" }}></div>

      {/* Form Section */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-start py-4 overflow-auto">
        <div
          className="card shadow-lg border-0 p-5 w-100"
          style={{ maxWidth: "900px", borderRadius: "20px" }}
        >
          {/* Step Indicator */}
          <div className="text-center mb-4">
            <h2 className="fw-bold mb-2">Visitor Details</h2>
            <p className="text-muted">Enter the details to continue</p>
          </div>

          <div className="d-flex justify-content-center mb-4">
            <div className="d-flex align-items-center">
              <span className={`badge rounded-circle ${step === 1 ? "bg-primary" : "bg-success"} p-3`}>1</span>
              <span className="ms-2 fw-semibold">General Details</span>
            </div>
            <div className="mx-3">──</div>
            <div className={`d-flex align-items-center ${step === 2 ? "" : "text-muted"}`}>
              <span className={`badge rounded-circle ${step === 2 ? "bg-primary" : "bg-light border"} p-3`}>2</span>
              <span className="ms-2">Loading</span>
            </div>
            <div className="mx-3">──</div>
            <div className="d-flex align-items-center text-muted">
              <span className="badge rounded-circle bg-light border p-3">3</span>
              <span className="ms-2">Pass Generation</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name & Contact */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-lg"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Contact Number</label>
                <input
                  type="tel"
                  name="mobile"
                  className="form-control form-control-lg"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  title="Mobile must be 10 digits"
                  required
                />
              </div>
            </div>

            {/* Email & Aadhaar */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Aadhar Number</label>
                <input
                  type="text"
                  name="aadhar"
                  className="form-control form-control-lg"
                  placeholder="Enter Aadhaar number"
                  value={formData.aadhar}
                  onChange={handleChange}
                  pattern="[0-9]{12}"
                  title="Aadhaar must be 12 digits"
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Purpose of Visit</label>
              <textarea
                type="text"
                name="purpose"
                className="form-control form-control-lg"
                placeholder="Enter purpose"
                value={formData.purpose}
                onChange={handleChange}
              />
            </div>

            {/* Person to Meet */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Person to Meet</label>
              <select
              name="toMeet"
              className="form-select form-select-lg"
              value={formData.toMeet}
              onChange={handleChange}
              required
              >
                <option value="">Select Person</option>
                {personsList.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                </option>
                ))}
              </select>

            </div>

            

            {/* Camera */}
            {!photoUrl && !isCameraOpen && (
              <button
                type="button"
                className="btn btn-outline-primary btn-lg w-100 mb-3"
                onClick={handleOpenCamera}
              >
                Open Camera
              </button>
            )}

            {isCameraOpen && (
              <div className="mb-3 text-center">
<Webcam
    audio={false}
    ref={webcamRef}
    screenshotFormat="image/jpeg"
    screenshotQuality={0.85}
    className="border rounded mb-3"
    style={{ width: "100%", maxWidth: "450px" }}
    videoConstraints={{ facingMode: "user", width: 450, height: 338 }}
  />

  {/* Buttons Centered Under Frame */}
  <div className="d-flex justify-content-center gap-3 mt-2">
    <button
      type="button"
      className="btn btn-success btn-lg"
      onClick={capturePhoto}
    >
      Capture
    </button>
    <button
      type="button"
      className="btn btn-danger btn-lg"
      onClick={() => setIsCameraOpen(false)}
    >
      Cancel
    </button>
  </div>
</div>

            )}

            {photoUrl && (
              <div className="mb-3 text-center">
                <img
                  src={photoUrl}
                  alt="Captured"
                  className="img-thumbnail mb-3"
                  style={{ width: "220px", borderRadius: "15px" }}
                />
                <button
                  type="button"
                  className="btn btn-warning btn-lg w-75"
                  onClick={() => {
                    setPhotoUrl("");
                    setIsCameraOpen(false);
                  }}
                >
                  Retake
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
              disabled={loading}
            >
              {loading ? "Processing..." : "Generate Pass"}
            </button>
          </form>
        </div>
      </div>
      {/* Footer */}
      <footer className="text-center p-3 text-muted medium">
        Powered by <strong>LogicLens</strong> | Secure Visitor Management System
      </footer>
    </div>
  );
}

export default VisitorForm;
