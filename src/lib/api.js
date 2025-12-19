// User API
export const userAPI = {
  getAll: () => api.get("/users"),
  getByEmail: (email) => api.get(`/users?email=${encodeURIComponent(email)}`),
};
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Program API
export const programAPI = {
  getAll: () => api.get("/programs"),
  getById: (id) => api.get(`/programs/${id}`),
  create: (data) => api.post("/programs", data),
  update: (id, data) => api.put(`/programs/${id}`, data),
  delete: (id) => api.delete(`/programs/${id}`),
  updateStatus: (id, status) => api.put(`/programs/${id}/status`, { status }),
  getMembers: (id) => api.get(`/programs/${id}/members`),
  addMember: (id, data) => api.post(`/programs/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/programs/${id}/members/${userId}`),
  approveMember: (id) => api.post(`/programs/${id}/members/approve`),
};

// RAB Items API
export const rabItemAPI = {
  getByProgram: (programId) => api.get(`/programs/${programId}/rab-items`),
  getById: (id) => api.get(`/rab-items/${id}`),
  create: (programId, data) =>
    api.post(`/programs/${programId}/rab-items`, data),
  update: (id, data) => api.put(`/rab-items/${id}`, data),
  delete: (id) => api.delete(`/rab-items/${id}`),
  getSummary: (programId) => api.get(`/programs/${programId}/rab-summary`),
};

// Transaction API
export const transactionAPI = {
  getByProgram: (programId, params) =>
    api.get(`/programs/${programId}/transactions`, { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (programId, data) =>
    api.post(`/programs/${programId}/transactions`, data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Receipt API
export const receiptAPI = {
  getByTransaction: (transactionId) =>
    api.get(`/transactions/${transactionId}/receipts`),
  upload: (transactionId, formData) =>
    api.post(`/transactions/${transactionId}/receipts`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  download: (id) =>
    api.get(`/receipts/${id}/download`, { responseType: "blob" }),
  delete: (id) => api.delete(`/receipts/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  get: (programId) => api.get(`/programs/${programId}/dashboard`),
};

// Audit Log API
export const auditLogAPI = {
  getByProgram: (programId, params) =>
    api.get(`/programs/${programId}/audit-logs`, { params }),
};
// Expense API
export const expenseAPI = {
  getByProgram: (programId, params) =>
    api.get(`/programs/${programId}/expenses`, { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (programId, data) =>
    api.post(`/programs/${programId}/expenses`, data, {
      headers: { "Content-Type": "multipart/form-data" }, // Often creates involve file uploads
    }),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  approve: (id) => api.put(`/expenses/${id}/approve`),
  reject: (id, data) => api.put(`/expenses/${id}/reject`, data),
};

// RAB API (Alias for rabItemAPI for backward compatibility/clarity)
export const rabAPI = rabItemAPI;
