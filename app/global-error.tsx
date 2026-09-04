"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "#f8fafc",
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto",
                borderRadius: 9999,
                border: "2px solid rgba(0,155,159,0.3)",
                backgroundColor: "rgba(0,155,159,0.1)",
                color: "#009b9f",
                fontWeight: 700,
                fontSize: 20,
                lineHeight: "48px",
              }}
            >
              !
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
                margin: "20px 0 8px",
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                cursor: "pointer",
                padding: "10px 24px",
                borderRadius: 9999,
                backgroundColor: "#009b9f",
                color: "#fff",
                fontSize: 14,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
