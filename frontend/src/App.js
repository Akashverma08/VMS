import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VisitorForm from "./pages/VisitorForm";
import LoadingPage from "./pages/LoadingPage";
import QRCodePage from "./pages/QRCodePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";  // ✅ Import here

// ✅ Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VisitorForm />} />
        <Route path="/loading/:id" element={<LoadingPage />} />
        <Route path="/qrcode/:id" element={<QRCodePage />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* ✅ Protected Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* ✅ Mount toast container once (global) */}
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
