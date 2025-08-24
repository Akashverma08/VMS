// frontend/src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "1234") {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #4ba9d1, #f1f8e9)",
      }}
    >
      {/* Header */}
      <header
        className="d-flex align-items-center justify-content-between shadow-sm px-4"
        style={{
          background: "white",
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

      {/* Main content (centered) */}
      <main
        className="flex-grow-1 d-flex justify-content-center align-items-center"
        style={{ marginTop: "80px", marginBottom: "60px" }} // leaves space for header + footer
      >
        <div
          className="card shadow-lg p-5 border-0"
          style={{
            width: "100%",
            maxWidth: "650px",
            borderRadius: "16px",
            background: "#ffffff",
          }}
        >
          <h3
            className="text-center mb-4 fw-bold"
            style={{ fontSize: "2.5rem", color: "#2c3e50" }}
          >
            Admin Login
             <div className="d-flex align-items-center justify-content-center mb-4"> 
               <p className="text-muted m-0 me-2" style={{ fontSize: "0.9rem" }}> Powered by <strong>LogicLens</strong> </p> 
               <img src="/logo.png" alt="LogicLens Logo" style={{ height: "40px", marginLeft: "3px" }} /> </div>
          </h3>

          {error && (
            <div className="alert alert-danger text-center py-2 mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="form-label fw-semibold">Username</label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-3 fw-bold"
              style={{ fontSize: "1.1rem", borderRadius: "8px" }}
            >
              Login
            </button>
          </form>
        </div>
      </main>

      {/* Footer (always bottom) */}
      <footer
        className="text-center p-3 text-muted"
        style={{
          background: " linear-gradient(to right, #4ba9d1, #f1f8e9)",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
        }}
      >
        Powered by <strong>LogicLens</strong> | Secure Visitor Management System
      </footer>
    </div>
  );
}

export default AdminLogin;
