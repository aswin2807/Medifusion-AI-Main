import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ht_user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ht_token");
    if (token && !user) {
      setLoading(true);
      api
        .get("/auth/me")
        .then((r) => {
          setUser(r.data);
          localStorage.setItem("ht_user", JSON.stringify(r.data));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const r = await api.post("/auth/login/patient", { email, password });
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const loginPatient = async (email, password) => {
    const r = await api.post("/auth/login/patient", { email, password });
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const loginDoctor = async (email, password) => {
    const r = await api.post("/auth/login/doctor", { email, password });
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const loginClinical = async (email, password) => {
    const r = await api.post("/auth/login/clinical", { email, password });
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (payload) => {
    const r = await api.post("/auth/register/patient", payload);
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const registerPatient = async (payload) => {
    const r = await api.post("/auth/register/patient", payload);
    localStorage.setItem("ht_token", r.data.token);
    localStorage.setItem("ht_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const registerDoctor = async (payload) => {
    const r = await api.post("/auth/register/doctor", payload);
    return r.data;
  };

  const registerClinical = async (payload) => {
    const r = await api.post("/auth/register/clinical", payload);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem("ht_token");
    localStorage.removeItem("ht_user");
    setUser(null);
  };

  const token = () => localStorage.getItem("ht_token");

  return (
    <AuthCtx.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        loginPatient, 
        loginDoctor, 
        loginClinical, 
        register, 
        registerPatient, 
        registerDoctor, 
        registerClinical, 
        logout, 
        token 
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
