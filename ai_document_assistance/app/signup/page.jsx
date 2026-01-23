"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/userContext";

export default function SignUpPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
    useEffect(() => {
      if (token) {
        router.replace("/home");
      }
    }, [token, router]);


  const handleChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;

    setPasswordStrength(strength);
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return "First and last name are required";
    }

    if (!/^[a-zA-Z\s'-]{2,}$/.test(firstName) || !/^[a-zA-Z\s'-]{2,}$/.test(lastName)) {
      return "Name must contain only letters and be at least 2 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Invalid email address";
    }

    if (!/^\d{10}$/.test(phone)) {
      return "Phone number must be exactly 10 digits";
    }

    if (
      password.length < 5 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return "Password must be 8+ chars with uppercase, lowercase, and number";
    }

    return null;
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-red-500";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "";
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      router.push("/signIn");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md rounded-xl bg-[var(--color-base-100)] p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
        <p className="mt-1 text-center text-sm text-[var(--color-base-content)]/60">
          Sign up to get started
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full rounded-md border pl-9 pr-3 py-2 text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-[var(--color-primary)]"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full rounded-md border pl-9 pr-3 py-2 text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-[var(--color-primary)]"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                className="w-full rounded-md border pl-9 pr-3 py-2 text-sm
                       focus:outline-none focus:ring-2
                       focus:ring-[var(--color-primary)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                className="w-full rounded-md border pl-9 pr-3 py-2 text-sm
                       focus:outline-none focus:ring-2
                       focus:ring-[var(--color-primary)]"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // digits only
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-md border pl-9 pr-10 py-2 text-sm
                 focus:outline-none focus:ring-2
                 focus:ring-[var(--color-primary)]"
                value={password}
                name='password'
                // onChange={(e) => setPassword(e.target.value)}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2
                 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Password Strength</span>
                  <span className="font-semibold">{getPasswordStrengthText()}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength * 25}%` }}
                  />
                </div>
              </div>
            )}

          </div>

          {error && (
            <div className="rounded-md bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                   px-4 py-2 text-sm font-semibold
                   text-[var(--color-primary-content)]
                   hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/signIn" className="font-medium text-[var(--color-primary)]">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
