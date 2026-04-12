import { Link, useLocation } from "react-router-dom";

export default function BottomNav({ onScan }) {
  const { pathname } = useLocation();
  const isGallery = pathname === "/";
  const isManage = pathname === "/manage";

  return (
    <nav className="bnav">
      {/* SVG nav bar with circular cutout */}
      <svg
        className="bnav-bg"
        viewBox="0 0 430 70"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3,0 L161,0 Q173,0 173,12 A42,42 0 1,0 257,12 Q257,0 269,0 L427,0 Q430,0 430,3 L430,70 L0,70 L0,3 Q0,0 3,0 Z"
          fill="currentColor"
        />
      </svg>

      {/* Left tab */}
      <Link
        to="/"
        className={`bnav-tab bnav-tab--left ${isGallery ? "bnav-tab--active" : ""}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="bnav-tab-label">Home</span>
      </Link>

      {/* Center floating button */}
      <div className="bnav-center">
        <button className="bnav-fab" onClick={onScan} aria-label="Scan a plant">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>

      {/* Right tab */}
      <Link
        to="/manage"
        className={`bnav-tab bnav-tab--right ${isManage ? "bnav-tab--active" : ""}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="bnav-tab-label">Manage</span>
      </Link>
    </nav>
  );
}
