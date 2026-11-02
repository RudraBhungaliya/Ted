"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "../lib/api/endpoints";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.signup({ name, email, password });
      if (response?.success) {
        if (response.data?.accessToken) {
          localStorage.setItem("authToken", response.data.accessToken);
        }
        window.location.href = "/";
      } else {
        setError(response?.message || "Failed to create account");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to sign up. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:4000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-8 sm:p-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-lg mb-4 shadow-xs">
              T
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Create an account
            </h1>
            <p className="text-stone-500 text-sm mt-1.5 max-w-xs leading-relaxed">
              Start capturing meetings, technical practice, and live conversation notes.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all text-sm"
                placeholder="Sarah Chen"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all text-sm"
                placeholder="sarah@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 font-medium">
                or
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Footer note */}
          <p className="text-center text-xs text-stone-500 mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-stone-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
