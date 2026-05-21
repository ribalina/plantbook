import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { supabase } from "../lib/supabase";
import ShareModal from "../components/ShareModal";
import ConfirmModal from "../components/ConfirmModal";
import FullscreenViewer from "../components/FullscreenViewer";
import SettingsDropdown from "../components/SettingsDropdown";
import { uploadMemoryImage, insertMemoryRecord, fetchPlantMemories, setAsThumbnail, toggleFavorite, deleteMemories } from "../services/plantStorage";

function parseDayCount(val) {
  if (typeof val === "number") return Math.max(1, Math.min(15, val));
  if (!val) return 7;
  const m = String(val).match(/Every\s+(\d+)/i);
  if (m) return Math.max(1, Math.min(15, parseInt(m[1], 10)));
  return 7;
}

export default function Passport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlant, savePlant, deletePlant, showToast } = usePlants();
  const fileInputRef = useRef(null);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);
  const lastClickedIdx = useRef(null);
  const swipeSelecting = useRef(false);
  const gridRef = useRef(null);
  const lastTapTime = useRef(0);
  const singleTapTimer = useRef(null);

  const [memories, setMemories] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());
  const [showMemoryMenu, setShowMemoryMenu] = useState(false);

  const plant = getPlant(id);

  useEffect(() => {
    if (!plant) return;
    fetchPlantMemories(plant.id).then((data) => setMemories(data));
  }, [plant?.id]);

  // Edit mode helpers
  const LIGHT_OPTIONS = ["Low light", "Partial shade", "Bright indirect", "Direct sun"];
  const HUMIDITY_OPTIONS = ["Low", "Medium", "High"];
  const SOIL_OPTIONS = ["Standard", "Well-draining", "Sandy", "Clay", "Loamy", "Peat-based"];

  const enterEditMode = () => {
    setEditForm({
      name: plant.name || "",
      latin_name: plant.latin_name || "",
      watering_days: parseDayCount(plant.watering_label),
      light: plant.light || "",
      humidity: plant.humidity || "Medium",
      soil: plant.soil || "Standard",
      care_notes: plant.care_notes || "",
    });
    setEditMode(true);
    setShowSettings(false);
  };

  const saveEdit = async () => {
    const wateringDays = editForm.watering_days;
    // Recalculate next_watering_at based on last_watered_at or now
    const base = plant.last_watered_at ? new Date(plant.last_watered_at) : new Date();
    const nextWatering = new Date(base);
    nextWatering.setDate(nextWatering.getDate() + wateringDays);
    const payload = {
      name: editForm.name.trim(),
      latin_name: editForm.latin_name.trim() || null,
      watering_frequency_days: wateringDays,
      watering_label: `Every ${wateringDays} day/s`,
      light: editForm.light || null,
      humidity: editForm.humidity || null,
      soil: editForm.soil || null,
      care_notes: editForm.care_notes.trim() || null,
      next_watering_at: nextWatering.toISOString(),
    };
    const { error } = await supabase.from("plants").update(payload).eq("id", plant.id);
    if (error) { showToast("Could not save changes."); return; }
    savePlant({ ...plant, ...payload });
    setEditMode(false);
    setEditForm(null);
    showToast("Saved!");
  };

  const cancelEdit = () => { setEditMode(false); setEditForm(null); };

  const openFilePicker = () => fileInputRef.current?.click();

  const onUploadMemories = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) { showToast("Please select image files."); return; }

    try {
      const currentCount = (memories || []).length;
      const newRecords = [];
      for (let i = 0; i < images.length; i++) {
        const result = await uploadMemoryImage(images[i], plant.name, plant.id, currentCount + i + 1);
        if (!result) continue;
        const record = await insertMemoryRecord(plant.id, { ...result, orderIndex: currentCount + i });
        if (record) newRecords.push(record);
      }
      if (newRecords.length) {
        setMemories((prev) => [...(prev || []), ...newRecords]);
        showToast(`${newRecords.length} memory photo${newRecords.length > 1 ? "s" : ""} saved.`);
      } else {
        showToast("Could not upload memories. Please try again.");
      }
    } catch (err) {
      console.error("Memory upload failed:", err);
      showToast("Could not upload memories. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const handleDeletePlant = async () => {
    await deletePlant(plant.id);
    navigate(-1);
  };

  // --- Selection mode handlers ---
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIdxs(new Set());
    setShowMemoryMenu(false);
  };

  const toggleSelect = (idx) => {
    setSelectedIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const onLongPressStart = useCallback((idx) => {
    // Only use long-press on narrow screens
    if (window.innerWidth >= 1200) return;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setSelectionMode(true);
      setSelectedIdxs(new Set([idx]));
    }, 500);
  }, []);

  const onLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMemoryClick = (src, idx, e) => {
    if (longPressFired.current) { longPressFired.current = false; return; }

    // Double-tap to enter selection on wide screens
    if (!selectionMode && window.innerWidth >= 1200) {
      const now = Date.now();
      if (now - lastTapTime.current < 400) {
        clearTimeout(singleTapTimer.current);
        setSelectionMode(true);
        setSelectedIdxs(new Set([idx]));
        lastTapTime.current = 0;
        return;
      }
      lastTapTime.current = now;
      singleTapTimer.current = setTimeout(() => { setViewerImage(src); }, 400);
      return;
    }

    if (selectionMode) {
      if (e?.shiftKey && lastClickedIdx.current != null) {
        const from = Math.min(lastClickedIdx.current, idx);
        const to = Math.max(lastClickedIdx.current, idx);
        setSelectedIdxs((prev) => {
          const next = new Set(prev);
          for (let i = from; i <= to; i++) next.add(i);
          return next;
        });
      } else {
        toggleSelect(idx);
      }
      lastClickedIdx.current = idx;
    } else {
      setViewerImage(src);
    }
  };

  // Swipe-to-select: get index from pointer position
  const getIdxFromPoint = useCallback((x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const item = el.closest(".passport-memory-item");
    if (!item || !gridRef.current?.contains(item)) return null;
    const items = Array.from(gridRef.current.children);
    const idx = items.indexOf(item);
    return idx >= 0 ? idx : null;
  }, []);

  const onGridPointerDown = useCallback((e) => {
    if (!selectionMode) return;
    swipeSelecting.current = true;
  }, [selectionMode]);

  const onGridPointerMove = useCallback((e) => {
    if (!swipeSelecting.current || !selectionMode) return;
    const idx = getIdxFromPoint(e.clientX, e.clientY);
    if (idx != null) {
      setSelectedIdxs((prev) => { if (prev.has(idx)) return prev; const next = new Set(prev); next.add(idx); return next; });
    }
  }, [selectionMode, getIdxFromPoint]);

  const onGridPointerUp = useCallback(() => {
    swipeSelecting.current = false;
  }, []);

  // Delete selected memories
  const deleteSelectedMemories = async () => {
    const selected = [...selectedIdxs].map((i) => memories[i]).filter(Boolean);
    const ok = await deleteMemories(selected);
    if (!ok) { showToast("Could not delete memories."); return; }
    setMemories((prev) => prev.filter((m) => !selected.includes(m)));
    exitSelectionMode();
    showToast("Memories deleted.");
  };

  // Delete single memory
  const deleteSingleMemory = async (idx) => {
    const mem = memories[idx];
    if (!mem) return;
    const ok = await deleteMemories([mem]);
    if (!ok) { showToast("Could not delete memory."); return; }
    setMemories((prev) => prev.filter((_, i) => i !== idx));
    exitSelectionMode();
    showToast("Memory deleted.");
  };

  // Replace thumbnail with selected
  const replaceThumbnail = async () => {
    if (selectedIdxs.size !== 1) return;
    const idx = [...selectedIdxs][0];
    const mem = memories[idx];

    // If current thumbnail isn't already in memories, add it as a memory
    const currentUrl = plant.thumbnail_url || plant.image_url;
    if (currentUrl && !memories.some((m) => m.image_url === currentUrl)) {
      await insertMemoryRecord(plant.id, {
        publicUrl: currentUrl,
        storagePath: currentUrl,
        filename: currentUrl.split("/").pop() || "original.jpg",
        orderIndex: memories.length,
      });
    }

    const ok = await setAsThumbnail(plant.id, mem.id, mem.image_url);
    if (!ok) { showToast("Could not update thumbnail."); return; }
    savePlant({ ...plant, image_url: mem.image_url, thumbnail_url: mem.image_url });

    // Refresh memories to show the old thumbnail
    const refreshed = await fetchPlantMemories(plant.id);
    setMemories(refreshed);

    exitSelectionMode();
    showToast("Thumbnail updated!");
  };

  // Add to highlights (favorites)
  const addToHighlights = async () => {
    const selected = [...selectedIdxs].map((i) => memories[i]).filter(Boolean);
    let added = 0;
    for (const mem of selected) {
      if (mem.is_favorite) continue;
      const ok = await toggleFavorite(plant.id, mem.id, memories);
      if (!ok) { showToast("Maximum 5 highlights allowed."); break; }
      added++;
    }
    if (added) {
      const refreshed = await fetchPlantMemories(plant.id);
      setMemories(refreshed);
      showToast(`${added} added to highlights!`);
    }
    exitSelectionMode();
  };

  if (!plant) {
    return (
      <div className="overlay-screen" style={{ paddingBottom: 0 }}>
        <div className="overlay-header">
          <button className="back-btn" onClick={() => navigate(-1)}>&larr;</button>
          <div className="overlay-title">Not Found</div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">&#127793;</div>
          <div className="empty-title">Plant not found</div>
          <div className="empty-sub">This plant may have been removed.</div>
        </div>
      </div>
    );
  }

  const settingsItems = [
    { label: "Edit", icon: "\u270F\uFE0F", action: enterEditMode },
    { label: "Share", icon: "\uD83D\uDD17", action: () => setShowShare(true) },
    { label: "Delete", icon: "\uD83D\uDDD1\uFE0F", danger: true, action: () => setShowConfirm({ type: "delete-plant" }) },
  ];

  const memoryMenuItems = [
    { label: "Add to highlights", icon: "\u2B50", action: addToHighlights },
    { label: "Set as main thumbnail", icon: "\uD83D\uDDBC\uFE0F", action: () => replaceThumbnail(), disabled: selectedIdxs.size !== 1 },
    { label: "Delete selected", icon: "\uD83D\uDDD1\uFE0F", danger: true, action: () => setShowConfirm({ type: "delete-memories" }) },
  ];

  return (
    <>
      <div className="overlay-screen" style={{ paddingBottom: 0 }}>
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Sticky top buttons */}
          <div className="passport-sticky-bar">
            <button className="passport-bar-btn" onClick={() => editMode ? cancelEdit() : navigate(-1)} aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18 9 12l6-6" />
              </svg>
            </button>
            <div className="passport-bar-right">
              <button className="passport-bar-btn" onClick={() => setShowSettings((s) => !s)} aria-label="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </button>
              {showSettings && <SettingsDropdown items={settingsItems} onClose={() => setShowSettings(false)} />}
              {editMode && (
                <button className="passport-bar-btn passport-bar-btn--save" onClick={saveEdit} aria-label="Save">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Square image */}
          <div className="passport-image-wrap">
            {plant.image_url ? (
              <img
                src={plant.image_url}
                alt={plant.name}
                className="passport-image"
                onClick={() => setViewerImage(plant.image_url)}
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }}
              />
            ) : null}
            <div className="passport-image-fallback" style={plant.image_url ? { display: "none" } : undefined}>
              {plant.emoji || "\uD83C\uDF3F"}
            </div>
          </div>

          <div className="passport-body">
            {editMode ? (
              <input className="passport-name passport-name--edit" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            ) : (
              <div className="passport-name">{plant.name}</div>
            )}
            {editMode ? (
              <input className="passport-latin passport-latin--edit" value={editForm.latin_name} onChange={(e) => setEditForm({ ...editForm, latin_name: e.target.value })} placeholder="Latin name" />
            ) : (
              <div className="passport-latin">{plant.latin_name}</div>
            )}

            <div className="care-grid">
              {editMode ? (
                <>
                  <div className="care-tile">
                    <div className="care-tile-icon">💧</div>
                    <div className="care-tile-label">Watering</div>
                    <div className="care-tile-value care-tile-value--edit">
                      <select value={editForm.watering_days} onChange={(e) => setEditForm({ ...editForm, watering_days: Number(e.target.value) })}>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Every {d} day/s</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="care-tile">
                    <div className="care-tile-icon">\u2600\uFE0F</div>
                    <div className="care-tile-label">Light</div>
                    <div className="care-tile-value care-tile-value--edit">
                      <select value={editForm.light} onChange={(e) => setEditForm({ ...editForm, light: e.target.value })}>
                        <option value="">Select...</option>
                        {LIGHT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="care-tile">
                    <div className="care-tile-icon">💨</div>
                    <div className="care-tile-label">Humidity</div>
                    <div className="care-tile-value care-tile-value--edit">
                      <select value={editForm.humidity} onChange={(e) => setEditForm({ ...editForm, humidity: e.target.value })}>
                        {HUMIDITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="care-tile">
                    <div className="care-tile-icon">🌱</div>
                    <div className="care-tile-label">Soil</div>
                    <div className="care-tile-value care-tile-value--edit">
                      <select value={editForm.soil} onChange={(e) => setEditForm({ ...editForm, soil: e.target.value })}>
                        <option value="">Select...</option>
                        {SOIL_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                [
                  { icon: "\uD83D\uDCA7", label: "Watering", value: plant.watering_label },
                  { icon: "\u2600\uFE0F", label: "Light", value: plant.light },
                  { icon: "\uD83D\uDCA8", label: "Humidity", value: plant.humidity || "Medium" },
                  { icon: "\uD83C\uDF31", label: "Soil", value: plant.soil || "Standard" },
                ].map((c) => (
                  <div key={c.label} className="care-tile">
                    <div className="care-tile-icon">{c.icon}</div>
                    <div className="care-tile-label">{c.label}</div>
                    <div className="care-tile-value">{c.value}</div>
                  </div>
                ))
              )}
            </div>

            <div className="section-heading">Care Notes</div>
            {editMode ? (
              <textarea className="passport-notes passport-notes--edit" value={editForm.care_notes} onChange={(e) => setEditForm({ ...editForm, care_notes: e.target.value })} />
            ) : (
              <div className="passport-notes">{plant.care_notes}</div>
            )}

            {/* Memories heading with actions */}
            <div className="passport-memories-header">
              <div className="section-heading" style={{ marginBottom: 0 }}>Plant Memories</div>
              {selectionMode && (
                <div className="passport-memories-header-actions">
                  <span className="passport-selection-count">{selectedIdxs.size} selected</span>
                  <div className="passport-memory-menu-wrap">
                    <button className="passport-bar-btn passport-bar-btn--sm passport-bar-btn--plain" onClick={() => setShowMemoryMenu((s) => !s)} aria-label="Bulk actions">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="19" r="1.5" fill="currentColor" />
                      </svg>
                    </button>
                    {showMemoryMenu && <SettingsDropdown items={memoryMenuItems} onClose={() => setShowMemoryMenu(false)} />}
                  </div>
                  <button className="passport-selection-done" onClick={exitSelectionMode} aria-label="Done">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Favorites carousel */}
            {memories?.filter(m => m.is_favorite).length > 0 && (
              <div className="passport-highlights-carousel">
                {memories.filter(m => m.is_favorite).sort((a, b) => (a.favorite_order || 0) - (b.favorite_order || 0)).map((mem) => (
                  <div key={mem.id} className="passport-highlight-item" onClick={() => setViewerImage(mem.image_url)}>
                    <img src={mem.image_url} alt="Highlight" />
                  </div>
                ))}
              </div>
            )}

            {(memories?.length || 0) === 0 ? (
              <button className="passport-memories-empty" onClick={openFilePicker} type="button">
                <span className="passport-memories-empty-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V8" /><path d="M8.5 11.5 12 8l3.5 3.5" /><path d="M5 17.5A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5" />
                  </svg>
                </span>
                <span className="passport-memories-empty-text">Upload your memories with me</span>
              </button>
            ) : (
              <>
                <div
                  ref={gridRef}
                  className={`passport-memories-grid${selectionMode ? " passport-memories-grid--selecting" : ""}`}
                  onPointerMove={onGridPointerMove}
                  onPointerUp={onGridPointerUp}
                  style={selectionMode ? { touchAction: "none" } : undefined}
                >
                  {memories.filter(m => !m.is_favorite).map((mem, i) => (
                    <div
                      key={mem.id || `${plant.id}-memory-${i}`}
                      className={`passport-memory-item${selectionMode ? " passport-memory-item--selectable" : ""}${selectedIdxs.has(i) ? " passport-memory-item--selected" : ""}`}
                      onClick={(e) => handleMemoryClick(mem.image_url, i, e)}
                      onPointerDown={(e) => { onLongPressStart(i); onGridPointerDown(e); }}
                      onPointerUp={onLongPressEnd}
                      onPointerLeave={onLongPressEnd}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img src={mem.image_url} alt={`Memory ${i + 1} of ${plant.name}`} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                      {selectionMode && (
                        <>
                          <div className={`memory-select-dot${selectedIdxs.has(i) ? " memory-select-dot--active" : ""}`}>
                            {selectedIdxs.has(i) && <div className="memory-select-dot-fill" />}
                          </div>
                          <button
                            className="memory-delete-btn"
                            onClick={(e) => { e.stopPropagation(); setShowConfirm({ type: "delete-single-memory", idx: i }); }}
                            aria-label="Delete memory"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18" /><path d="M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <button className="passport-memories-add" onClick={openFilePicker} type="button">
                  + Add more memories
                </button>
              </>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onUploadMemories} style={{ display: "none" }} />
          </div>
        </div>
      </div>

      {showShare && <ShareModal plant={plant} onClose={() => setShowShare(false)} />}
      {viewerImage && <FullscreenViewer src={viewerImage} alt={plant.name} onClose={() => setViewerImage(null)} />}
      {showConfirm?.type === "delete-plant" && (
        <ConfirmModal
          title="Delete Plant?"
          message={`Are you sure you want to delete "${plant.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeletePlant}
          onCancel={() => setShowConfirm(null)}
        />
      )}
      {showConfirm?.type === "delete-memories" && (
        <ConfirmModal
          title={`Delete ${selectedIdxs.size} Memor${selectedIdxs.size === 1 ? "y" : "ies"}?`}
          message="Are you sure? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={async () => { setShowConfirm(null); await deleteSelectedMemories(); }}
          onCancel={() => setShowConfirm(null)}
        />
      )}
      {showConfirm?.type === "delete-single-memory" && (
        <ConfirmModal
          title="Delete Memory?"
          message="Are you sure you want to delete this memory? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={async () => { const idx = showConfirm.idx; setShowConfirm(null); await deleteSingleMemory(idx); }}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </>
  );
}