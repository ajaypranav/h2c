"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  displayName: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

export default function AuthForm() {
  const [isSignIn, setIsSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign in failed";
      toast.error(message);
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: AuthValues) => {
    setIsLoading(true);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // Sync user to DB (create row if first login)
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        if (!data.displayName) {
          toast.error("Display name is required for sign up");
          setIsLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { display_name: data.displayName },
          },
        });
        if (error) throw error;

        // If email confirmation is required, session will be null
        if (!authData.session) {
          toast.success(
            "Account created! Please check your email to confirm your account."
          );
          setIsLoading(false);
          return;
        }

        // Sync new user to DB
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: data.displayName }),
        });

        toast.success("Account created! Let's set up your profile.");
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_12px_32px_rgba(108,71,255,0.08)]">
      {/* Tabs */}
      <div className="flex space-x-1 bg-[#f0f0f9] p-1 rounded-full mb-8 relative">
        <button
          type="button"
          onClick={() => {
            setIsSignIn(false);
            reset();
          }}
          className={`flex-1 py-3 text-center rounded-full font-semibold text-sm transition-all duration-300 ${
            !isSignIn
              ? "bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              : "text-text-muted hover:text-text"
          }`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignIn(true);
            reset();
          }}
          className={`flex-1 py-3 text-center rounded-full font-semibold text-sm transition-all duration-300 ${
            isSignIn
              ? "bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              : "text-text-muted hover:text-text"
          }`}
        >
          Sign In
        </button>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h3 className="font-heading font-bold text-2xl text-text mb-2">
          {isSignIn ? "Welcome back" : "Create an account"}
        </h3>
        <p className="text-sm text-text-muted">
          {isSignIn
            ? "Log in to continue your learning streak."
            : "Start your learning journey today."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Display Name Field (Sign Up only) */}
        <AnimatePresence mode="popLayout">
          {!isSignIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label
                className="block text-sm font-semibold text-text mb-1.5 ml-4"
                htmlFor="displayName"
              >
                Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                  <User size={18} />
                </span>
                <input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  {...register("displayName")}
                  className="w-full bg-[#e2e2ec] border-none rounded-full py-3.5 pl-12 pr-4 text-text placeholder:text-text-light/60 focus:bg-white focus:shadow-[0_0_0_2px_#a391ff] transition-all outline-none text-sm"
                />
              </div>
              {errors.displayName && (
                <p className="text-error text-xs mt-1.5 ml-4">
                  {errors.displayName.message}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Field */}
        <div>
          <label
            className="block text-sm font-semibold text-text mb-1.5 ml-4"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
              <Mail size={18} />
            </span>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className={`w-full bg-[#e2e2ec] border-2 ${
                errors.email ? "border-error/30" : "border-transparent"
              } rounded-full py-3.5 pl-12 pr-4 text-text placeholder:text-text-light/60 focus:bg-white focus:shadow-[0_0_0_2px_#a391ff] focus:border-transparent transition-all outline-none text-sm`}
            />
          </div>
          {errors.email && (
            <p className="text-error text-xs mt-1.5 ml-4">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              className="block text-sm font-semibold text-text ml-4"
              htmlFor="password"
            >
              Password
            </label>
            {isSignIn && (
              <a
                href="#"
                className="text-xs text-primary font-semibold hover:underline mr-2"
              >
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`w-full bg-[#e2e2ec] border-2 ${
                errors.password ? "border-error/30" : "border-transparent"
              } rounded-full py-3.5 pl-12 pr-12 text-text placeholder:text-text-light/60 focus:bg-white focus:shadow-[0_0_0_2px_#a391ff] focus:border-transparent transition-all outline-none text-sm`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex flex-col mt-1.5 px-4 gap-0.5">
            {!isSignIn && (
              <span className="text-xs text-text-muted">
                Min 8 characters, 1 number
              </span>
            )}
            {errors.password && (
              <span className="text-xs text-error font-medium">
                {errors.password.message}
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-dim text-white font-bold py-4 rounded-full shadow-[0_8px_24px_rgba(108,71,255,0.25)] hover:shadow-[0_12px_32px_rgba(108,71,255,0.35)] transition-all duration-300 mt-4 flex justify-center items-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>
                {isSignIn ? "Signing in..." : "Creating account..."}
              </span>
            </>
          ) : (
            <>
              <span>{isSignIn ? "Sign In" : "Create Account"}</span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-border-muted" />
        <span className="flex-shrink-0 mx-4 text-xs font-medium text-text-muted uppercase tracking-wider">
          or
        </span>
        <div className="flex-grow border-t border-border-muted" />
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full bg-transparent border-2 border-border-muted hover:border-primary/50 hover:bg-[#f0f0f9] text-text font-semibold py-3.5 rounded-full transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </button>
    </div>
  );
}
