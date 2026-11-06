import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Lock, Compass, User, Mail, Phone, Building2, ArrowRight } from "lucide-react";
import { loginOwnerApi, loginTravellerApi, registerTravellerApi } from "@/lib/authClient";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "register";
  initialRole?: "owner" | "traveller";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  initialRole = "traveller",
}: AuthModalProps) {
  const router = useRouter();
  const { login, loginTraveller } = useAuth();

  const [currentRole, setCurrentRole] = useState<"owner" | "traveller">(initialRole);
  const [activeTab, setActiveTab] = useState<"signin" | "register">(initialTab);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register Traveller state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = React.useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSignInEmail("");
    setSignInPassword("");
    setRegFullName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentRole(initialRole);
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialRole, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // ── Handle Owner Sign In (Direct to Owner Dashboard) ──────────────────────
  const handleOwnerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = signInEmail.trim();
    if (!email || !signInPassword) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const ownerRes = await loginOwnerApi({ email, password: signInPassword });
      if (ownerRes.success && ownerRes.owner) {
        login(ownerRes.owner);
        setSuccessMessage(`Welcome back, ${ownerRes.owner.fullName}! Opening your host dashboard...`);
        setIsLoading(false);
        setTimeout(() => {
          handleClose();
          router.push("/dashboard");
        }, 700);
        return;
      }

      setErrorMessage(ownerRes.message || "Invalid email address or password for property owner.");
      setIsLoading(false);
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Handle Traveller Sign In ───────────────────────────────────────────────
  const handleTravellerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = signInEmail.trim();
    if (!email || !signInPassword) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const travRes = await loginTravellerApi({ email, password: signInPassword });
      if (travRes.success && travRes.traveller) {
        loginTraveller(travRes.traveller);
        setSuccessMessage(`Welcome back, ${travRes.traveller.fullName}! Opening your traveller dashboard...`);
        setIsLoading(false);
        setTimeout(() => {
          handleClose();
          router.push("/traveller/dashboard");
        }, 700);
        return;
      }

      // If not found as traveller, check if they are an owner trying to sign in here
      const ownerRes = await loginOwnerApi({ email, password: signInPassword });
      if (ownerRes.success && ownerRes.owner) {
        login(ownerRes.owner);
        setSuccessMessage(`Welcome back, ${ownerRes.owner.fullName}! Opening your host dashboard...`);
        setIsLoading(false);
        setTimeout(() => {
          handleClose();
          router.push("/dashboard");
        }, 700);
        return;
      }

      setErrorMessage(travRes.message || "Invalid email address or password.");
      setIsLoading(false);
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Handle Traveller Registration ──────────────────────────────────────────
  const handleRegisterTravellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerTravellerApi({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });

      if (!res.success || !res.traveller) {
        setErrorMessage(res.message || "Failed to create traveller account.");
        setIsLoading(false);
        return;
      }

      loginTraveller(res.traveller);
      setSuccessMessage(`Welcome to HolidayExpertz, ${res.traveller.fullName}! Opening your dashboard...`);
      setIsLoading(false);
      setTimeout(() => {
        handleClose();
        router.push("/traveller/dashboard");
      }, 800);
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-editorial-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#009F8D]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Branding Header */}
        {currentRole === "owner" ? (
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center shadow-md shadow-[#009F8D]/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Property Owner Sign In
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in to your host portal to manage property listings, reservations, and earnings.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#006F66] to-[#009F8D] text-white flex items-center justify-center shadow-md shadow-[#009F8D]/20">
              <Compass className="w-6 h-6" />
            </div>
            <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Holiday Expertz
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your passport to luxury handpicked stays, heritage sanctuaries, and unforgettable getaways.
            </p>
          </div>
        )}

        {/* Role Toggle Strip (Quick switch between Traveller and Host) */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 mb-5 text-[11px]">
          <span className="text-slate-500 font-medium">Signing in as:</span>
          <div className="flex items-center gap-1.5 font-bold">
            <button
              type="button"
              onClick={() => {
                setCurrentRole("traveller");
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentRole === "traveller"
                  ? "bg-[#009F8D] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Traveller
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentRole("owner");
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                currentRole === "owner"
                  ? "bg-[#009F8D] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Property Owner
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2.5 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2.5 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── CASE 1: OWNER SIGN IN ────────────────────────────────────── */}
        {currentRole === "owner" ? (
          <div className="space-y-4">
            <form onSubmit={handleOwnerLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="host@example.com"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter host password"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#006F66] to-[#009F8D] hover:from-[#005a53] hover:to-[#008979] active:scale-[0.99] transition-all shadow-md shadow-[#009F8D]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Building2 className="w-4 h-4" />
                <span>{isLoading ? "Signing In to Host Portal..." : "Sign In to Host Dashboard"}</span>
              </button>
            </form>

            {/* Link to Register New Property */}
            <div className="p-3.5 rounded-2xl bg-[#F2FAF7] border border-[#BDE8DE] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#006F66] truncate">
                  New Property Host?
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Register your luxury property and choose a partner plan.
                </p>
              </div>
              <Link
                href="/subscription#owner-registration"
                onClick={handleClose}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#009F8D] text-white text-xs font-bold hover:bg-[#007F70] transition-colors shrink-0 shadow-xs"
              >
                <span>Register</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          /* ── CASE 2: TRAVELLER (Sign In vs Register) ─────────────────── */
          <div>
            {/* Tabs: Sign In vs Register as Traveller */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "signin"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-[#009F8D] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Register as Traveller
              </button>
            </div>

            {/* Tab 1: TRAVELLER SIGN IN FORM */}
            {activeTab === "signin" && (
              <form onSubmit={handleTravellerLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="traveller@example.com"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#006F66] to-[#009F8D] hover:from-[#005a53] hover:to-[#008979] active:scale-[0.99] transition-all shadow-md shadow-[#009F8D]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoading ? "Signing In..." : "Sign In to Account"}</span>
                </button>
              </form>
            )}

            {/* Tab 2: REGISTER AS TRAVELLER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterTravellerSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password * (min. 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#009F8D] focus:border-transparent transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#006F66] to-[#009F8D] hover:from-[#005a53] hover:to-[#008979] active:scale-[0.99] transition-all shadow-md shadow-[#009F8D]/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-2"
                >
                  <User className="w-4 h-4" />
                  <span>{isLoading ? "Creating Account..." : "Create Traveller Account"}</span>
                </button>
              </form>
            )}

            {/* Switch to Property Owner Sign In */}
            <div className="mt-5 p-3.5 rounded-2xl bg-[#F2FAF7] border border-[#BDE8DE] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#BDE8DE] flex items-center justify-center text-[#009F8D] shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#006F66] truncate">
                    Property Owner / Host?
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Sign in to your owner dashboard or list a stay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentRole("owner");
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#009F8D] text-white text-xs font-bold hover:bg-[#007F70] transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                <span>Owner Portal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            Continue browsing
          </button>
          <span>HolidayExpertz &bull; Secure Authentication</span>
        </div>
      </div>
    </div>
  );
}

