import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faArrowRight,
  faCircleExclamation,
  faEye,
  faEyeSlash,
  faShieldHalved,
  faBolt,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

import { useAuthStore } from "../../stores/authStore";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const canSubmit = useMemo(() => {
    return !isLoading && username.trim().length > 0 && password.trim().length > 0;
  }, [isLoading, username, password]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await login(username.trim(), password);
      // ملاحظة: لو عندك store يدعم remember-me فعليًا
      // تقدر تمرر remember أو تخزّنه هنا.
      // مثال: localStorage.setItem("remember_me", remember ? "1" : "0");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-52 -left-28 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-28 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Branding */}
          <div className="hidden lg:flex lg:flex-col lg:justify-center">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <FontAwesomeIcon icon={faShieldHalved} className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">Nexus Enterprise Systems</p>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Secure access to your dashboard
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Sign in to manage hotels, roles, and permissions with a fast, secure, and consistent admin experience.
            </p>

            <div className="mt-8 grid max-w-xl gap-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
                  <FontAwesomeIcon icon={faBolt} className="h-4 w-4 text-indigo-200" />
                </div>
                <div>
                  <p className="font-semibold text-white/85">Fast sign-in flow</p>
                  <p className="text-sm text-white/60">Optimized inputs, clear validation, and smooth feedback.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-fuchsia-500/15 ring-1 ring-fuchsia-400/20">
                  <FontAwesomeIcon icon={faLayerGroup} className="h-4 w-4 text-fuchsia-200" />
                </div>
                <div>
                  <p className="font-semibold text-white/85">RBAC-ready</p>
                  <p className="text-sm text-white/60">Role-based permissions with protected routes.</p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-white/40">
              Protected Dashboard + RBAC Permissions (Stage 2)
            </p>
          </div>

          {/* Right: Card */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur">
                <div className="px-6 pb-6 pt-7 sm:px-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter your credentials to access your account.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                      <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-4 w-4" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                        Username
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-slate-400" />
                        </span>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={isLoading}
                          placeholder="Enter your username"
                          className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition
                                     focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15
                                     disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-slate-400" />
                        </span>

                        <input
                          id="password"
                          name="password"
                          type={showPw ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          placeholder="••••••••"
                          className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition
                                     focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15
                                     disabled:cursor-not-allowed disabled:opacity-70"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row: remember + forgot */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                        />
                        Remember me
                      </label>

                      {/* غيّر الرابط حسب روت مشروعك */}
                      <Link
                        to="/forgot-password"
                        className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition
                                 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/25
                                 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          جارٍ تسجيل الدخول...
                        </>
                      ) : (
                        <>
                          Sign In <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Demo accounts */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Available Demo Accounts
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemo("admin", "admin123")}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition
                                   hover:bg-slate-50"
                      >
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        Admin
                        <span className="text-xs font-medium text-slate-400">(admin)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemo(" test1", "123456")}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition
                                   hover:bg-slate-50"
                      >
                        <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                        Manager
                        <span className="text-xs font-medium text-slate-400">(hotel_manager)</span>
                      </button>
                    </div>

                    <p className="mt-5 text-center text-xs text-slate-400">
                      © 2024 Nexus Enterprise Systems. v2.1.0
                    </p>
                  </div>
                </div>
              </div>

              {/* mobile helper */}
              <p className="mt-4 text-center text-xs text-white/50 lg:hidden">
                Protected Dashboard + RBAC Permissions (Stage 2)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
