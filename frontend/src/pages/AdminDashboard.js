import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) navigate("/admin-login");
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:5000/api/visitors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVisitors(data.data);
        else setError("Failed to load visitors");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching visitors:", err);
        setError("Backend not reachable");
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/admin-login");
  };

  // ✅ Filter visitors based on date range
  const filteredVisitors = visitors.filter((v) => {
    const visitDate = new Date(v.createdAt);
    if (fromDate && visitDate < new Date(fromDate)) return false;
    if (toDate && visitDate > new Date(toDate)) return false;
    return true;
  });

  // ✅ Export Excel
  const exportToExcel = () => {
    if (filteredVisitors.length === 0) {
      alert("No visitors found in this date range!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filteredVisitors.map((v) => ({
        VisitorID: v.visitorCode || v._id.slice(-6),
        Name: v.name,
        Email: v.email || "—",
        Mobile: v.mobile,
        Purpose: v.purpose,
        "To Meet": v.toMeet || "—",
        Status: v.status,
        "Requested At": new Date(v.createdAt).toLocaleString("en-IN"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileName = `Visitors_${fromDate || "all"}_to_${toDate || "all"}.xlsx`;
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading visitors...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {error}
      </div>
    );

  return (
    <div>
      {/* Navbar */}
      <header
        className="d-flex align-items-center justify-content-between shadow-sm px-4"
        style={{
          background: "#fdfeffff",
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
          <img src="/logo.png" alt="Logo" style={{ height: "60px", marginRight: "12px" }} />
          <h4 className="fw-bold m-0">LogicLens</h4>
        </div>
        <h1 className="fw-bold text-center m-0 flex-grow-1" style={{fontsize:"4rem",}}>LogicLens- Record Dashboard</h1>
        <div style={{ minWidth: "220px" }} className="text-end">
          <button onClick={handleLogout} className="btn btn-danger btn-sm px-4 fw-bold" 
          style={{fontSize:"1.2rem",}}>
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="container" style={{ paddingTop: "120px" }}>
        <div className="card shadow-lg p-4">
          <h2 className="text-center mb-4"><strong>Admin Dashboard</strong></h2>

          {/* ✅ Date Filter & Export */}
          <div className="d-flex justify-content-between mb-4">
            <div>
              <label className="me-2">From: </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="form-control d-inline-block"
                style={{ width: "200px" }}
              />
              <label className="ms-3 me-2">To: </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="form-control d-inline-block"
                style={{ width: "200px" }}
              />
            </div>
            <button onClick={exportToExcel} className="btn btn-success fw-bold"
            style={{fontSize:"1.2rem",}}>
              📥 Download Excel
            </button>
          </div>

          {filteredVisitors.length === 0 ? (
            <div className="alert alert-info text-center">No visitors found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-dark text-center">
                  <tr>
                    <th>Visitor ID</th>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Purpose</th>
                    <th>Host</th>
                    <th>Requested At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {filteredVisitors.map((v) => (
                    <tr key={v._id}>
                      <td><code>{v.visitorCode || v._id.slice(-6)}</code></td>
                      <td>
                        {v.photo ? (
                          <img src={v.photo} alt="Visitor" style={{ width: "50px", height: "50px", borderRadius: "8px" }} />
                        ) : "—"}
                      </td>
                      <td>{v.name}</td>
                      <td>{v.email || "—"}</td>
                      <td>{v.mobile}</td>
                      <td>{v.purpose}</td>
                      <td>{v.toMeet || "—"}</td>
                      <td>{new Date(v.createdAt).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`badge px-3 py-2 fs-6 ${
                          v.status === "approved" ? "bg-success" :
                          v.status === "pending" ? "bg-warning text-dark" :
                          v.status === "rejected" ? "bg-danger" : "bg-secondary"
                        }`}>
                          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center p-3 text-muted medium">
        Powered by <strong>LogicLens</strong> | Secure Visitor Management System
      </footer>
    </div>
  );
}

export default AdminDashboard;
