"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#f7f6f4",
          color: "#101014",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <main style={{ textAlign: "center", padding: "0 24px", maxWidth: 480 }}>
          <div
            style={{
              display: "inline-flex",
              padding: 14,
              borderRadius: 16,
              background: "rgba(79,70,229,0.08)",
              color: "#4f46e5",
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: 32, letterSpacing: "-0.02em", margin: "20px 0 10px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#55555f", lineHeight: 1.6, margin: "0 0 28px" }}>
            An unexpected error occurred on our side. Nothing is lost — you can simply try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
