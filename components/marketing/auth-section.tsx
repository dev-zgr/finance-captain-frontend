"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { RootState } from "@/lib/store";
import { login as loginAction } from "@/lib/slices/authSlice";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { LoginForm } from "@/components/components/login-form";
import { RiCheckboxCircleLine } from "@remixicon/react";

interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
}

const BENEFITS = [
  "Automatic transaction categorization",
  "AI-powered spending insights and forecasts",
  "Receipt scanning via Vision Language Model",
];

function LoggedOutContent() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setPending(true);
    setSuccess(false);
    try {
      const response = await axios.post(
        API_ENDPOINTS.LOGIN,
        { email, password },
        { headers: { "Content-Type": "application/json" }, validateStatus: () => true }
      );
      if (response.status === 200 && response.data?.content) {
        dispatch(loginAction(response.data.content));
        window.localStorage.setItem("auth", JSON.stringify(response.data.content));
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1200);
      } else if (response.status === 400) {
        setErrors({ general: response.data?.message || "Validation error.", ...response.data?.fieldErrors });
      } else if (response.status === 401) {
        setErrors({ general: response.data?.message || "Invalid email or password." });
      } else if (response.status === 500) {
        setErrors({ general: response.data?.message || "Internal server error." });
      } else {
        setErrors({ general: "Unexpected error occurred." });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div
      key="logged-out"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start"
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Get started</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Your finances, finally clear.
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Log in and take control of your money in minutes.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
              <RiCheckboxCircleLine size={18} className="text-primary mt-0.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Hide the decorative image column — keep the form only */}
      <div className="w-full max-w-md [&_form+div]:!hidden [&_form]:!col-span-2">
        <LoginForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          pending={pending}
          errors={errors}
          success={success}
        />
      </div>
    </motion.div>
  );
}

export function AuthSection() {
  const { isAuthenticated, isHydrated } = useSelector((s: RootState) => s.auth);

  // The MarketingCta already handles the logged-in welcome — don't duplicate it here
  if (isHydrated && isAuthenticated) return null;

  return (
    <section className="py-24 border-t bg-muted/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <LoggedOutContent />
      </div>
    </section>
  );
}

export default AuthSection;
