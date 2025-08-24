import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isAdmin = localStorage.getItem("isAdmin");

  if (!isAdmin) {
    // If not logged in, redirect to login
    return <Navigate to="/admin-login" replace />;
  }

  return children; // If logged in, render the protected page
}

export default ProtectedRoute;
