import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import ThemeToggle from "../components/ThemeToggle";

const FILTERS = ["All", "Today", "< 3 days", "This week", "Later"];

/* Map watering frequency → approximate days between waterings */
function getWateringDays(watering) {
  const w = watering.toLowerCase();
  if (w === "daily") return 1;
  if (w === "twice weekly") return 3;
  if (w === "weekly") return 7;
  if (w === "bi-weekly") return 14;
  if (w === "monthly") return 30;
  return 7;
}

/*
 * Simulate days until next watering.
 * Uses a stable per-plant hash so values stay consistent across renders
 * but vary between plants for realistic-looking data.
 */
function getDaysUntilWatering(plant) {
  const cycle = getWateringDays(plant.watering);
  // Simple hash from plant name to get a stable pseudo-random offset
  let hash = 0;
  for (let i = 0; i < plant.name.length; i++) {
    hash = ((hash << 5) - hash + plant.name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % (cycle + 1);
}

/* Bucket: maps days-until-watering → filter key */
function getTimingBucket(daysUntil) {
  if (daysUntil === 0) return "Today";
  if (daysUntil <= 2) return "< 3 days";
  if (daysUntil <= 7) return "This week";
  return "Later";
}

/* Urgency label shown on cards */
function getUrgencyLabel(plant) {
  const days = getDaysUntilWatering(plant);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function getUrgencyClass(plant) {
  const days = getDaysUntilWatering(plant);
  if (days <= 1) return "urgency-high";
  if (days <= 4) return "urgency-med";
  return "urgency-low";
}

export default function Gallery() {
  const { plants } = usePlants();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [expandedId, setExpandedId] = useState(null);
  const detailRef = useRef(null);

  /* ── Today Mode state ── */
  const [todayMode, setTodayMode] = useState(false);
  const [completedIds, setCompletedIds] = useState([]);
  const [guidesOpen, setGuidesOpen] = useState(false);

  const openGuides = () => {
    if (todayMode) {
      setTodayMode(false);
      setCompletedIds([]);
    }
    setGuidesOpen(true);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleCompleted = (id) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const enterTodayMode = () => {
    setGuidesOpen(false);
    setTodayMode(true);
    setExpandedId(null);
  };

  const exitTodayMode = () => {
    setTodayMode(false);
    setCompletedIds([]);
    setExpandedId(null);
  };

  /* auto-scroll expanded detail into view */
  useEffect(() => {
    if (expandedId && detailRef.current) {
      setTimeout(() => {
        detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    }
  }, [expandedId]);

  const todayPlants = plants.filter((p) => getDaysUntilWatering(p) === 0);
  const needsWaterToday = todayPlants.length;
  const allTodayCompleted = todayPlants.length > 0 && todayPlants.every((p) => completedIds.includes(p.id));

  /* Per-filter counts for chip badges */
  const filterCounts = {};
  FILTERS.forEach((f) => { filterCounts[f] = 0; });
  plants.forEach((p) => {
    const bucket = getTimingBucket(getDaysUntilWatering(p));
    filterCounts[bucket]++;
  });
  filterCounts["All"] = plants.length;

  /* Sort today-mode list: incomplete first, completed at bottom */
  const todaySorted = [...todayPlants].sort((a, b) => {
    const ac = completedIds.includes(a.id) ? 1 : 0;
    const bc = completedIds.includes(b.id) ? 1 : 0;
    return ac - bc;
  });

  const shown = todayMode
    ? todaySorted
    : plants.filter((p) => {
        const s =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.latin.toLowerCase().includes(search.toLowerCase());
        const f =
          filter === "All" ||
          getTimingBucket(getDaysUntilWatering(p)) === filter;
        return s && f;
      });

  return (
    <div className="gallery-page">
      {/* Title row */}
      <div className="gallery-title-row">
        <h1 className="gallery-h1">Iva's Little Garden</h1>
        <ThemeToggle />
      </div>

      {/* 1. Watering Guidelines Card */}
      <div
        className={`g-guides ${guidesOpen ? "g-guides--open" : ""}`}
        onClick={!guidesOpen ? openGuides : undefined}
        role={!guidesOpen ? "button" : undefined}
        tabIndex={!guidesOpen ? 0 : undefined}
      >
        <div className="g-guides-header">
          <div className="g-guides-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2">
              <path strokeLinecap="round" d="M14.5 15.5h-5"/>
              <path d="M5 20V4a1 1 0 011-1h6.172a2 2 0 011.414.586l4.828 4.828A2 2 0 0119 9.828V20a1 1 0 01-1 1H6a1 1 0 01-1-1z"/>
              <path d="M12 3v6a1 1 0 001 1h6"/>
            </svg>
          </div>
          <div className="g-guides-label">Watering Guidelines</div>
          {guidesOpen ? (
            <button className="g-notify-close" onClick={(e) => { e.stopPropagation(); setGuidesOpen(false); }} aria-label="Close guidelines">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className="g-notify-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}
        </div>
        {guidesOpen && (
          <div className="g-guides-body">
            <div className="g-guides-section">
              <div className="g-guides-heading">Before watering</div>
              <ul><li>Touch the soil to check how moist it is</li></ul>
            </div>
            <div className="g-guides-section">
              <div className="g-guides-heading">While watering</div>
              <ul>
                <li>Water a little at a time — avoid soaking the plant</li>
                <li>Most plants prefer drying out between sessions</li>
              </ul>
            </div>
            <div className="g-guides-section">
              <div className="g-guides-heading">After watering</div>
              <ul>
                <li>After ~5 minutes, check for dripping water</li>
                <li>Be careful — furniture is wooden</li>
              </ul>
            </div>
            <div className="g-guides-section">
              <div className="g-guides-heading">Special care</div>
              <ul>
                <li>Some plants (e.g. jasmine) drain from the bottom</li>
                <li>Place 2–3 pieces of kitchen paper underneath</li>
              </ul>
            </div>
            <div className="g-guides-section">
              <div className="g-guides-heading">Avocado (in water)</div>
              <ul>
                <li>Keep the seed half-submerged at all times</li>
                <li>Maintain a consistent water level</li>
                <li>Refill water regularly — do not let it drop</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 2. Today Watering Trigger / Active Bar */}
      {needsWaterToday > 0 && !allTodayCompleted && (
        <div
          className={`g-notify ${todayMode ? "g-notify--progress" : "g-notify--alert"}`}
          onClick={!todayMode ? enterTodayMode : undefined}
          role={!todayMode ? "button" : undefined}
          tabIndex={!todayMode ? 0 : undefined}
        >
          <div className="g-notify-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div className="g-notify-text">
            <div className="g-notify-title">
              {todayMode ? "Watering Mode" : "Today's Watering"}
            </div>
            <div className="g-notify-sub">
              {todayMode
                ? `${completedIds.length} of ${needsWaterToday} completed`
                : `${needsWaterToday} plant${needsWaterToday > 1 ? "s" : ""} need water today`}
            </div>
          </div>
          {todayMode ? (
            <button className="g-notify-close" onClick={exitTodayMode} aria-label="Exit today mode">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <div className="g-notify-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Completed state */}
      {allTodayCompleted && (
        <div className="g-notify g-notify--done">
          <div className="g-notify-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="g-notify-text">
            <div className="g-notify-title">All done!</div>
            <div className="g-notify-sub">All plants watered for today</div>
          </div>
          {todayMode && (
            <button className="g-notify-close" onClick={exitTodayMode} aria-label="Exit today mode">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* No plants need water today */}
      {needsWaterToday === 0 && (
        <div className="g-notify">
          <div className="g-notify-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="g-notify-text">
            <div className="g-notify-title">Next Watering</div>
            <div className="g-notify-sub">All plants are happy for now</div>
          </div>
        </div>
      )}

      {/* 3. Search + Filter Row (hidden in today mode) */}
      {!todayMode && (
        <div className="g-search-row">
        <div className="g-search-bar-row">
          <div className="g-search-wrap">
            <svg className="g-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="g-search-input"
              placeholder="Search plants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="g-view-toggle"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            {viewMode === "grid" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            )}
          </button>
        </div>
        <div className="g-filter-group">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`g-filter-btn ${filter === f ? "active" : ""}${f !== "All" && filter === f ? " g-filter-btn--has-icon" : ""}`}
              onClick={() => {
                if (f === "All") setFilter("All");
                else setFilter(filter === f ? "All" : f);
              }}
            >
              {f}{f !== "All" && filterCounts[f] > 0 ? ` (${filterCounts[f]})` : ""}
              {f !== "All" && filter === f && (
                <svg className="g-filter-x" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* 4. Plant Grid / List */}
      {shown.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <div className="empty-title">No plants found</div>
          <div className="empty-sub">
            Try a different search or filter, or add your first plant.
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="g-list">
          {shown.map((p, i) => {
            const isCompleted = todayMode && completedIds.includes(p.id);
            return (
            <div key={p.id} className={isCompleted ? "g-today-done" : ""}>
              <div
                className={`g-list-row ${expandedId === p.id ? "g-list-row--active" : ""}`}
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => todayMode ? toggleCompleted(p.id) : toggleExpand(p.id)}
              >
                {todayMode && (
                  <button
                    className={`g-check ${isCompleted ? "g-check--done" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleCompleted(p.id); }}
                    aria-label={isCompleted ? "Mark as not watered" : "Mark as watered"}
                  >
                    {isCompleted && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )}
                <div className="g-list-thumb">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} />
                  ) : (
                    <span>{p.emoji || "🌿"}</span>
                  )}
                </div>
                <div className="g-list-info">
                  <div className="g-card-name">{p.name}</div>
                  <div className="g-card-latin">{p.latin}</div>
                </div>
                <div className={`g-urgency-tag ${isCompleted ? "urgency-low" : getUrgencyClass(p)}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  {isCompleted ? `${getWateringDays(p.watering)} days` : getUrgencyLabel(p)}
                </div>
              </div>
              {!todayMode && expandedId === p.id && (
                <div className="g-detail-slot" ref={detailRef}>
                  <ExpandedDetail plant={p} navigate={navigate} />
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="g-grid-wrap">
          {chunkPairs(shown).map((pair, ri) => (
            <div key={ri}>
              <div className="g-grid-row">
                {pair.map((p, ci) => {
                  const isCompleted = todayMode && completedIds.includes(p.id);
                  return (
                  <div
                    key={p.id}
                    className={`g-card ${expandedId === p.id ? "g-card--active" : ""} ${isCompleted ? "g-today-done" : ""}`}
                    style={{ animationDelay: `${(ri * 2 + ci) * 0.05}s` }}
                    onClick={() => todayMode ? toggleCompleted(p.id) : toggleExpand(p.id)}
                  >
                    <div className="g-card-img">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                      ) : (
                        <span className="g-card-emoji">{p.emoji || "🌿"}</span>
                      )}
                      <div className="g-freq-tag">{p.watering}</div>
                      {todayMode && (
                        <button
                          className={`g-check g-check--card ${isCompleted ? "g-check--done" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggleCompleted(p.id); }}
                          aria-label={isCompleted ? "Mark as not watered" : "Mark as watered"}
                        >
                          {isCompleted && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="g-card-body">
                      <div className="g-card-name">{p.name}</div>
                      <div className="g-card-latin">{p.latin}</div>
                      <div className={`g-urgency-tag ${isCompleted ? "urgency-low" : getUrgencyClass(p)}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                        {isCompleted ? `${getWateringDays(p.watering)} days` : getUrgencyLabel(p)}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {pair.length === 1 && <div className="g-card-placeholder" />}
              </div>
              {!todayMode && pair.some((p) => p.id === expandedId) && (
                <div className="g-detail-slot" ref={detailRef}>
                  <ExpandedDetail
                    plant={pair.find((p) => p.id === expandedId)}
                    navigate={navigate}
                    nubPosition={pair.findIndex((p) => p.id === expandedId) === 0 ? "25%" : "75%"}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Helper: chunk array into pairs ── */
function chunkPairs(arr) {
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push(arr.slice(i, i + 2));
  }
  return pairs;
}

/* ── Expanded Detail Panel ── */
function ExpandedDetail({ plant, navigate, nubPosition }) {
  const p = plant;
  return (
    <div
      className={`g-detail-panel${nubPosition ? ' g-detail-panel--has-nub' : ''}`}
      style={nubPosition ? { '--nub-x': nubPosition } : undefined}
    >
      <div className="g-detail-inner">
        {/* Care info tiles */}
        <div className="g-detail-tiles">
          <div className="g-detail-tile">
            <span className="g-detail-tile-icon">💧</span>
            <span className="g-detail-tile-label">Water</span>
            <span className="g-detail-tile-value">{p.watering}</span>
          </div>
          <div className="g-detail-tile">
            <span className="g-detail-tile-icon">☀️</span>
            <span className="g-detail-tile-label">Light</span>
            <span className="g-detail-tile-value">{p.light || "Indirect"}</span>
          </div>
          <div className="g-detail-tile">
            <span className="g-detail-tile-icon">💦</span>
            <span className="g-detail-tile-label">Humidity</span>
            <span className="g-detail-tile-value">{p.humidity || "Medium"}</span>
          </div>
        </div>

        {/* Notes snippet */}
        {p.notes && (
          <div className="g-detail-notes">{p.notes.slice(0, 120)}{p.notes.length > 120 ? "…" : ""}</div>
        )}

        {/* Action row */}
        <div className="g-detail-actions">
          <button
            className="g-detail-btn g-detail-btn--primary"
            onClick={(e) => { e.stopPropagation(); navigate(`/plant/${p.id}`); }}
          >
            View full passport
          </button>
        </div>
      </div>
    </div>
  );
}
