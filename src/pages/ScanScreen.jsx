import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { supabase } from "../lib/supabase";
import { normalizeAIResponse } from "../utils/plantHelpers";
import { uploadPlantImageBase64, createMemoriesFolder } from "../services/plantStorage";
import { PiMagicWand } from "react-icons/pi";

const UNKNOWN_PLANT = {
  name: "Unknown Plant",
  latin: "",
  watering: "Weekly",
  light: "Indirect",
  humidity: "Medium",
  soil: "Standard potting",
  notes: "Could not identify — standard tropical houseplant care applied.",
  wateringDetail: "Water when top inch of soil is dry.",
  emoji: "🌿",
};

export default function ScanScreen() {
  const navigate = useNavigate();
  const { savePlant, showToast, loadPlants } = usePlants();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadB64, setUploadB64] = useState(null);
  const [uploadType, setUploadType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [exiting, setExiting] = useState(false);

  // Restore scan state when returning from edit page
  useEffect(() => {
    const saved = sessionStorage.getItem("scan-state");
    if (saved) {
      sessionStorage.removeItem("scan-state");
      try {
        const s = JSON.parse(saved);
        if (s.result) setResult(s.result);
        if (s.capturedUrl) setCapturedUrl(s.capturedUrl);
        if (s.uploadedUrl) setUploadedUrl(s.uploadedUrl);
        if (s.uploadB64) setUploadB64(s.uploadB64);
        if (s.uploadType) setUploadType(s.uploadType);
      } catch {}
    }
  }, []);

  const previewUrl = capturedUrl || uploadedUrl;

  /* start camera */
  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  /* animated close */
  const handleClose = () => {
    setExiting(true);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setTimeout(() => navigate(-1), 290);
  };

  /* capture frame from live video */
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !hasCamera) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  /* main capture button handler */
  const handleCapture = () => {
    if (result) { handleDiscard(); return; }
    if (previewUrl) { identifyImage(); return; }
    if (hasCamera) {
      const dataUrl = captureFrame();
      if (dataUrl) {
        setCapturedUrl(dataUrl);
        if (videoRef.current) videoRef.current.pause();
        // Auto-start recognition after capture
        setTimeout(() => identifyImageWith(dataUrl), 50);
      }
    } else {
      fileRef.current?.click();
    }
  };

  /* file picker */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUploadedUrl(objectUrl);
    setUploadType(file.type || "image/jpeg");
    setResult(null);
    setCapturedUrl(null);
    const fr = new FileReader();
    fr.onload = (ev) => {
      const dataUrl = ev.target.result;
      const b64 = dataUrl.split(",")[1];
      setUploadB64(b64);
      // Auto-start recognition with the dataUrl so it doesn't depend on state
      setTimeout(() => identifyImageWith(dataUrl), 50);
    };
    fr.readAsDataURL(file);
    if (videoRef.current) videoRef.current.pause();
  };

  /* identify via server-side AI — accepts optional dataUrl for freshly captured frames */
  const identifyImageWith = async (dataUrl) => {
    if (loading) return; // prevent double-trigger
    setLoading(true);
    let b64 = uploadB64;
    let mtype = uploadType;
    const imgUrl = dataUrl || previewUrl;
    if (!uploadB64) {
      const src = dataUrl || capturedUrl;
      if (src) {
        b64 = src.split(",")[1];
        mtype = "image/jpeg";
      }
    }
    if (!b64) { setLoading(false); return; }
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, mimeType: mtype }),
      });
      const data = await res.json();
      if (!res.ok || data.recognized === false) {
        setResult({ ...UNKNOWN_PLANT, imageUrl: imgUrl });
      } else {
        setResult({ ...normalizeAIResponse(data), imageUrl: imgUrl });
      }
    } catch {
      setResult({ ...UNKNOWN_PLANT, imageUrl: imgUrl });
    }
    setLoading(false);
  };

  const identifyImage = () => identifyImageWith(null);

  /* discard & resume */
  const handleDiscard = () => {
    setResult(null);
    setCapturedUrl(null);
    setUploadedUrl(null);
    setUploadB64(null);
    if (videoRef.current && hasCamera) videoRef.current.play();
  };

  /* save — proceed with recognized result, persist to Supabase */
  const handleSave = async () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

    const parseDays = (val) => {
      if (!val) return 7;
      const m = String(val).match(/(\d+)/);
      return m ? Math.max(1, Math.min(15, parseInt(m[1], 10))) : 7;
    };

    const wateringDays = parseDays(result?.watering);
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + wateringDays);

    // Insert plant first to get the ID
    const plantName = (result?.name || "Unknown Plant").trim();

    const payload = {
      name: plantName,
      latin_name: result?.latin?.trim() || null,
      watering_frequency_days: wateringDays,
      watering_label: `Every ${wateringDays} day/s`,
      watering_schedule_detail: result?.wateringDetail?.trim() || null,
      light: result?.light?.trim() || null,
      humidity: result?.humidity || "Medium",
      soil: result?.soil?.trim() || null,
      care_notes: result?.notes?.trim() || null,
      image_url: null,
      thumbnail_url: null,
      last_watered_at: null,
      next_watering_at: next.toISOString(),
    };

    const { data: insertData, error } = await supabase.from("plants").insert([payload]).select();
    if (error) {
      console.error("Save error:", error.message, error.details, error.hint, error.code);
      showToast("Could not save plant.");
      return;
    }
    const newPlant = insertData[0];

    // Upload image using the plant ID for unique folder
    const b64 = uploadB64 || (capturedUrl ? capturedUrl.split(",")[1] : null);
    let imageUrl = null;
    if (b64) {
      const uploaded = await uploadPlantImageBase64(b64, uploadType || "image/jpeg", plantName, newPlant.id);
      imageUrl = uploaded?.publicUrl || null;
    }

    // Update plant with image URL
    if (imageUrl) {
      await supabase.from("plants").update({ image_url: imageUrl, thumbnail_url: imageUrl }).eq("id", newPlant.id);
    }

    // Create memories folder for this plant
    createMemoriesFolder(plantName, newPlant.id);

    showToast("Plant added to collection!");
    loadPlants();
    navigate("/");
  };

  /* edit — open PlantForm prefilled with scan data */
  const handleEdit = async () => {
    // Save scan state before navigating so it restores on back
    sessionStorage.setItem("scan-state", JSON.stringify({
      result,
      capturedUrl,
      uploadedUrl,
      uploadB64,
      uploadType,
    }));
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    navigate("/add", {
      state: {
        scanData: {
          name: result?.name || "",
          latin: result?.latin || "",
          watering: result?.watering || "Every 7 day/s",
          light: result?.light || "",
          humidity: result?.humidity || "Medium",
          soil: result?.soil || "",
          notes: result?.notes || "",
          wateringDetail: result?.wateringDetail || "",
          emoji: result?.emoji || "🌿",
          imageUrl: result?.imageUrl || "",
        },
        fromScan: true,
      },
    });
  };

  /* flip / retry recognition */
  const handleFlip = () => {
    if (result) {
      // Keep image, clear result and re-run recognition immediately
      setResult(null);
      setTimeout(() => identifyImage(), 50);
      return;
    }
    setCapturedUrl(null);
    setResult(null);
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
  };

  const isIdentifyMode = !!previewUrl && !result;

  return (
    <div className={`scan-screen ${exiting ? "exiting" : "entering"}`}>
      {/* TOP BAR */}
      <div className="scan-topbar">
        <div className="scan-title">
          {result ? "Result" : previewUrl ? "Identify Plant" : "Scan Plant"}
        </div>
        <button className="scan-close" onClick={handleClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ width: 18, height: 18 }}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* VIEWFINDER */}
      <div className="scan-viewfinder">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: previewUrl ? "none" : "block" }}
        />

        {previewUrl && (
          <img className="preview-img" src={previewUrl} alt="Plant" />
        )}

        {!hasCamera && !previewUrl && (
          <div className="cam-placeholder">
            <div className="cam-placeholder-icon">📷</div>
            <div className="cam-placeholder-text">
              Camera not available.
              <br />
              Use the gallery button to upload a photo.
            </div>
          </div>
        )}

        {!previewUrl && (
          <div className="scan-frame">
            <div className="scan-frame-corner sfc-tl" />
            <div className="scan-frame-corner sfc-tr" />
            <div className="scan-frame-corner sfc-bl" />
            <div className="scan-frame-corner sfc-br" />
            <div className="scan-line" />
          </div>
        )}

      </div>

      {/* FLOATING RECOGNITION CARD — sits above bottom controls */}
      {result && (
        <div className="recog-card">
          <div className="recog-thumb">
            {result.imageUrl ? <img src={result.imageUrl} alt="" /> : <span>{result.emoji || "🌿"}</span>}
          </div>
          <div className="recog-text">
            <div className="recog-label">Recognized plant</div>
            <div className="recog-name">{result.name || "Unknown Plant"}</div>
            {result.latin && <div className="recog-latin">{result.latin}</div>}
          </div>
          <button className="recog-edit-btn" onClick={handleEdit} aria-label="Edit plant">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="recog-add-btn" onClick={handleSave} aria-label="Add plant">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {/* BOTTOM CONTROLS */}
      {
        <div className="scan-controls">
          <button className="cam-gallery-btn" onClick={() => fileRef.current?.click()} aria-label="Open gallery">
            {uploadedUrl ? (
              <img className="cam-gallery-thumb" src={uploadedUrl} alt="" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            )}
          </button>

          <div className="cam-capture-ring" onClick={handleCapture} role="button" aria-label={isIdentifyMode ? "Identify" : "Capture"}>
            <div className={`cam-capture-inner ${isIdentifyMode ? "identify-mode" : ""}`}>
              {loading ? (
                <div className="cam-spinner" />
              ) : isIdentifyMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26, color: "#fff" }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ) : null}
            </div>
          </div>

          <button className="cam-flip-btn" onClick={handleFlip} aria-label="Re-identify">
            <PiMagicWand size={22} />
          </button>
        </div>
      }

      <input ref={fileRef} type="file" accept="image/*" className="hidden-file" onChange={handleFileSelect} />
    </div>
  );
}
