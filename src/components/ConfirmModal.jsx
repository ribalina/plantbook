import { useEffect } from "react";

export default function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="modal-title">{title}</div>
        <p className="modal-desc">{message}</p>
        <button className="confirm-modal-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="modal-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
