import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!key.trim()) {
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem("pb_api_key", key.trim());
        onLogin(key.trim());
      } else {
        setError("Invalid API key");
        triggerShake();
      }
    } catch {
      setError("Connection error. Try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-overlay" />
      <form className="login-card" onSubmit={handleSubmit}>
        <img src="/plant-logo.svg" alt="Plantbook" className="login-logo" />
        <h1 className="login-heading">Welcome to My Garden!</h1>
        <p className="login-subtext">Enter your personal secret API key.</p>
        <input
          className={`login-input${shake ? " login-input--shake" : ""}`}
          type="password"
          placeholder="Enter your API key"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(""); }}
          autoFocus
          disabled={loading}
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Validating…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
