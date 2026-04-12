import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "../context/PlantContext";
import { claudeVision } from "../services/ai";

export default function ScanScreen() {
  const navigate = useNavigate();
  const { savePlant, showToast } = usePlants();

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
      }
    } else {
      fileRef.current?.click();
    }
  };

  /* file picker */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedUrl(URL.createObjectURL(file));
    setUploadType(file.type || "image/jpeg");
    setResult(null);
    setCapturedUrl(null);
    const fr = new FileReader();
    fr.onload = (ev) => setUploadB64(ev.target.result.split(",")[1]);
    fr.readAsDataURL(file);
    if (videoRef.current) videoRef.current.pause();
  };

  /* identify via Claude Vision */
  const identifyImage = async () => {
    setLoading(true);
    let b64 = uploadB64;
    let mtype = uploadType;
    if (capturedUrl && !uploadB64) {
      b64 = capturedUrl.split(",")[1];
      mtype = "image/jpeg";
    }
    if (!b64) { setLoading(false); return; }
    try {
      const data = await claudeVision(b64, mtype);
      setResult({ ...data, imageUrl: previewUrl });
    } catch {
      setResult({
        name: "Unknown Plant",
        latin: "",
        watering: "Weekly",
        light: "Indirect",
        humidity: "Medium",
        soil: "Standard potting",
        notes: "Could not identify — standard tropical houseplant care applied.",
        wateringDetail: "Water when top inch of soil is dry.",
        emoji: "🌿",
        imageUrl: previewUrl,
      });
    }
    setLoading(false);
  };

  /* discard & resume */
  const handleDiscard = () => {
    setResult(null);
    setCapturedUrl(null);
    setUploadedUrl(null);
    setUploadB64(null);
    if (videoRef.current && hasCamera) videoRef.current.play();
  };

  /* save */
  const handleSave = () => {
    const plant = { ...result, id: Date.now() };
    savePlant(plant);
    showToast("Plant added to collection!");
    navigate("/");
  };

  /* flip */
  const handleFlip = () => {
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

        {/* FLOATING RECOGNITION CARD */}
        {result && (
          <div className="recog-card" onClick={handleSave}>
            <div className="recog-thumb">
              {result.imageUrl ? <img src={result.imageUrl} alt="" /> : <span>{result.emoji || "🌿"}</span>}
            </div>
            <div className="recog-text">
              <div className="recog-label">Recognized plant</div>
              <div className="recog-name">{result.name}</div>
              {result.latin && <div className="recog-latin">{result.latin}</div>}
            </div>
            <button className="recog-add-btn" onClick={(e) => { e.stopPropagation(); handleSave(); }} aria-label="Add plant">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

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

          <button className="cam-flip-btn" onClick={handleFlip} aria-label="Flip camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      }

      <input ref={fileRef} type="file" accept="image/*" className="hidden-file" onChange={handleFileSelect} />
    </div>
  );
}
