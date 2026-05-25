import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCountry } from "../contexts/CountryContext";
import { COUNTRIES, CountryCode } from "../lib/constants";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { selectedCountry, setCountryCode } = useCountry();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { to: "/clients", icon: Users, label: "Clients" },
    { to: "/invoices", icon: FileText, label: "Factures" },
    { to: "/missions", icon: Calendar, label: "Suivi des missions" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#2a4f7f]">
          <div className="flex items-center gap-3">
            <img
              src="/logos/ExicimaaLogo.png"
              alt="EXCI-MAA"
              className="h-10 w-auto object-contain bg-white rounded px-1"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname.startsWith(to)
                  ? "bg-[#2a6fc6] text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-[#2a4f7f]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#2a6fc6] flex items-center justify-center text-white font-bold text-sm">
              {profile?.initials || "??"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-white/50 text-xs capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-all"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          {/* Country selector */}
          <div className="relative">
            <button
              onClick={() => setCountryOpen(!countryOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-sm font-medium text-slate-700 transition-all"
            >
              <Globe size={15} className="text-slate-500" />
              <span>{selectedCountry.flag}</span>
              <span className="hidden sm:inline">{selectedCountry.name}</span>
              <span className="text-slate-400 text-xs">
                ({selectedCountry.currencySymbol})
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {countryOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountryCode(c.code as CountryCode);
                      setCountryOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                      selectedCountry.code === c.code
                        ? "text-blue-600 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="text-left">
                      <div>{c.name}</div>
                      <div className="text-xs text-slate-400">
                        {c.currencySymbol}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
