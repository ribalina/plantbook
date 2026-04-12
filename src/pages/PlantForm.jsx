import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { claudeJSON } from "../services/ai";
import { Dots } from "../components/Toast";

export default function PlantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlant, savePlant, showToast } = usePlants();

  const existing = id ? getPlant(id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState(
    existing || {
      name: "",
      latin: "",
      watering: "Weekly",
      light: "",
      humidity: "Medium",
      soil: "",
      notes: "",
      wateringDetail: "",
      emoji: "🌿",
    }
  );
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generateAI = async () => {
    if (!form.name) return;
    setLoading(true);
    setAiNote(null);
    try {
      const data = await claudeJSON(
        `You are a plant care expert. For the plant "${form.name}", return ONLY JSON (no markdown) with: latin, watering (e.g. "Weekly"), light (e.g. "Bright indirect"), humidity, soil, notes (2–3 sentences), wateringDetail (1 sentence), emoji (single plant emoji).`
      );
      setForm((f) => ({ ...f, ...data }));
      setAiNote(data.notes);
    } catch {
      setAiNote("Could not generate — please fill in manually.");
    }
    setLoading(false);
  };

  const handleSave = () => {
    const plant = { ...form, id: form.id || Date.now() };
    savePlant(plant);
    showToast(isEdit ? "Plant updated!" : "Plant added to collection!");
    navigate(isEdit ? "/manage" : "/");
  };

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="overlay-title">{isEdit ? "Edit Plant" : "Add Plant"}</div>
      </div>
      <div className="overlay-body">
        <div className="form-body">
          <div className="form-group">
            <label className="form-label">Plant Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Fiddle Leaf Fig"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <button
            className="ai-generate-btn"
            onClick={generateAI}
            disabled={loading || !form.name}
          >
            {loading ? (
              <>
                <Dots /> Generating…
              </>
            ) : (
              "✨ Auto-fill care info with AI"
            )}
          </button>

          {aiNote && (
            <div className="ai-note">
              <strong>AI Suggestion Applied ✓</strong>
              {aiNote}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Latin Name</label>
            <input
              className="form-input"
              placeholder="e.g. Ficus lyrata"
              value={form.latin}
              onChange={(e) => set("latin", e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Watering</label>
              <select
                className="form-select"
                value={form.watering}
                onChange={(e) => set("watering", e.target.value)}
              >
                {["Daily", "Twice weekly", "Weekly", "Bi-weekly", "Monthly"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  )
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Light</label>
              <input
                className="form-input"
                placeholder="Bright indirect"
                value={form.light}
                onChange={(e) => set("light", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Humidity</label>
              <select
                className="form-select"
                value={form.humidity}
                onChange={(e) => set("humidity", e.target.value)}
              >
                {["Low", "Medium", "High"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Soil Type</label>
              <input
                className="form-input"
                placeholder="Well-draining"
                value={form.soil}
                onChange={(e) => set("soil", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Care Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Watering tips, special needs, seasonal notes…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Watering Schedule Detail</label>
            <input
              className="form-input"
              placeholder="e.g. Every 7 days; reduce in winter"
              value={form.wateringDetail}
              onChange={(e) => set("wateringDetail", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emoji Icon</label>
            <input
              className="form-input"
              placeholder="🌿"
              value={form.emoji}
              maxLength={2}
              onChange={(e) => set("emoji", e.target.value)}
              style={{ fontSize: 22, textAlign: "center" }}
            />
          </div>

          <button className="save-plant-btn" onClick={handleSave}>
            {isEdit ? "💾 Save Changes" : "🌱 Add to Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}
