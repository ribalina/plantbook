import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { supabase } from "../lib/supabase";
import ShareModal from "../components/ShareModal";

export default function Passport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlant, savePlant, showToast } = usePlants();
  const [showShare, setShowShare] = useState(false);
  const fileInputRef = useRef(null);

  const plant = getPlant(id);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onUploadMemories = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      showToast("Please select image files.");
      return;
    }

    try {
      const uploadedUrls = [];
      for (const file of images) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `memories/${plant.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("plant-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("plant-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const existing = Array.isArray(plant.memories) ? plant.memories : [];
      const updatedMemories = [...existing, ...uploadedUrls];

      const { error: dbError } = await supabase
        .from("plants")
        .update({ memories: updatedMemories })
        .eq("id", plant.id);

      if (dbError) throw dbError;

      savePlant({ ...plant, memories: updatedMemories });
      showToast(`${uploadedUrls.length} memory photo${uploadedUrls.length > 1 ? "s" : ""} saved.`);
    } catch (err) {
      console.error("Memory upload failed:", err);
      showToast("Could not upload memories. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  if (!plant) {
    return (
      <div className="overlay-screen" style={{ paddingBottom: 0 }}>
        <div className="overlay-header">
          <button className="back-btn" onClick={() => navigate("/")}>←</button>
          <div className="overlay-title">Not Found</div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <div className="empty-title">Plant not found</div>
          <div className="empty-sub">This plant may have been removed.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overlay-screen" style={{ paddingBottom: 0 }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Hero */}
          <div className="passport-hero">
            {plant.imageUrl ? (
              <img src={plant.imageUrl} alt={plant.name} />
            ) : (
              <span>{plant.emoji || "🌿"}</span>
            )}
            <div className="passport-hero-overlay" />
            <div className="passport-hero-controls">
              <button className="passport-hero-btn" onClick={() => navigate("/")} title="Back" aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18 9 12l6-6" />
                </svg>
              </button>
              <button className="passport-hero-btn" onClick={() => setShowShare(true)} title="Share" aria-label="Share passport">
                🔗
              </button>
            </div>
          </div>

          <div className="passport-body">
            <div className="passport-name">{plant.name}</div>
            <div className="passport-latin">{plant.latin}</div>

            {plant.wateringDetail && (
              <div className="water-schedule-bar">
                <strong>💧 Schedule: </strong>
                {plant.wateringDetail}
              </div>
            )}

            <div className="care-grid">
              {[
                { icon: "💧", label: "Watering", value: plant.watering },
                { icon: "☀️", label: "Light", value: plant.light },
                { icon: "💨", label: "Humidity", value: plant.humidity || "Medium" },
                { icon: "🌱", label: "Soil", value: plant.soil || "Standard" },
              ].map((c) => (
                <div key={c.label} className="care-tile">
                  <div className="care-tile-icon">{c.icon}</div>
                  <div className="care-tile-label">{c.label}</div>
                  <div className="care-tile-value">{c.value}</div>
                </div>
              ))}
            </div>

            <div className="share-row">
              <button className="share-btn-full" onClick={() => setShowShare(true)}>
                🔗 Share this Passport
              </button>
            </div>

            <div className="section-heading">Care Notes</div>
            <div className="passport-notes">{plant.notes}</div>

            <div className="section-heading">Plant Memories</div>
            {(plant.memories?.length || 0) === 0 ? (
              <button className="passport-memories-empty" onClick={openFilePicker} type="button">
                <span className="passport-memories-empty-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V8" />
                    <path d="M8.5 11.5 12 8l3.5 3.5" />
                    <path d="M5 17.5A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5" />
                  </svg>
                </span>
                <span className="passport-memories-empty-text">Upload your memories with me</span>
              </button>
            ) : (
              <>
                <div className="passport-memories-grid">
                  {plant.memories.map((src, i) => (
                    <div key={`${plant.id}-memory-${i}`} className="passport-memory-item">
                      <img src={src} alt={`Memory ${i + 1} of ${plant.name}`} />
                    </div>
                  ))}
                </div>
                <button className="passport-memories-add" onClick={openFilePicker} type="button">
                  + Add more memories
                </button>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onUploadMemories}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>

      {showShare && <ShareModal plant={plant} onClose={() => setShowShare(false)} />}
    </>
  );
}
