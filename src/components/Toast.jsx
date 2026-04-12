import { useEffect } from "react";

export function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2700);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">✓ {msg}</div>;
}

export function Dots() {
  return (
    <span className="dots">
      <span />
      <span />
      <span />
    </span>
  );
}
