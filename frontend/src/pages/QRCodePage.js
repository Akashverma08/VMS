import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./../App.css";

function QRCodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVisitor = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/visitors/${id}`);
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || "Failed to fetch visitor");
        }

        setVisitor(result.data);

        // ✅ Mark when pass is ready for Puppeteer
        setTimeout(() => {
          const readyDiv = document.getElementById("pass-ready");
          if (readyDiv) readyDiv.style.display = "block";
        }, 500);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchVisitor();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
        <h4 className="text-dark fw-bold">Loading Visitor Pass...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-gradient">
        <div
          className="card p-4 shadow-lg text-center"
          style={{ maxWidth: "500px" }}
        >
          <h3 className="text-danger">Error Loading Visitor Pass</h3>
          <p>{error}</p>
          <button
            className="btn btn-primary mt-2"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column"
      style={{ background: "linear-gradient(to right, #4ba9d1, #f1f8e9)" }}
    >
      {/* Navbar */}
      <header
        className="d-flex align-items-center justify-content-between shadow-sm bg-white px-4 no-print"
        style={{
          background: "#2c3e50",
          color: "black",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "80px",
          zIndex: 1000,
        }}
      >
        <div className="d-flex align-items-center">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ height: "60px", marginRight: "12px" }}
          />
          <h4 className="fw-bold m-0">LogicLens</h4>
        </div>

        <h1 className="fw-bold text-center m-0 flex-grow-1">
          LogicLens - Visitor Management System
        </h1>

        <div style={{ minWidth: "220px" }}></div>
      </header>

      {/* Push content below navbar */}
      <div style={{ marginTop: "90px" }}></div>

      {/* Success Section */}
      <div className="text-center mb-4 no-print">
        <h2 className="fw-bold text-success d-flex align-items-center justify-content-center">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#28a745",
              color: "white",
              fontSize: "1.2rem",
              marginRight: "10px",
            }}
          >
            ✔
          </span>
          Approval Confirmed
        </h2>
        <p className="text-muted mt-2">
          Your visitor gate pass has been successfully approved.
        </p>
      </div>

      {/* ✅ Only this part will go into PDF */}
      <div
        id="visitor-pass"
        className="flex-grow-1 d-flex flex-column justify-content-center align-items-center"
      >
        <div
          className="card shadow-lg border-0 text-center"
          style={{
            maxWidth: "450px",
            width: "95%",
            minHeight: "600px",
            borderRadius: "24px",
            border: "3px solid #00796b",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "40px 30px", flex: "1" }}>
            <h2
              className="fw-bold mb-2 text-dark"
              style={{ fontSize: "1.85rem" }}
            >
              Visitor Gate Pass
            </h2>
            <div className="d-flex align-items-center justify-content-center mb-4">
              <p className="text-muted m-0 me-2" style={{ fontSize: "1rem" }}>
                Issued by <strong>LogicLens</strong>
              </p>
              <img
                src="/logo.png"
                alt="LogicLens Logo"
                style={{ height: "40px", marginLeft: "3px" }}
              />
            </div>

            <hr className="my-2" />

            {visitor.photo && (
              <div className="d-flex justify-content-center mb-4">
                <img
                  src={visitor.photo}
                  alt="Visitor"
                  style={{
                    width: "180px",
                    height: "180px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #1aca49ff",
                    boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            )}

            <div className="fs-5 text-center">
              <p className="mb-4">
                <span
                  className="fw-bold"
                  style={{ fontSize: "1.6rem", color: "#2c3e50" }}
                >
                  {visitor.name}
                </span>
              </p>

              <p className="mb-3">
                <strong>Visitor Code:</strong>{" "}
                <span className="text-primary fw-bold">
                  {visitor.visitorCode}
                </span>
              </p>

              <p className="mb-3" style={{ color: "black" }}>
                <strong>Date & Time:</strong>{" "}
                {new Date(visitor.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ,{" "}
                {new Date(visitor.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>

              <p className="mb-0">
                <strong>Status:</strong>{" "}
                {visitor.status === "approved" && (
                  <span className="text-success fw-bold">
                    ✅ APPROVED by {visitor.approvedBy || "Admin"}
                  </span>
                )}
                {visitor.status === "pending" && (
                  <span className="text-warning fw-bold">⏳ PENDING</span>
                )}
                {visitor.status === "rejected" && (
                  <span className="text-danger fw-bold">❌ REJECTED</span>
                )}
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#28a745",
              color: "#ffffff",
              padding: "15px 0",
              fontSize: "1.4rem",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            GATE PASS
          </div>
        </div>

        {/* ✅ Back to Form Button aligned below card */}
        <div className="text-center mt-4 no-print">
          <button
            className="btn btn-lg btn-primary shadow-sm"
            onClick={() => navigate("/")}
            style={{
              borderRadius: "12px",
              padding: "10px 24px",
              fontWeight: "bold",
            }}
          >
            ⬅ Back to Registration Form
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center p-3 text-muted small no-print">
        Powered by <strong>LogicLens</strong> | Secure Visitor Management System
      </footer>

      {/* Puppeteer waits for this */}
      <div id="pass-ready" style={{ display: "none" }}></div>

      {/* ✅ Print styles: hide navbar/footer when exporting PDF */}
      <style>{`
        @media print {
          .navbar,
          .footer,
          .site-header,
          .site-title,
          .no-print {
            display: none !important;
          }

          /* Make the pass take full page width */
          #visitor-pass {
            width: 100% !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Remove page margins (Puppeteer handles margins already) */
          @page {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default QRCodePage;
