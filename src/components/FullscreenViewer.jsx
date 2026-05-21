import { useEffect } from "react";

export default function FullscreenViewer({ src, alt, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fullscreen-viewer" onClick={onClose}>
      <button className="fullscreen-viewer-close" onClick={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" /><path d="M6 6l12 12" />
        </svg>
      </button>
      <img src={src} alt={alt || ""} className="fullscreen-viewer-img" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
