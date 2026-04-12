export default function ShareModal({ plant, onClose }) {
  const url = `${window.location.href.split("?")[0]}?plant=${plant.id}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="modal-title">Share Plant Passport</div>
        <p className="modal-desc">
          Anyone with this link can view{" "}
          <strong style={{ color: "var(--sage-lt)" }}>{plant.name}</strong>'s
          care instructions — no account needed.
        </p>
        <div className="share-link-box">{url}</div>
        <button
          className="copy-link-btn"
          onClick={() => {
            navigator.clipboard.writeText(url);
            onClose();
          }}
        >
          📋 Copy Link
        </button>
        <button className="modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
