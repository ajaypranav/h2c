"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

export default function AuthForm() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "", displayName: "" },
  });

  const toggleMode = () => {
    setIsSignIn(!isSignIn);
    reset();
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
          toast.success("Account created! Please check your email to confirm your account.");
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
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-purple)] relative overflow-hidden">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-extrabold text-[var(--color-text)] tracking-tight">
          {isSignIn ? "Welcome Back" : "Get Started"}
        </h2>
        <p className="text-[var(--color-text-muted)] mt-2">
          {isSignIn ? "Log in to continue your learning streak." : "Create an account and start learning faster."}
        </p>
      </div>

      {/* Auth Toggle */}
      <div className="flex rounded-[var(--radius-full)] p-1 bg-[var(--color-surface-2)] mb-8 relative">
        <motion.div
          className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-[var(--radius-full)] shadow-sm"
          animate={{ x: isSignIn ? "4px" : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          type="button"
          onClick={() => { setIsSignIn(true); reset(); }}
          className={`flex-1 relative z-10 py-2 text-sm font-semibold rounded-[var(--radius-full)] transition-colors ${isSignIn ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsSignIn(false); reset(); }}
          className={`flex-1 relative z-10 py-2 text-sm font-semibold rounded-[var(--radius-full)] transition-colors ${!isSignIn ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AnimatePresence mode="popLayout">
          {!isSignIn && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" placeholder="How should we call you?" {...register("displayName")} />
                {errors.displayName && <p className="text-[var(--color-error)] text-xs mt-1">{errors.displayName.message}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-[var(--color-error)] text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {isSignIn && (
              <a href="#" className="text-xs text-[var(--color-primary)] font-semibold hover:underline">Forgot password?</a>
            )}
          </div>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-[var(--color-error)] text-xs mt-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-4" size="lg" isLoading={isLoading}>
          {isSignIn ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </div>
  );
}
