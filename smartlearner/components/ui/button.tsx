import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "onDragStart" | "onDragEnd" | "onDrag" | "ref" | "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: props.disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: props.disabled || isLoading ? 1 : 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-full)] font-heading font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden",
          {
            "bg-[var(--color-primary)] text-white hover:shadow-glow": variant === "primary",
            "bg-white border-2 border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]": variant === "secondary",
            "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]": variant === "ghost",
            "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90": variant === "danger",
            "h-9 px-4 text-sm": size === "sm",
            "h-12 px-8 text-base": size === "md",
            "h-14 px-10 text-lg": size === "lg",
          },
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <span className={cn(isLoading && "opacity-0 invisible")}>{children}</span>
        {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
