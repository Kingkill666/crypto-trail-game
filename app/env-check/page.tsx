"use client";

/**
 * Environment Variable Diagnostic Page
 * Navigate to /env-check to verify NEXT_PUBLIC vars in production
 */

export default function EnvCheckPage() {
  const rewardsContract = process.env.NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div style={{
      padding: "20px",
      fontFamily: "monospace",
      backgroundColor: "#000",
      color: "#0f0",
      minHeight: "100vh"
    }}>
      <h1>🔍 Environment Variable Check</h1>

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #0f0" }}>
        <h2>NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS:</h2>
        <pre style={{
          fontSize: "14px",
          color: rewardsContract ? "#0f0" : "#f00",
          wordBreak: "break-all"
        }}>
          {rewardsContract || "❌ NOT SET"}
        </pre>
        <p>Length: {rewardsContract.length} characters</p>
        <p>Status: {rewardsContract.length >= 10 ? "✅ VALID" : "❌ TOO SHORT OR MISSING"}</p>
      </div>

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #0f0" }}>
        <h2>NEXT_PUBLIC_APP_URL:</h2>
        <pre style={{ fontSize: "14px", color: "#0f0" }}>
          {appUrl || "❌ NOT SET"}
        </pre>
      </div>

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ff0" }}>
        <h2>Expected Values:</h2>
        <p>NEXT_PUBLIC_REWARDS_CONTRACT_ADDRESS should be:</p>
        <pre style={{ fontSize: "12px", color: "#ff0" }}>
          0xBd727931C785FaDcCd2aF6a4Ea70d12C90341B12
        </pre>
      </div>

      <div style={{ marginTop: "20px" }}>
        <a href="/" style={{ color: "#0ff", textDecoration: "underline" }}>
          ← Back to Game
        </a>
      </div>
    </div>
  );
}
