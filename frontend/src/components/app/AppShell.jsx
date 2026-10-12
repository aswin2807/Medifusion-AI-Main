import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Activity, LogOut, Bell, Search, FileText, CheckCircle2, ChevronDown } from "lucide-react";
import SearchModal from "./SearchModal";

const RISK = {
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Moderate: "bg-amber-100 text-amber-800 border-amber-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Critical: "bg-rose-100 text-rose-800 border-rose-200",
};

export function RiskBadge({ severity, value }) {
  return (
    <span data-testid={`risk-badge-${severity?.toLowerCase()}`} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${RISK[severity] || RISK.Low}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity}
      {value != null && <span className="font-mono opacity-70">· {value}%</span>}
    </span>
  );
}

export default function AppShell({ title, subtitle, right, children, onSelectPatientFromSearch }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      api.get("/notifications")
        .then((r) => setNotifications(r.data))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-stone-50/85 border-b border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <Link to={`/${user?.role || ""}`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-emerald-900 grid place-items-center text-white"><Activity className="h-4 w-4" /></div>
            <div className="font-heading font-black text-lg">HealthTwin<span className="text-emerald-800">.AI</span></div>
            <span className="ml-3 overline hidden md:inline">{user?.role} console</span>
          </Link>

          {/* Center Search Shortcut */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100/60 hover:bg-stone-100 text-stone-500 text-xs font-mono transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search records (Patients, Diseases, Risk)...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px]">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 relative text-stone-700"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-600 text-white text-[10px] font-bold grid place-items-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs text-stone-900">Notifications & Reminders</span>
                    <span className="text-[10px] font-mono text-stone-500">{notifications.length} Total</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-lg bg-stone-50 text-xs border border-stone-100">
                        <div className="font-bold text-stone-900">{n.title}</div>
                        <div className="text-stone-600 text-[11px] mt-0.5">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold" data-testid="header-username">{user?.full_name}</div>
              <div className="text-[10px] font-mono text-stone-500">{user?.email}</div>
            </div>

            <button data-testid="logout-btn" onClick={handleLogout} className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="overline mb-2">{subtitle}</div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl tracking-tight">{title}</h1>
          </div>
          {right}
        </div>
        {children}
      </main>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPatient={onSelectPatientFromSearch}
      />
    </div>
  );
}
