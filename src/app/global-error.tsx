"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf7f2", color: "#1f1d1a", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif" }}>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button onClick={reset} style={{ background: "#0f5d4a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 24px", cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
