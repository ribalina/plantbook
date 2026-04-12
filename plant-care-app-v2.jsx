import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink:       #0E1510;
  --ink-soft:  #171F18;
  --ink-mid:   #1E2B1F;
  --moss:      #2A3D2B;
  --fern:      #3B5E3C;
  --sage:      #7A9E7B;
  --sage-lt:   #A8C5A9;
  --leaf:      #5C8F5D;
  --cream:     #F0EBE0;
  --cream-dk:  #D9D2C5;
  --amber:     #D4922A;
  --amber-lt:  #F0B84A;
  --white:     #FFFFFF;
  --danger:    #C0503A;
  --text:      #E8E3D8;
  --text-mid:  #A8A398;
  --text-dim:  #6B6860;
  --glass:     rgba(255,255,255,0.04);
  --glass-bd:  rgba(255,255,255,0.09);
  --shadow:    0 8px 32px rgba(0,0,0,0.45);
  --shadow-sm: 0 2px 12px rgba(0,0,0,0.3);
  --r:  14px;
  --r-sm: 9px;
  --r-pill: 999px;
}

html, body { height: 100%; }
body { font-family: 'Outfit', sans-serif; background: var(--ink); color: var(--text); overscroll-behavior: none; }

.app-shell {
  position: relative;
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--ink);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── BACKGROUND TEXTURE ── */
.app-shell::after {
  content: '';
  position: fixed;
  inset: 0;
  max-width: 430px;
  margin: 0 auto;
  background:
    radial-gradient(ellipse 60% 40% at 80% 10%, rgba(92,143,93,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 20% 90%, rgba(212,146,42,0.05) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ── SCROLLABLE CONTENT AREA ── */
.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 88px;
  position: relative;
  z-index: 1;
  -webkit-overflow-scrolling: touch;
}

/* ════════════════════════════════════════
   BOTTOM NAVIGATION  (white, elevated FAB)
════════════════════════════════════════ */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  /* enough height for the FAB to overflow above */
  height: 72px;
  background: #FFFFFF;
  border-top: 1px solid rgba(0,0,0,0.07);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.10);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding-bottom: 12px;
  z-index: 200;
  /* clip nothing — let FAB poke above */
  overflow: visible;
}

/* ── LEFT / RIGHT TABS ── */
.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 6px 0 0;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-tab-icon {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s;
}

.nav-tab-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  transition: color 0.2s;
}

.nav-tab.active .nav-tab-icon  { transform: scale(1.12); }
.nav-tab.active .nav-tab-label { color: #3B5E3C; }
.nav-tab.inactive .nav-tab-label { color: #ABABAB; }
.nav-tab.inactive .nav-tab-icon  { filter: grayscale(0.5); opacity: 0.55; }

/* ── CENTER FAB WRAPPER ── */
.nav-center-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* shift the button up so it floats above the bar */
  position: relative;
  top: 0;
}

/* The actual FAB */
.scan-fab {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(145deg, #5C8F5D, #3B5E3C);
  border: 4px solid #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* lifts above the nav bar */
  position: relative;
  bottom: 22px;
  box-shadow:
    0 4px 16px rgba(59,94,60,0.35),
    0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

/* SVG camera icon inside FAB */
.scan-fab svg {
  width: 26px;
  height: 26px;
  color: #FFFFFF;
  flex-shrink: 0;
}

.scan-fab:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow:
    0 8px 24px rgba(59,94,60,0.40),
    0 2px 6px rgba(0,0,0,0.18);
}

.scan-fab:active {
  transform: scale(0.94);
  box-shadow:
    0 2px 8px rgba(59,94,60,0.30),
    0 1px 3px rgba(0,0,0,0.12);
}

/* ════════════════════════════════════════
   GALLERY SCREEN
════════════════════════════════════════ */
.gallery-header {
  padding: 52px 22px 0;
}

.gallery-eyebrow {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sage);
  margin-bottom: 6px;
}

.gallery-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 500;
  color: var(--cream);
  line-height: 1.1;
  margin-bottom: 22px;
}

/* ── WATERING GUIDELINES CARD ── */
.guidelines-card {
  margin: 0 22px 20px;
  padding: 18px 20px;
  background: linear-gradient(135deg, var(--moss), var(--ink-mid));
  border: 1px solid rgba(122,158,123,0.2);
  border-radius: var(--r);
  display: flex;
  align-items: center;
  gap: 16px;
}

.guidelines-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--r-sm);
  background: rgba(92,143,93,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.guidelines-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sage);
  margin-bottom: 3px;
}

.guidelines-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--cream);
  line-height: 1.4;
}

.guidelines-pill {
  margin-left: auto;
  flex-shrink: 0;
  background: rgba(212,146,42,0.15);
  color: var(--amber-lt);
  border: 1px solid rgba(212,146,42,0.3);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--r-pill);
}

/* ── SEARCH + FILTER ── */
.search-filter-row {
  display: flex;
  gap: 10px;
  padding: 0 22px 16px;
  align-items: center;
}

.search-wrap {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-dim);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 14px 11px 36px;
  background: var(--glass);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-pill);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}

.search-input::placeholder { color: var(--text-dim); }
.search-input:focus { border-color: var(--sage); }

.filter-scroll {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.filter-scroll::-webkit-scrollbar { display: none; }

.filter-chip {
  padding: 8px 13px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.18s;
  font-family: 'Outfit', sans-serif;
}

.filter-chip.on  { background: var(--sage); color: var(--ink); border-color: var(--sage); }
.filter-chip.off { background: transparent; color: var(--text-mid); border-color: var(--glass-bd); }
.filter-chip.off:hover { border-color: var(--sage); color: var(--sage-lt); }

/* ── PLANT GRID ── */
.plant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 0 22px 8px;
}

.plant-card {
  background: var(--ink-soft);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
  animation: fadeUp 0.35s ease both;
  position: relative;
}

.plant-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: rgba(122,158,123,0.3);
}

.plant-card:active { transform: scale(0.97); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.plant-card-media {
  width: 100%;
  aspect-ratio: 1;
  background: var(--ink-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  position: relative;
  overflow: hidden;
}

.plant-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-card-media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(14,21,16,0.8) 0%, transparent 50%);
}

.water-chip {
  position: absolute;
  bottom: 9px;
  left: 9px;
  background: rgba(14,21,16,0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-pill);
  padding: 3px 9px;
  font-size: 10px;
  font-weight: 500;
  color: var(--sage-lt);
}

.plant-card-body {
  padding: 11px 12px 13px;
}

.plant-card-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 500;
  color: var(--cream);
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-card-latin {
  font-size: 11px;
  color: var(--text-dim);
  font-style: italic;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plant-card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.plant-tag {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: var(--r-pill);
  font-weight: 500;
}

.tag-light { background: rgba(212,146,42,0.12); color: var(--amber-lt); }
.tag-water { background: rgba(92,143,93,0.15); color: var(--sage-lt); }

/* ── EMPTY STATE ── */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 24px 40px;
}

.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.4; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--cream); margin-bottom: 8px; }
.empty-sub { font-size: 14px; color: var(--text-dim); line-height: 1.6; }

/* ════════════════════════════════════════
   OVERLAY / FULL SCREEN
════════════════════════════════════════ */
.overlay-screen {
  position: fixed;
  inset: 0;
  max-width: 430px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  z-index: 300;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.32,0,0.67,0) both;
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(40px); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0); opacity: 1; }
}

.overlay-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 52px 22px 18px;
  border-bottom: 1px solid var(--glass-bd);
  flex-shrink: 0;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--glass);
  border: 1px solid var(--glass-bd);
  color: var(--text);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.back-btn:hover { background: rgba(255,255,255,0.08); }

.overlay-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--cream);
  flex: 1;
}

.overlay-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ════════════════════════════════════════
   PLANT PASSPORT
════════════════════════════════════════ */
.passport-hero {
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--ink-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  position: relative;
  overflow: hidden;
}

.passport-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.passport-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--ink) 0%, transparent 55%);
}

.passport-hero-btns {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
}

.passport-hero-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(14,21,16,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-bd);
  color: var(--text);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.passport-hero-btn:hover { background: rgba(14,21,16,0.9); }

.passport-body { padding: 20px 22px 40px; }

.passport-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px;
  font-weight: 500;
  color: var(--cream);
  margin-bottom: 2px;
}

.passport-latin {
  font-size: 14px;
  color: var(--text-mid);
  font-style: italic;
  margin-bottom: 24px;
}

.care-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
}

.care-tile {
  background: var(--ink-soft);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  padding: 14px;
}

.care-tile-icon { font-size: 22px; margin-bottom: 8px; }
.care-tile-label { font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 3px; }
.care-tile-value { font-size: 14px; font-weight: 500; color: var(--text); }

.section-heading {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 500;
  color: var(--cream);
  margin-bottom: 12px;
}

.passport-notes {
  background: var(--ink-soft);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r);
  padding: 16px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-mid);
  margin-bottom: 16px;
}

.water-schedule-bar {
  padding: 14px 16px;
  background: rgba(92,143,93,0.08);
  border-radius: var(--r-sm);
  border-left: 3px solid var(--leaf);
  font-size: 13px;
  color: var(--text-mid);
  line-height: 1.6;
}

.water-schedule-bar strong { color: var(--sage-lt); }

/* ── SHARE PILL ── */
.share-row {
  margin-top: 24px;
  display: flex;
  gap: 10px;
}

.share-btn-full {
  flex: 1;
  padding: 13px;
  background: var(--moss);
  border: 1px solid rgba(122,158,123,0.25);
  border-radius: var(--r);
  color: var(--sage-lt);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}

.share-btn-full:hover { background: var(--fern); }

/* ════════════════════════════════════════
   SCAN / CAMERA SCREEN  (slide right→left)
════════════════════════════════════════ */

/* Entry: slides in from right */
@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

/* Exit: slides back out to right */
@keyframes slideOutToRight {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

.scan-screen {
  position: fixed;
  inset: 0;
  max-width: 430px;
  left: 50%;
  /* base: centered */
  transform: translateX(-50%);
  background: #000;
  z-index: 400;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Applied while entering */
.scan-screen.entering {
  animation: scanEnter 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both;
}
@keyframes scanEnter {
  from { transform: translateX(calc(-50% + 100vw)); }
  to   { transform: translateX(-50%); }
}

/* Applied while exiting — JS toggles this class then removes element */
.scan-screen.exiting {
  animation: scanExit 0.28s cubic-bezier(0.55,0,1,0.45) both;
}
@keyframes scanExit {
  from { transform: translateX(-50%); }
  to   { transform: translateX(calc(-50% + 100vw)); }
}

/* ── TOP BAR ── */
.scan-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 52px 20px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%);
}

.scan-title {
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.scan-close {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.18);
  color: #fff;
  font-size: 19px;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}

.scan-close:hover  { background: rgba(0,0,0,0.65); }
.scan-close:active { background: rgba(255,255,255,0.1); }

/* ── VIEWFINDER ── */
.scan-viewfinder {
  flex: 1;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Live <video> element fills the viewfinder */
.scan-viewfinder video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Captured / uploaded image preview */
.scan-viewfinder .preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── PLACEHOLDER (no camera) ── */
.cam-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.25);
  user-select: none;
}

.cam-placeholder-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px dashed rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.cam-placeholder-text {
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
  max-width: 200px;
}

/* ── SCAN-FRAME OVERLAY (corner guides) ── */
.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 65%;
  aspect-ratio: 1;
  transform: translate(-50%, -56%); /* nudge up from center */
  pointer-events: none;
}

.scan-frame-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: rgba(122,158,123,0.8);
  border-style: solid;
}

.sfc-tl { top:0; left:0;  border-width: 2.5px 0 0 2.5px; border-radius: 3px 0 0 0; }
.sfc-tr { top:0; right:0; border-width: 2.5px 2.5px 0 0; border-radius: 0 3px 0 0; }
.sfc-bl { bottom:0; left:0;  border-width: 0 0 2.5px 2.5px; border-radius: 0 0 0 3px; }
.sfc-br { bottom:0; right:0; border-width: 0 2.5px 2.5px 0; border-radius: 0 0 3px 0; }

/* scanning pulse line */
.scan-line {
  position: absolute;
  left: 8%;
  width: 84%;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(92,143,93,0.8), transparent);
  animation: scanLine 2.2s ease-in-out infinite;
  border-radius: 1px;
}

@keyframes scanLine {
  0%   { top: 10%; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 90%; opacity: 0; }
}

/* ── BOTTOM CONTROLS (native camera style) ── */
.scan-controls {
  flex-shrink: 0;
  background: #000;
  padding: 28px 40px 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Left: gallery picker button */
.cam-gallery-btn {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: background 0.18s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.cam-gallery-btn:hover  { background: rgba(255,255,255,0.14); }
.cam-gallery-btn:active { background: rgba(255,255,255,0.06); transform: scale(0.95); }
.cam-gallery-btn svg    { width: 24px; height: 24px; color: rgba(255,255,255,0.7); }

/* Thumbnail when gallery image is loaded */
.cam-gallery-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* Center: capture / identify button (dual role) */
.cam-capture-ring {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color 0.18s;
  -webkit-tap-highlight-color: transparent;
}

.cam-capture-ring:active { border-color: rgba(255,255,255,0.8); }
.cam-capture-ring:active .cam-capture-inner { transform: scale(0.91); }

.cam-capture-inner {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s, background 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

/* When in "identify" mode, inner turns green */
.cam-capture-inner.identify-mode {
  background: linear-gradient(145deg, #5C8F5D, #3B5E3C);
}

/* Loading spinner inside capture */
.cam-spinner {
  width: 26px;
  height: 26px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Right: flip camera button (or spacer) */
.cam-flip-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.cam-flip-btn:hover  { background: rgba(255,255,255,0.14); }
.cam-flip-btn:active { transform: scale(0.93); }
.cam-flip-btn svg    { width: 24px; height: 24px; color: rgba(255,255,255,0.7); }

input[type="file"].hidden-file { display: none; }

/* ── RECOGNITION RESULT CARD ── */
.result-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(14,21,16,0.97);
  backdrop-filter: blur(24px);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid var(--glass-bd);
  padding: 16px 20px 36px;
  animation: sheetRise 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  z-index: 5;
}

@keyframes sheetRise {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--glass-bd);
  margin: 0 auto 18px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.result-thumb {
  width: 58px;
  height: 58px;
  border-radius: var(--r-sm);
  background: var(--ink-mid);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.result-thumb img { width: 100%; height: 100%; object-fit: cover; }

.result-info { flex: 1; min-width: 0; }
.result-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: var(--cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-latin { font-size: 12px; color: var(--text-dim); font-style: italic; }

.result-save-btn {
  padding: 11px 18px;
  background: var(--leaf);
  border: none;
  border-radius: var(--r-sm);
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.result-save-btn:hover { background: var(--fern); }

.result-care-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.result-care-chip {
  flex: 1;
  padding: 10px;
  background: var(--glass);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  text-align: center;
}

.result-care-chip .rc-label { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 2px; }
.result-care-chip .rc-val { font-size: 12px; font-weight: 500; color: var(--text); }

.result-discard-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  color: var(--text-dim);
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.result-discard-btn:hover { border-color: var(--sage); color: var(--text-mid); }

/* ════════════════════════════════════════
   MANAGE PLANTS SCREEN
════════════════════════════════════════ */
.manage-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 22px;
}

.manage-row {
  background: var(--ink-soft);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.2s;
}

.manage-row:hover { border-color: rgba(122,158,123,0.25); }

.manage-thumb {
  width: 50px;
  height: 50px;
  border-radius: var(--r-sm);
  background: var(--ink-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  overflow: hidden;
}

.manage-thumb img { width: 100%; height: 100%; object-fit: cover; }

.manage-info { flex: 1; min-width: 0; }
.manage-name { font-size: 15px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.manage-water { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

.manage-actions { display: flex; gap: 7px; }

.icon-action-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--r-sm);
  border: 1px solid var(--glass-bd);
  background: var(--glass);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, border-color 0.2s;
}

.icon-action-btn.edit:hover { background: rgba(122,158,123,0.15); border-color: var(--sage); }
.icon-action-btn.del:hover  { background: rgba(192,80,58,0.15); border-color: var(--danger); }

.add-new-btn {
  margin: 4px 22px 20px;
  width: calc(100% - 44px);
  padding: 16px;
  background: linear-gradient(135deg, var(--leaf), var(--fern));
  border: none;
  border-radius: var(--r);
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 18px rgba(92,143,93,0.25);
  transition: opacity 0.2s, transform 0.15s;
}

.add-new-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.add-new-btn:active { transform: scale(0.98); }

/* ════════════════════════════════════════
   ADD / EDIT FORM
════════════════════════════════════════ */
.form-body {
  padding: 20px 22px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group { display: flex; flex-direction: column; gap: 7px; }

.form-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--sage);
}

.form-input, .form-select, .form-textarea {
  padding: 13px 15px;
  background: var(--ink-soft);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
}

.form-input::placeholder, .form-textarea::placeholder { color: var(--text-dim); }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--sage); }
.form-textarea { resize: vertical; min-height: 100px; line-height: 1.65; }

.form-select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6860' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.ai-generate-btn {
  padding: 13px;
  background: rgba(92,143,93,0.1);
  border: 1px solid rgba(92,143,93,0.25);
  border-radius: var(--r-sm);
  color: var(--sage-lt);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}

.ai-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-generate-btn:not(:disabled):hover { background: rgba(92,143,93,0.18); }

.ai-note {
  padding: 12px 15px;
  background: rgba(92,143,93,0.07);
  border-radius: var(--r-sm);
  border-left: 2px solid var(--leaf);
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-mid);
  animation: fadeUp 0.3s ease;
}

.ai-note strong { color: var(--sage-lt); display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }

.save-plant-btn {
  padding: 16px;
  background: var(--amber);
  border: none;
  border-radius: var(--r);
  color: var(--ink);
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(212,146,42,0.25);
  transition: opacity 0.2s, transform 0.15s;
}

.save-plant-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.save-plant-btn:active { transform: scale(0.98); }

/* ── LOADING DOTS ── */
.dots span {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  margin: 0 2px;
  animation: dot-bounce 1.1s infinite ease-in-out;
}
.dots span:nth-child(2) { animation-delay: 0.18s; }
.dots span:nth-child(3) { animation-delay: 0.36s; }

@keyframes dot-bounce {
  0%,80%,100% { transform: scale(0.5); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── TOAST ── */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30,43,31,0.97);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(122,158,123,0.25);
  color: var(--sage-lt);
  padding: 11px 20px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  animation: toastIn 0.3s ease, toastOut 0.3s ease 2.3s both;
}

@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { to { opacity:0; transform: translateX(-50%) translateY(6px); } }

/* ── SHARE MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  max-width: 430px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.65);
  z-index: 500;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

.modal-sheet {
  width: 100%;
  background: var(--ink-soft);
  border-radius: 24px 24px 0 0;
  border-top: 1px solid var(--glass-bd);
  padding: 20px 22px 44px;
  animation: sheetRise 0.3s cubic-bezier(0.34,1.3,0.64,1) both;
}

.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--cream); margin-bottom: 14px; }
.modal-desc { font-size: 13px; color: var(--text-mid); line-height: 1.65; margin-bottom: 18px; }

.share-link-box {
  background: var(--glass);
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  padding: 13px 15px;
  font-size: 12px;
  color: var(--text-dim);
  word-break: break-all;
  margin-bottom: 12px;
  font-family: monospace;
}

.copy-link-btn {
  width: 100%;
  padding: 14px;
  background: var(--leaf);
  border: none;
  border-radius: var(--r-sm);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
  transition: background 0.2s;
}

.copy-link-btn:hover { background: var(--fern); }

.modal-cancel {
  width: 100%;
  padding: 13px;
  background: transparent;
  border: 1px solid var(--glass-bd);
  border-radius: var(--r-sm);
  color: var(--text-dim);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  cursor: pointer;
}
`;

/* ─────────────────────────────────────────────────────────────────────────────
   SEED DATA
───────────────────────────────────────────────────────────────────────────── */
const SEEDS = [
  { id:1, emoji:"🌿", name:"Monstera Deliciosa", latin:"Monstera deliciosa",        watering:"Weekly",       light:"Bright indirect",   humidity:"High",   soil:"Well-draining", notes:"Wipe leaves monthly. Let top 2\" dry before watering. Loves humidity — mist in summer.", wateringDetail:"Every 7 days; reduce to 10–14 days in winter." },
  { id:2, emoji:"🌵", name:"Golden Barrel Cactus",latin:"Echinocactus grusonii",   watering:"Monthly",      light:"Full sun",           humidity:"Low",    soil:"Sandy/cactus",  notes:"Nearly impossible to kill by under-watering. Overwatering is the main risk. Needs direct sun.", wateringDetail:"Once every 4 weeks in summer. Every 6–8 weeks in winter." },
  { id:3, emoji:"🌸", name:"Peace Lily",          latin:"Spathiphyllum wallisii",  watering:"Twice weekly", light:"Low–medium indirect",humidity:"Medium", soil:"Peat-rich",     notes:"Droops visibly when thirsty — great visual cue. Toxic to pets. Wipe dust off leaves regularly.", wateringDetail:"Keep soil moist but not soggy. Water every 3–4 days." },
  { id:4, emoji:"🍃", name:"Pothos",              latin:"Epipremnum aureum",       watering:"Weekly",       light:"Any indirect",       humidity:"Any",    soil:"Standard potting",notes:"Extremely resilient. Prune to encourage bushiness. Will trail beautifully from a shelf.", wateringDetail:"Water when top 1\" of soil is dry — roughly every 7–10 days." },
];

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────────────────── */
let styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  const el = document.createElement("style");
  el.textContent = STYLES;
  document.head.appendChild(el);
  styleInjected = true;
}

function usePlants() {
  const [plants, setPlants] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pc_plants_v2")) || SEEDS; }
    catch { return SEEDS; }
  });
  useEffect(() => {
    localStorage.setItem("pc_plants_v2", JSON.stringify(plants));
  }, [plants]);
  return [plants, setPlants];
}

async function claudeJSON(prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role:"user", content: prompt }],
    }),
  });
  const d = await r.json();
  const txt = d.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

async function claudeVision(base64, mediaType) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type:"image", source:{ type:"base64", media_type: mediaType, data: base64 } },
          { type:"text",  text: 'Identify this plant. Return ONLY JSON (no markdown) with keys: name, latin, watering (e.g. "Weekly"), light (e.g. "Bright indirect"), humidity, soil, notes (2–3 care sentences), wateringDetail (one sentence), emoji (single relevant plant emoji). If unidentifiable use "Unknown Plant".' },
        ],
      }],
    }),
  });
  const d = await r.json();
  const txt = d.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

function Dots() {
  return <span className="dots"><span/><span/><span/></span>;
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2700); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast">✓ {msg}</div>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SCREENS
───────────────────────────────────────────────────────────────────────────── */

/* ══ GALLERY ══════════════════════════════════════════════════════════════════ */
function Gallery({ plants, onSelect, onAdd }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const FILTERS = ["All", "Daily", "Twice weekly", "Weekly", "Monthly"];

  const needsWater = plants.filter(p =>
    ["daily","twice weekly","weekly"].some(w => p.watering.toLowerCase().includes(w.replace("twice weekly","twice")))
  ).length;

  const shown = plants.filter(p => {
    const s = p.name.toLowerCase().includes(search.toLowerCase()) || p.latin.toLowerCase().includes(search.toLowerCase());
    const f = filter === "All" || p.watering.toLowerCase() === filter.toLowerCase();
    return s && f;
  });

  return (
    <>
      <div className="gallery-header">
        <div className="gallery-eyebrow">My Collection</div>
        <div className="gallery-title">Plant<br/>Passport</div>
      </div>

      {/* Guidelines */}
      <div className="guidelines-card">
        <div className="guidelines-icon-wrap">💧</div>
        <div>
          <div className="guidelines-label">Watering Guidelines</div>
          <div className="guidelines-value">Water in the morning.<br/>Check soil before watering.</div>
        </div>
        {needsWater > 0 && (
          <div className="guidelines-pill">{needsWater} this week</div>
        )}
      </div>

      {/* Search + filter */}
      <div className="search-filter-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search plants…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-scroll">
          {FILTERS.map(f => (
            <button key={f} className={`filter-chip ${filter===f?"on":"off"}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="plant-grid">
        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <div className="empty-title">No plants found</div>
            <div className="empty-sub">Try a different search or filter, or add your first plant.</div>
          </div>
        ) : shown.map((p, i) => (
          <div
            key={p.id}
            className="plant-card"
            style={{ animationDelay: `${i * 0.045}s` }}
            onClick={() => onSelect(p)}
          >
            <div className="plant-card-media">
              {p.imageUrl ? <img src={p.imageUrl} alt={p.name}/> : <span>{p.emoji || "🌿"}</span>}
              <div className="plant-card-media-overlay"/>
              <div className="water-chip">💧 {p.watering}</div>
            </div>
            <div className="plant-card-body">
              <div className="plant-card-name">{p.name}</div>
              <div className="plant-card-latin">{p.latin}</div>
              <div className="plant-card-tags">
                <span className="plant-tag tag-light">☀️ {p.light}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══ PASSPORT ═════════════════════════════════════════════════════════════════ */
function Passport({ plant, onBack, onShare }) {
  return (
    <div className="overlay-screen" style={{ paddingBottom: 0 }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero */}
        <div className="passport-hero">
          {plant.imageUrl ? <img src={plant.imageUrl} alt={plant.name}/> : <span>{plant.emoji || "🌿"}</span>}
          <div className="passport-hero-overlay"/>
          <div style={{ position:"absolute", top:52, left:20 }}>
            <button className="back-btn" onClick={onBack}>←</button>
          </div>
          <div className="passport-hero-btns">
            <button className="passport-hero-btn" onClick={onShare} title="Share">🔗</button>
          </div>
        </div>

        <div className="passport-body">
          <div className="passport-name">{plant.name}</div>
          <div className="passport-latin">{plant.latin}</div>

          <div className="care-grid">
            {[
              { icon:"💧", label:"Watering",  value: plant.watering },
              { icon:"☀️", label:"Light",     value: plant.light },
              { icon:"💨", label:"Humidity",  value: plant.humidity || "Medium" },
              { icon:"🌱", label:"Soil",      value: plant.soil || "Standard" },
            ].map(c => (
              <div key={c.label} className="care-tile">
                <div className="care-tile-icon">{c.icon}</div>
                <div className="care-tile-label">{c.label}</div>
                <div className="care-tile-value">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="section-heading">Care Notes</div>
          <div className="passport-notes">{plant.notes}</div>

          {plant.wateringDetail && (
            <div className="water-schedule-bar">
              <strong>💧 Schedule: </strong>{plant.wateringDetail}
            </div>
          )}

          <div className="share-row">
            <button className="share-btn-full" onClick={onShare}>🔗 Share this Passport</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ SCAN / CAMERA SCREEN ═════════════════════════════════════════════════════ */
function ScanScreen({ onClose, onSave }) {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const fileRef    = useRef(null);

  const [hasCamera,   setHasCamera]   = useState(false);
  const [facingMode,  setFacingMode]  = useState("environment");
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadB64,   setUploadB64]   = useState(null);
  const [uploadType,  setUploadType]  = useState("image/jpeg");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [exiting,     setExiting]     = useState(false);

  const previewUrl = capturedUrl || uploadedUrl;

  /* ── start camera ── */
  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCamera(true);
    } catch {
      setHasCamera(false);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [facingMode, startCamera]);

  /* ── animated close ── */
  const handleClose = () => {
    setExiting(true);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setTimeout(() => onClose(), 290);
  };

  /* ── capture frame from live video ── */
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !hasCamera) return null;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  /* ── main capture button handler ── */
  const handleCapture = () => {
    if (result) { handleDiscard(); return; }
    if (previewUrl) { identifyImage(); return; }
    if (hasCamera) {
      const dataUrl = captureFrame();
      if (dataUrl) {
        setCapturedUrl(dataUrl);
        if (videoRef.current) videoRef.current.pause();
      }
    } else {
      fileRef.current?.click();
    }
  };

  /* ── file picker ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedUrl(URL.createObjectURL(file));
    setUploadType(file.type || "image/jpeg");
    setResult(null);
    setCapturedUrl(null);
    const fr = new FileReader();
    fr.onload = ev => setUploadB64(ev.target.result.split(",")[1]);
    fr.readAsDataURL(file);
    if (videoRef.current) videoRef.current.pause();
  };

  /* ── identify via Claude Vision ── */
  const identifyImage = async () => {
    setLoading(true);
    let b64   = uploadB64;
    let mtype = uploadType;
    if (capturedUrl && !uploadB64) { b64 = capturedUrl.split(",")[1]; mtype = "image/jpeg"; }
    if (!b64) { setLoading(false); return; }
    try {
      const data = await claudeVision(b64, mtype);
      setResult({ ...data, imageUrl: previewUrl });
    } catch {
      setResult({ name:"Unknown Plant", latin:"", watering:"Weekly", light:"Indirect", humidity:"Medium", soil:"Standard potting", notes:"Could not identify — standard tropical houseplant care applied.", wateringDetail:"Water when top inch of soil is dry.", emoji:"🌿", imageUrl: previewUrl });
    }
    setLoading(false);
  };

  /* ── discard & resume ── */
  const handleDiscard = () => {
    setResult(null); setCapturedUrl(null); setUploadedUrl(null); setUploadB64(null);
    if (videoRef.current && hasCamera) videoRef.current.play();
  };

  /* ── save ── */
  const handleSave = () => onSave({ ...result, id: Date.now() });

  /* ── flip ── */
  const handleFlip = () => { setCapturedUrl(null); setResult(null); setFacingMode(f => f === "environment" ? "user" : "environment"); };

  const isIdentifyMode = !!previewUrl && !result;

  return (
    <div className={`scan-screen ${exiting ? "exiting" : "entering"}`}>

      {/* ── TOP BAR ── */}
      <div className="scan-topbar">
        <div className="scan-title">
          {result ? "Result" : previewUrl ? "Identify Plant" : "Scan Plant"}
        </div>
        <button className="scan-close" onClick={handleClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{width:18,height:18}}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── VIEWFINDER ── */}
      <div className="scan-viewfinder">
        {/* Live video */}
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width:"100%", height:"100%", objectFit:"cover", display: previewUrl ? "none" : "block" }}
        />

        {/* Frozen / uploaded preview */}
        {previewUrl && (
          <img className="preview-img" src={previewUrl} alt="Plant"
            style={result ? {filter:"brightness(0.5)"} : {}}
          />
        )}

        {/* Placeholder */}
        {!hasCamera && !previewUrl && (
          <div className="cam-placeholder">
            <div className="cam-placeholder-icon">📷</div>
            <div className="cam-placeholder-text">Camera not available.<br/>Use the gallery button to upload a photo.</div>
          </div>
        )}

        {/* Corner guides (only while live) */}
        {!previewUrl && (
          <div className="scan-frame">
            <div className="scan-frame-corner sfc-tl"/>
            <div className="scan-frame-corner sfc-tr"/>
            <div className="scan-frame-corner sfc-bl"/>
            <div className="scan-frame-corner sfc-br"/>
            <div className="scan-line"/>
          </div>
        )}

        {/* ── RESULT FLOATING CARD ── */}
        {result && (
          <div className="result-sheet">
            <div className="sheet-handle"/>
            <div className="result-row">
              <div className="result-thumb">
                {result.imageUrl ? <img src={result.imageUrl} alt=""/> : <span>{result.emoji||"🌿"}</span>}
              </div>
              <div className="result-info">
                <div className="result-name">{result.name}</div>
                <div className="result-latin">{result.latin}</div>
              </div>
              <button className="result-save-btn" onClick={handleSave}>Save</button>
            </div>
            <div className="result-care-row">
              {[["💧","Water",result.watering],["☀️","Light",result.light],["💨","Humidity",result.humidity||"Med"]].map(([ic,lb,vl]) => (
                <div key={lb} className="result-care-chip">
                  <div className="rc-label">{ic} {lb}</div>
                  <div className="rc-val">{vl}</div>
                </div>
              ))}
            </div>
            <button className="result-discard-btn" onClick={handleDiscard}>Try again</button>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS (hidden while result shown) ── */}
      {!result && (
        <div className="scan-controls">
          {/* Gallery picker */}
          <button className="cam-gallery-btn" onClick={() => fileRef.current?.click()} aria-label="Open gallery">
            {uploadedUrl
              ? <img className="cam-gallery-thumb" src={uploadedUrl} alt=""/>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
            }
          </button>

          {/* Capture / Identify */}
          <div className="cam-capture-ring" onClick={handleCapture} role="button"
            aria-label={isIdentifyMode ? "Identify" : "Capture"}>
            <div className={`cam-capture-inner ${isIdentifyMode ? "identify-mode" : ""}`}>
              {loading
                ? <div className="cam-spinner"/>
                : isIdentifyMode
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26,color:"#fff"}}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  : null
              }
            </div>
          </div>

          {/* Flip camera */}
          <button className="cam-flip-btn" onClick={handleFlip} aria-label="Flip camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden-file" onChange={handleFileSelect}/>
    </div>
  );
}

/* ══ MANAGE ═══════════════════════════════════════════════════════════════════ */
function Manage({ plants, onDelete, onEdit, onAdd }) {
  return (
    <>
      <div className="overlay-header" style={{ paddingTop: 52, border:"none" }}>
        <div style={{ flex:1 }}>
          <div className="gallery-eyebrow">Your Plants</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, color:"var(--cream)", fontWeight:500 }}>Manage</div>
        </div>
      </div>
      <div className="manage-list">
        {plants.length === 0 && (
          <div className="empty-state" style={{ padding:"40px 0" }}>
            <div className="empty-icon">🌱</div>
            <div className="empty-title">No plants yet</div>
            <div className="empty-sub">Add your first plant to get started.</div>
          </div>
        )}
        {plants.map(p => (
          <div key={p.id} className="manage-row">
            <div className="manage-thumb">
              {p.imageUrl ? <img src={p.imageUrl} alt=""/> : <span>{p.emoji||"🌿"}</span>}
            </div>
            <div className="manage-info">
              <div className="manage-name">{p.name}</div>
              <div className="manage-water">💧 {p.watering}</div>
            </div>
            <div className="manage-actions">
              <button className="icon-action-btn edit" onClick={() => onEdit(p)}>✏️</button>
              <button className="icon-action-btn del"  onClick={() => onDelete(p.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <button className="add-new-btn" onClick={onAdd}>＋ Add New Plant</button>
    </>
  );
}

/* ══ PLANT FORM ═══════════════════════════════════════════════════════════════ */
function PlantForm({ initial, onSave, onBack }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial || { name:"", latin:"", watering:"Weekly", light:"", humidity:"Medium", soil:"", notes:"", wateringDetail:"", emoji:"🌿" });
  const [loading, setLoading] = useState(false);
  const [aiNote, setAiNote] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generateAI = async () => {
    if (!form.name) return;
    setLoading(true); setAiNote(null);
    try {
      const data = await claudeJSON(
        `You are a plant care expert. For the plant "${form.name}", return ONLY JSON (no markdown) with: latin, watering (e.g. "Weekly"), light (e.g. "Bright indirect"), humidity, soil, notes (2–3 sentences), wateringDetail (1 sentence), emoji (single plant emoji).`
      );
      setForm(f => ({ ...f, ...data }));
      setAiNote(data.notes);
    } catch {
      setAiNote("Could not generate — please fill in manually.");
    }
    setLoading(false);
  };

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="overlay-title">{isEdit ? "Edit Plant" : "Add Plant"}</div>
      </div>
      <div className="overlay-body">
        <div className="form-body">
          <div className="form-group">
            <label className="form-label">Plant Name *</label>
            <input className="form-input" placeholder="e.g. Fiddle Leaf Fig" value={form.name} onChange={e => set("name", e.target.value)}/>
          </div>

          <button className="ai-generate-btn" onClick={generateAI} disabled={loading || !form.name}>
            {loading ? <><Dots/> Generating…</> : "✨ Auto-fill care info with AI"}
          </button>

          {aiNote && (
            <div className="ai-note">
              <strong>AI Suggestion Applied ✓</strong>
              {aiNote}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Latin Name</label>
            <input className="form-input" placeholder="e.g. Ficus lyrata" value={form.latin} onChange={e => set("latin", e.target.value)}/>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Watering</label>
              <select className="form-select" value={form.watering} onChange={e => set("watering", e.target.value)}>
                {["Daily","Twice weekly","Weekly","Bi-weekly","Monthly"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Light</label>
              <input className="form-input" placeholder="Bright indirect" value={form.light} onChange={e => set("light", e.target.value)}/>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Humidity</label>
              <select className="form-select" value={form.humidity} onChange={e => set("humidity", e.target.value)}>
                {["Low","Medium","High"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Soil Type</label>
              <input className="form-input" placeholder="Well-draining" value={form.soil} onChange={e => set("soil", e.target.value)}/>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Care Notes</label>
            <textarea className="form-textarea" placeholder="Watering tips, special needs, seasonal notes…" value={form.notes} onChange={e => set("notes", e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label">Watering Schedule Detail</label>
            <input className="form-input" placeholder="e.g. Every 7 days; reduce in winter" value={form.wateringDetail} onChange={e => set("wateringDetail", e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label">Emoji Icon</label>
            <input className="form-input" placeholder="🌿" value={form.emoji} maxLength={2} onChange={e => set("emoji", e.target.value)} style={{ fontSize:22, textAlign:"center" }}/>
          </div>

          <button className="save-plant-btn" onClick={() => onSave({ ...form, id: form.id || Date.now() })}>
            {isEdit ? "💾 Save Changes" : "🌱 Add to Collection"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ SHARE MODAL ══════════════════════════════════════════════════════════════ */
function ShareModal({ plant, onClose }) {
  const url = `${window.location.href.split("?")[0]}?plant=${plant.id}`;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="modal-title">Share Plant Passport</div>
        <p className="modal-desc">
          Anyone with this link can view <strong style={{color:"var(--sage-lt)"}}>{plant.name}</strong>'s care instructions — no account needed.
        </p>
        <div className="share-link-box">{url}</div>
        <button className="copy-link-btn" onClick={() => { navigator.clipboard.writeText(url); onClose(); }}>
          📋 Copy Link
        </button>
        <button className="modal-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  injectStyles();

  const [plants, setPlants] = usePlants();
  const [tab, setTab]         = useState("gallery"); // "gallery" | "manage"
  const [passport, setPassport] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [addMode,  setAddMode]  = useState(false);
  const [scan,     setScan]     = useState(false);
  const [share,    setShare]    = useState(null);
  const [toast,    setToast]    = useState(null);

  const showToast = useCallback((msg) => setToast(msg), []);

  const savePlant = (plant) => {
    setPlants(ps => {
      const exists = ps.find(p => p.id === plant.id);
      return exists ? ps.map(p => p.id === plant.id ? plant : p) : [...ps, plant];
    });
    setAddMode(false);
    setEditing(null);
    setScan(false);
    showToast(editing ? "Plant updated!" : "Plant added to collection!");
  };

  const deletePlant = (id) => {
    setPlants(ps => ps.filter(p => p.id !== id));
    showToast("Plant removed.");
  };

  const isBase = !passport && !addMode && !editing;

  return (
    <div className="app-shell">
      {/* ── MAIN CONTENT ── */}
      <div className="content-area">
        {tab === "gallery" && isBase && (
          <Gallery plants={plants} onSelect={setPassport} onAdd={() => setAddMode(true)}/>
        )}
        {tab === "manage" && isBase && (
          <Manage
            plants={plants}
            onDelete={deletePlant}
            onEdit={(p) => setEditing(p)}
            onAdd={() => setAddMode(true)}
          />
        )}
      </div>

      {/* ── BOTTOM NAV (only in base state) ── */}
      {isBase && !scan && (
        <nav className="bottom-nav">
          <button
            className={`nav-tab ${tab==="gallery"?"active":"inactive"}`}
            onClick={() => setTab("gallery")}
          >
            <span className="nav-tab-icon">🌿</span>
            <span className="nav-tab-label">Gallery</span>
          </button>

          {/* CENTER FAB — no label, floats above bar */}
          <div className="nav-center-wrap">
            <button
              className="scan-fab"
              onClick={() => setScan(true)}
              aria-label="Scan a plant"
            >
              {/* Camera SVG icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
          </div>

          <button
            className={`nav-tab ${tab==="manage"?"active":"inactive"}`}
            onClick={() => setTab("manage")}
          >
            <span className="nav-tab-icon">⚙️</span>
            <span className="nav-tab-label">Manage</span>
          </button>
        </nav>
      )}

      {/* ── OVERLAY SCREENS ── */}
      {passport && !share && (
        <Passport
          plant={passport}
          onBack={() => setPassport(null)}
          onShare={() => setShare(passport)}
        />
      )}

      {addMode && (
        <PlantForm onSave={savePlant} onBack={() => setAddMode(false)}/>
      )}

      {editing && (
        <PlantForm initial={editing} onSave={savePlant} onBack={() => setEditing(null)}/>
      )}

      {/* ── SCAN (full screen, above everything) ── */}
      {scan && (
        <ScanScreen
          onClose={() => setScan(false)}
          onSave={(p) => { savePlant(p); setScan(false); }}
        />
      )}

      {/* ── SHARE MODAL ── */}
      {share && (
        <ShareModal plant={share} onClose={() => setShare(null)}/>
      )}

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </div>
  );
}
