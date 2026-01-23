"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/userContext";

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  

  useEffect(() => {
    if (token) {
      router.replace("/home");
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }
      
      const sessionId =
  window.crypto?.randomUUID?.() ??
  ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (
      c ^
      (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );

      sessionStorage.setItem("auth_token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("sessionId", sessionId);
      
      login(data.token, data.user, sessionId);
      router.push("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
<div className="w-full max-w-md rounded-2xl bg-[var(--color-base-100)] p-8 shadow-2xl">
  <div className="space-y-2 text-center">
    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
    <p className="text-sm text-[var(--color-base-content)]/60">
      Sign in to your account
    </p>
  </div>

  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
    {/* Email Field */}
    <div className="space-y-2">
      <label htmlFor="email" className="block text-sm font-medium">
        Email
      </label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--color-base-300)] bg-transparent py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          placeholder="Enter your email"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-medium">
        Password
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--color-base-300)] bg-transparent py-2.5 pl-10 pr-12 text-sm transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          placeholder="Enter your password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>
      </div>
    </div>

    {/* Error Message */}
    {error && (
      <div className="rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
        {error}
      </div>
    )}

    {/* Submit Button */}
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing in..." : "Sign In"}
    </button>
  </form>

  {/* Footer Link */}
  <p className="mt-6 text-center text-sm text-[var(--color-base-content)]/70">
    Don't have an account?{" "}
    <a 
      href="/signup" 
      className="font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary)]/80"
    >
      Sign up
    </a>
  </p>
</div>
    </div>
  );
}
