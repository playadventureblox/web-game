"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMars, faVenus } from "@fortawesome/free-solid-svg-icons";
import { authApi, storage, accountsApi } from "@/lib/api";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const SignupForm = () => {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Check if we're adding an account on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const addingAccount = localStorage.getItem("addingAccount");
      if (addingAccount === "true") {
        setIsAddingAccount(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    // TEMP: Turnstile check commented out for local testing — RESTORE BEFORE PUSHING TO REPO
    // if (!turnstileToken) {
    //   setErrors(["Please wait for the security check to complete."]);
    //   setLoading(false);
    //   return;
    // }

    try {
      const response = await authApi.signup({
        username,
        password,
        month,
        day,
        year,
        gender: gender || undefined,
        turnstileToken: turnstileToken ?? undefined,
      });

      if (response.success && response.data) {
        // Check if we're adding an account
        if (isAddingAccount) {
          // Add the account via API
          const addAccountResponse = await accountsApi.addAccount(
            response.data.user.id,
            response.data.accessToken,
            response.data.refreshToken,
          );

          // Clear the flag
          localStorage.removeItem("addingAccount");

          if (addAccountResponse.success) {
            // Switch to the new account
            storage.setTokens(
              response.data.accessToken,
              response.data.refreshToken,
            );

            // Redirect to home
            router.push("/home");
          } else {
            setErrors([addAccountResponse.error || "Failed to add account"]);
          }
        } else {
          // Normal signup flow
          storage.setTokens(
            response.data.accessToken,
            response.data.refreshToken,
          );

          // Redirect to home
          router.push("/home");
        }
      } else {
        // Reset turnstile on failure so user can retry
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        // Handle validation errors from backend
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setErrors(
            response.errors.map(
              (err: { msg?: string; message?: string }) =>
                err.msg || err.message || String(err),
            ),
          );
        } else if (response.message) {
          setErrors([response.message]);
        } else {
          setErrors(["Signup failed. Please try again."]);
        }
      }
    } catch {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErrors(["An error occurred. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-lg p-8 w-full max-w-md mx-auto">
      <h1 className="text-xl font-bold text-center text-foreground mb-6 tracking-wide">
        SIGN UP AND START HAVING FUN!
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Birthday */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Birthday
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-input text-foreground rounded px-3 py-2.5 appearance-none cursor-pointer border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm"
              >
                <option value="" disabled>
                  Month
                </option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-input text-foreground rounded px-3 py-2.5 appearance-none cursor-pointer border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm"
              >
                <option value="" disabled>
                  Day
                </option>
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-input text-foreground rounded px-3 py-2.5 appearance-none cursor-pointer border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm"
              >
                <option value="" disabled>
                  Year
                </option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Don't use your real name"
            className="w-full bg-input text-foreground rounded px-3 py-2.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-input text-foreground rounded px-3 py-2.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground text-sm"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Gender{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Male Button */}
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded border transition-all ${
                gender === "male"
                  ? "bg-blue-500/20 border-blue-500 text-blue-500 dark:bg-blue-500/30"
                  : "bg-input border-border hover:border-muted-foreground text-foreground"
              }`}
            >
              <FontAwesomeIcon icon={faMars} className="w-5 h-5" />
              <span className="font-medium text-sm">Male</span>
            </button>

            {/* Female Button */}
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded border transition-all ${
                gender === "female"
                  ? "bg-pink-500/20 border-pink-500 text-pink-500 dark:bg-pink-500/30"
                  : "bg-input border-border hover:border-muted-foreground text-foreground"
              }`}
            >
              <FontAwesomeIcon icon={faVenus} className="w-5 h-5" />
              <span className="font-medium text-sm">Female</span>
            </button>
          </div>
        </div>

        {/* Turnstile CAPTCHA */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ theme: "auto", size: "normal" }}
          />
        )}

        {/* Terms */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          By clicking Sign Up, you are agreeing to our{" "}
          <a href="#" className="text-foreground underline hover:text-accent">
            Terms of Use
          </a>{" "}
          (including arbitration) and acknowledge our{" "}
          <a href="#" className="text-foreground underline hover:text-accent">
            Privacy Policy
          </a>
          . If you are under 18, you agree that your parent/guardian permits you
          to create this account and agrees to our Terms of Use.
        </p>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
            {errors.length === 1 ? (
              <div className="font-medium">{errors[0]}</div>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;
