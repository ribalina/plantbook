import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { Dots } from "../components/Toast";
import { supabase } from "../lib/supabase";

/* ── helpers ── */
const DAYS = Array.from({ length: 15 }, (_, i) => i + 1);

function parseDayCount(val) {
  if (typeof val === "number") return Math.max(0, Math.min(15, val));
  if (!val) return 7;
  const m = String(val).match(/Every\s+(\d+)/i);
  if (m) return Math.max(0, Math.min(15, parseInt(m[1], 10)));
  const legacy = { Daily: 1, "Twice weekly": 3, Weekly: 7, "Bi-weekly": 14, Monthly: 15 };
  return legacy[val] || 7;
}

function formatDays(n) {
  return `Every ${n} day/s`;
}

/* ── compact watering picker ── */
function WateringPicker({ value, onChange }) {
  const current = parseDayCount(value);

  const dec = (e) => {
    e.stopPropagation();
    if (current > 0) onChange(formatDays(current - 1));
  };
  const inc = (e) => {
    e.stopPropagation();
    if (current < 15) onChange(formatDays(current + 1));
  };

  return (
    <div className="wp">
      <button type="button" className="wp-arrow" onClick={dec} aria-label="Decrease">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div className="wp-center">
        <span className="wp-value">{current}</span>
        <span className="wp-unit">day{current !== 1 ? "s" : ""}</span>
      </div>
      <button type="button" className="wp-arrow" onClick={inc} aria-label="Increase">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

function addDaysToNow(days) {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function buildPlantPayload(form) {
  const wateringDays = parseDayCount(form.watering);

  return {
    name: form.name.trim(),
    latin_name: form.latin.trim() || null,
    watering_frequency_days: wateringDays,
    watering_label: formatDays(wateringDays),
    watering_schedule_detail: form.wateringDetail.trim() || null,
    light: form.light.trim() || null,
    humidity: form.humidity || null,
    soil: form.soil.trim() || null,
    care_notes: form.notes.trim() || null,
    image_url: null,
    last_watered_at: null,
    next_watering_at: addDaysToNow(wateringDays),
  };
}

export default function PlantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlant, showToast, loadPlants } = usePlants();

  const existing = id ? getPlant(id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState(() => {
    if (existing) return existing;
    return {
      name: "",
      latin: "",
      watering: "Every 7 day/s",
      light: "",
      humidity: "Medium",
      soil: "",
      notes: "",
      wateringDetail: "",
      emoji: "🌿",
    };
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiNote, setAiNote] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      set("imageUrl", reader.result);
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadingImage(false);
      showToast("Could not upload image. Please try again.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const generateAI = async () => {
  if (!form.name) return;

  setLoading(true);
  setAiNote(null);

  try {
    const res = await fetch("/api/autofill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: form.name }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "AI failed");
    }

    setForm((f) => ({ ...f, ...data }));
    setAiNote(data.notes || "AI suggestion applied.");
  } catch (err) {
    setAiNote("Could not generate — please fill in manually.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleSave = async () => {
  if (saving) return;
  setSaving(true);
  try {
    const payload = buildPlantPayload(form);

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("plants").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("plants").insert([payload]));
    }

    if (error) {
      console.error("Error saving plant:", error);
      showToast("Could not save plant.");
      setSaving(false);
      return;
    }

    showToast(isEdit ? "Plant updated!" : "Plant added to collection!");
    navigate("/");
    loadPlants();
  } catch (err) {
    console.error(err);
    showToast("Could not save plant.");
    setSaving(false);
  }
};

  return (
    <div className="overlay-screen overlay-screen--full">
      <div className="overlay-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="overlay-title">{isEdit ? "Edit Plant" : "Add Plant"}</div>
      </div>
      <div className="overlay-body">
        <div className="form-body">
          <div className="form-top-row">
            <label className="image-upload-card" htmlFor="plant-image-upload">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Plant profile" className="image-upload-preview" />
              ) : (
                <div className="image-upload-empty">
                  <span className="image-upload-icon" aria-hidden="true">🖼️</span>
                  <span className="image-upload-title">Plant profile image</span>
                  <span className="image-upload-sub">Tap to upload</span>
                </div>
              )}
              {uploadingImage && <span className="image-upload-loading">Uploading…</span>}
            </label>

            <input
              id="plant-image-upload"
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              style={{ display: "none" }}
            />

            <div className="form-name-column">
              <div className="form-group">
                <label className="form-label">Plant name</label>
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
            </div>
          </div>

          {aiNote && (
            <div className="ai-note">
              <strong>AI Suggestion Applied ✓</strong>
              {aiNote}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Latin name</label>
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
              <WateringPicker
                value={form.watering}
                onChange={(v) => set("watering", v)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Light</label>
              <div className="field-with-icon">
                <span className="field-left-icon" aria-hidden="true">☀️</span>
                <input
                  className="form-input icon-input"
                  placeholder="Bright indirect"
                  value={form.light}
                  onChange={(e) => set("light", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Humidity</label>
              <div className="field-with-icon">
                <span className="field-left-icon" aria-hidden="true">💦</span>
                <select
                  className="form-select icon-select"
                  value={form.humidity}
                  onChange={(e) => set("humidity", e.target.value)}
                >
                  {["Low", "Medium", "High"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Soil type</label>
              <div className="field-with-icon">
                <span className="field-left-icon" aria-hidden="true">🌱</span>
                <input
                  className="form-input icon-input"
                  placeholder="Well-draining"
                  value={form.soil}
                  onChange={(e) => set("soil", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Care notes</label>
            <textarea
              className="form-textarea"
              placeholder="Watering tips, special needs, seasonal notes…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Watering schedule detail</label>
            <input
              className="form-input"
              placeholder="e.g. Every 7 days; reduce in winter"
              value={form.wateringDetail}
              onChange={(e) => set("wateringDetail", e.target.value)}
            />
          </div>

          <button
            className="save-plant-btn"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? <><Dots /> Saving…</> : isEdit ? "💾 Save Changes" : "🌱 Add to Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}
