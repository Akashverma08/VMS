import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // backend base URL
});

// Example: register visitor
export const registerVisitor = (data) => API.post("/visitors/register", data);

// Get all visitors
export const getVisitors = () => API.get("/visitors");

// Update visitor status
export const updateVisitorStatus = (id, status) =>
  API.put(`/visitors/${id}/status`, { status });

export default API;
