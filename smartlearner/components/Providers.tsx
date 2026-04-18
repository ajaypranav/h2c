"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#FFFFFF",
            color: "#1A1433",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            padding: "12px 20px",
            fontFamily: "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            iconTheme: {
              primary: "#00C896",
              secondary: "#FFFFFF",
            },
            style: {
              borderLeft: "4px solid #00C896",
            },
          },
          error: {
            iconTheme: {
              primary: "#FF4757",
              secondary: "#FFFFFF",
            },
            style: {
              borderLeft: "4px solid #FF4757",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
