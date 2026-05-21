import { useEffect, useRef } from "react";

export default function SettingsDropdown({ items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onClose]);

  return (
    <div className="settings-dropdown" ref={ref}>
      {items.map((item) => (
        <button
          key={item.label}
          className={`settings-dropdown-item${item.danger ? " settings-dropdown-item--danger" : ""}${item.disabled ? " settings-dropdown-item--disabled" : ""}`}
          onClick={() => { if (!item.disabled) { item.action(); onClose(); } }}
          disabled={item.disabled}
        >
          {item.icon && <span className="settings-dropdown-icon">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
