import { useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Manage() {
  const { plants, deletePlant } = usePlants();
  const navigate = useNavigate();

  return (
    <>
      <div className="overlay-header" style={{ paddingTop: 52, border: "none" }}>
        <div style={{ flex: 1 }}>
          <div className="gallery-eyebrow">Your Plants</div>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: "var(--fs-h3)",
              color: "var(--cream)",
              fontWeight: 500,
              lineHeight: "var(--lh-h3)",
              letterSpacing: "var(--ls-h3)",
            }}
          >
            Manage
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="manage-list">
        {plants.length === 0 && (
          <div className="empty-state" style={{ padding: "40px 0" }}>
            <div className="empty-icon">🌱</div>
            <div className="empty-title">No plants yet</div>
            <div className="empty-sub">Add your first plant to get started.</div>
          </div>
        )}
        {plants.map((p) => (
          <div key={p.id} className="manage-row">
            <div className="manage-thumb">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" />
              ) : (
                <span>{p.emoji || "🌿"}</span>
              )}
            </div>
            <div className="manage-info">
              <div className="manage-name">{p.name}</div>
              <div className="manage-water">💧 {p.watering}</div>
            </div>
            <div className="manage-actions">
              <button className="icon-action-btn edit" onClick={() => navigate(`/edit/${p.id}`)}>
                ✏️
              </button>
              <button className="icon-action-btn del" onClick={() => deletePlant(p.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="add-new-btn" onClick={() => navigate("/add")}>
        ＋ Add New Plant
      </button>
    </>
  );
}
