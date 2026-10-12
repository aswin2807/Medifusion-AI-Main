import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PatientDashboard from "@/pages/PatientDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import ClinicalDashboard from "@/pages/ClinicalDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ResetPassword from "@/pages/ResetPassword";
import { Toaster } from "sonner";

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === "clinical") return <Navigate to="/clinical/dashboard" replace />;
    if (user.role === "patient") return <Navigate to="/patient/dashboard" replace />;
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
  if (user.role === "clinical") return <Navigate to="/clinical/dashboard" replace />;
  if (user.role === "patient") return <Navigate to="/patient/dashboard" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          
          {/* Patient Routes */}
          <Route path="/patient" element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />
          <Route path="/patient/dashboard/*" element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />
          <Route path="/patient/*" element={<RoleRoute role="patient"><PatientDashboard /></RoleRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
          <Route path="/doctor/dashboard/*" element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
          <Route path="/doctor/*" element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />

          {/* Clinical Routes */}
          <Route path="/clinical" element={<RoleRoute role="clinical"><ClinicalDashboard /></RoleRoute>} />
          <Route path="/clinical/dashboard/*" element={<RoleRoute role="clinical"><ClinicalDashboard /></RoleRoute>} />
          <Route path="/clinical/*" element={<RoleRoute role="clinical"><ClinicalDashboard /></RoleRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/dashboard/*" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/*" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
