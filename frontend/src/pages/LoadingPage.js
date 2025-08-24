import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

function LoadingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const API_BASE =
    process.env.REACT_APP_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

  // Expire visitor if timer runs out
  const expireVisitor = useCallback(
    async (visitorId) => {
      try {
        await fetch(`${API_BASE}/api/visitors/${visitorId}/expire`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        alert("⏳ Visitor pass expired!");
        navigate("/");
      } catch (err) {
        console.error("Error expiring visitor:", err);
      }
    },
    [navigate, API_BASE]
  );

  // Poll server every 5s
  const checkStatus = useCallback(
    async (visitorId) => {
      try {
        const res = await fetch(`${API_BASE}/api/visitors/${visitorId}`);
        const data = await res.json();

        if (data?.success && data?.data) {
          const status = String(data.data.status || "").toLowerCase();

          if (status === "approved") {
            navigate(`/qrcode/${visitorId}`);
          } else if (status === "rejected") {
            alert("❌ Your request was rejected.");
            navigate("/");
          }
        }
      } catch (err) {
        console.error("Error checking visitor status:", err);
      }
    },
    [navigate, API_BASE]
  );

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          expireVisitor(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const poller = setInterval(() => {
      checkStatus(id);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [id, navigate, expireVisitor, checkStatus]);

  // Format time mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex flex-column"
      style={{ background: "linear-gradient(to right, #4ba9d1, #f1f8e9)" }}
    >
    {/* Header */}
    <header
    className="d-flex align-items-center justify-content-between p-3 shadow-sm bg-white fixed-top w-100"
    style={{ left: 0, right: 0 }}
    >
    <div className="d-flex align-items-center">
      <img
      src="/logo.png"
      alt="Logo"
      style={{ height: "65px", marginRight: "10px" }}
      />
      <h4 className="fw-bold text-center flex-grow-1 m-0">LogicLens</h4>
    </div>
    <h1 className="fw-bold text-center flex-grow-1 m-0">
     LogicLens – Visitor Management System
    </h1>
    <div style={{ minWidth: "220px" }}></div>
    </header>


      {/* Content */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center">
        {/* Stepper */}
        <div className="d-flex justify-content-center mb-5">
          {/* Step 1 */}
          <div className="d-flex align-items-center">
            <span className="badge rounded-circle bg-success p-3">1</span>
            <span className="ms-2 fw-semibold">General Details</span>
          </div>
          <div className="mx-3">──</div>
          {/* Step 2 */}
          <div className="d-flex align-items-center">
            <span className="badge rounded-circle bg-primary p-3">2</span>
            <span className="ms-2 fw-semibold">Loading</span>
          </div>
          <div className="mx-3">──</div>
          {/* Step 3 */}
          <div className="d-flex align-items-center text-muted">
            <span className="badge rounded-circle bg-light border p-3">3</span>
            <span className="ms-2">Pass Generation</span>
          </div>
        </div>

        {/* Spinner */}
        <div className="mb-4">
          <div
            className="spinner-border text-primary"
            style={{ width: "4rem", height: "4rem" }}
            role="status"
          />
        </div>

        {/* Heading */}
        <h2 className="fw-bold mb-3">⏳ Waiting for Host Approval</h2>

        {/* Timer */}
        <h4 className="text-black fw-semibold ">Time left: {formatTime(timeLeft)}</h4>
      </div>

      <footer className="text-center p-3  fw-bold text-muted medium">
        Powered by <strong>LogicLens</strong> | Secure Visitor Management System
      </footer>
   
    </div>
  );
}

export default LoadingPage;
