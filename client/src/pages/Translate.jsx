import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const MAZII_TOKEN = "a1dff8abeb4b03cc4ff96378ef8e01eb";

export default function Translate() {
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(sp.get("tab") || "dictionary");
  const [keyword, setKeyword] = useState("");
  const [dictResult, setDictResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transText, setTransText] = useState("");
  const [transResult, setTransResult] = useState("");
  const [sourceLang, setSourceLang] = useState("ja");
  const [targetLang, setTargetLang] = useState("vi");
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreview, setOcrPreview] = useState("");
  const [ocrResult, setOcrResult] = useState("");
  const [ocrTransResult, setOcrTransResult] = useState("");

  // Handwriting
  const [showHW, setShowHW] = useState(false);
  const [hwCandidates, setHwCandidates] = useState([]);
  const [hwStatus, setHwStatus] = useState("");
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const currentRef = useRef({ x: [], y: [], t: [] });
  const drawingRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const debounceRef = useRef(null);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokesRef.current = [];
    currentRef.current = { x: [], y: [], t: [] };
    startTimeRef.current = Date.now();
    setHwCandidates([]);
    setHwStatus("");
  }, []);

  useEffect(() => {
    if (showHW) setTimeout(initCanvas, 100);
  }, [showHW]);

  const getPos = (e) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width,
      scaleY = c.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };

  const hwStart = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const p = getPos(e);
    currentRef.current = {
      x: [p.x],
      y: [p.y],
      t: [Date.now() - startTimeRef.current],
    };
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  };
  const hwMove = (e) => {
    e.preventDefault();
    if (!drawingRef.current) return;
    const p = getPos(e);
    currentRef.current.x.push(p.x);
    currentRef.current.y.push(p.y);
    currentRef.current.t.push(Date.now() - startTimeRef.current);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };
  const hwEnd = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    strokesRef.current.push([
      currentRef.current.x,
      currentRef.current.y,
      currentRef.current.t,
    ]);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(recognizeHW, 500);
  };

  const clearHW = () => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    strokesRef.current = [];
    currentRef.current = { x: [], y: [], t: [] };
    clearTimeout(debounceRef.current);
    setHwCandidates([]);
    setHwStatus("");
  };

  const recognizeHW = async () => {
    if (strokesRef.current.length === 0) {
      setHwStatus("Vẽ chữ vào khung");
      return;
    }
    setHwStatus("Đang nhận diện...");
    try {
      const body = {
        apiLevel: "537.36",
        appVersion: 0.4,
        device: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        inputType: 0,
        options: "enable_pre_space",
        requests: [
          {
            maxCompletions: 0,
            maxNumResults: 10,
            preContext: "",
            writingGuide: { writingAreaHeight: 350, writingAreaWidth: 348 },
            ink: strokesRef.current,
          },
        ],
      };
      const r = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success && d.data?.length > 0) {
        setHwCandidates(d.data);
        setHwStatus("");
      } else {
        setHwStatus("Không nhận diện được");
        setHwCandidates([]);
      }
    } catch (e) {
      setHwStatus("Lỗi kết nối");
    }
  };

  const pickHW = (c) => {
    setKeyword(c);
    setShowHW(false);
  };

  const searchDict = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setDictResult(null);
    try {
      const r = await fetch("/api/mazii/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const d = await r.json();
      setDictResult(d.data);
    } catch (e) {
      setDictResult({ error: "Lỗi kết nối" });
    }
    setLoading(false);
  };
  const doTranslate = async (e) => {
    e.preventDefault();
    if (!transText.trim()) return;
    setLoading(true);
    setTransResult("");
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transText.trim(),
          sourceLang,
          targetLang,
        }),
      });
      const d = await r.json();
      setTransResult(d.data?.translatedText || d.translatedText || "Lỗi");
    } catch (e) {
      setTransResult("Lỗi kết nối");
    }
    setLoading(false);
  };
  const doOCR = async (e) => {
    e.preventDefault();
    if (!ocrFile) return;
    setLoading(true);
    setOcrResult("");
    setOcrTransResult("");
    try {
      const form = new FormData();
      form.append("image", ocrFile);
      const r = await fetch("https://ocr.mazii.net/ocr/overlay", {
        method: "POST",
        headers: { Authorization: MAZII_TOKEN },
        body: form,
      });
      const d = await r.json();
      const text = (d.text_blocks || []).map((b) => b.text).join("");
      setOcrResult(text);
      if (text) {
        const tr = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLang: "ja", targetLang: "vi" }),
        });
        const td = await tr.json();
        setOcrTransResult(td.data?.translatedText || "");
      }
    } catch (e) {
      setOcrResult("Lỗi OCR");
    }
    setLoading(false);
  };
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrFile(file);
    setOcrPreview(URL.createObjectURL(file));
    setTimeout(() => {
      document.querySelector("#ocrForm")?.requestSubmit();
    }, 200);
  };

  const words = dictResult?.words || [];
  const suggestions = dictResult?.suggestWords || [];

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
        🔤 Dịch
      </h2>
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          className={`tab ${tab === "dictionary" ? "active" : ""}`}
          onClick={() => setTab("dictionary")}
        >
          📖 Tra từ điển
        </button>
        <button
          className={`tab ${tab === "translate" ? "active" : ""}`}
          onClick={() => setTab("translate")}
        >
          🌐 Dịch văn bản
        </button>
        <button
          className={`tab ${tab === "ocr" ? "active" : ""}`}
          onClick={() => setTab("ocr")}
        >
          📷 Dịch ảnh
        </button>
      </div>

      {/* DICTIONARY */}
      {tab === "dictionary" && (
        <div>
          <form
            onSubmit={searchDict}
            style={{ display: "flex", gap: 8, marginBottom: 12 }}
          >
            <input
              className="form-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập từ cần tra..."
              style={{ flex: 1, fontSize: 16 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowHW(true)}
              className="btn btn-outline"
              style={{ padding: "12px 14px", fontSize: 18 }}
              title="Viết tay"
            >
              ✍️
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: "12px 28px", fontSize: 15 }}
            >
              🔍 Tra
            </button>
          </form>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {["猫", "勉強", "日本", "ありがとう"].map((w) => (
              <button
                key={w}
                onClick={() => setKeyword(w)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid #e8e8e8",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "Inter,sans-serif",
                  color: "#666",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          {loading && <div className="spinner" />}
          {dictResult &&
            (dictResult.error ? (
              <div className="alert alert-error">{dictResult.error}</div>
            ) : (
              <>
                {words.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#666",
                        marginBottom: 12,
                      }}
                    >
                      🎯 Kết quả chính xác ({words.length})
                    </div>
                    {words.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#fff",
                          borderRadius: 16,
                          padding: 20,
                          border: "1px solid #e8e8e8",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color: "#e74c3c",
                            }}
                          >
                            {item.word}
                          </span>
                          {(item.level || []).map((l) => (
                            <span
                              key={l}
                              style={{
                                background: "#e8f5e9",
                                color: "#2e7d32",
                                padding: "3px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                        {item.phonetic && (
                          <div
                            style={{
                              fontSize: 16,
                              color: "#666",
                              marginBottom: 4,
                            }}
                          >
                            {item.phonetic}
                          </div>
                        )}
                        {(item.means || []).map((m, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 15,
                              color: "#333",
                              marginTop: 6,
                            }}
                          >
                            → {m.mean}{" "}
                            {m.kind && (
                              <span style={{ color: "#999", fontSize: 12 }}>
                                ({m.kind})
                              </span>
                            )}
                          </div>
                        ))}
                        {(item.synsets || []).map((syn, j) => (
                          <div
                            key={j}
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                              marginTop: 12,
                            }}
                          >
                            {(syn.entry || [])
                              .flatMap((e) => e.synonym || [])
                              .map((w, k) => (
                                <button
                                  key={k}
                                  onClick={() => setKeyword(w)}
                                  style={{
                                    padding: "4px 12px",
                                    borderRadius: 16,
                                    border: "1px solid #e0e0e0",
                                    background: "#fafafa",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    color: "#e74c3c",
                                    fontFamily: "Inter,sans-serif",
                                  }}
                                >
                                  {w}
                                </button>
                              ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#999",
                        marginBottom: 12,
                      }}
                    >
                      💡 Gợi ý ({suggestions.length})
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {suggestions.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 12,
                            padding: "10px 16px",
                            background: "#fff",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <button
                            onClick={() => setKeyword(item.word)}
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#e74c3c",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "Inter,sans-serif",
                            }}
                          >
                            {item.word}
                          </button>
                          {item.phonetic && (
                            <span style={{ fontSize: 12, color: "#999" }}>
                              {item.phonetic}
                            </span>
                          )}
                          <span
                            style={{ fontSize: 13, color: "#666", flex: 1 }}
                          >
                            {item.short_mean}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {words.length === 0 && suggestions.length === 0 && (
                  <div className="empty">
                    Không tìm thấy kết quả cho "{keyword}"
                  </div>
                )}
              </>
            ))}
        </div>
      )}

      {/* TRANSLATE */}
      {tab === "translate" && (
        <div>
          <form onSubmit={doTranslate}>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <select
                className="form-input"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                style={{ width: 100 }}
              >
                <option value="ja">Nhật</option>
                <option value="vi">Việt</option>
                <option value="en">Anh</option>
                <option value="ko">Hàn</option>
                <option value="zh">Trung</option>
              </select>
              <span style={{ color: "#999" }}>→</span>
              <select
                className="form-input"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                style={{ width: 100 }}
              >
                <option value="vi">Việt</option>
                <option value="ja">Nhật</option>
                <option value="en">Anh</option>
                <option value="ko">Hàn</option>
              </select>
            </div>
            <textarea
              className="form-input"
              value={transText}
              onChange={(e) => setTransText(e.target.value)}
              placeholder="Nhập văn bản cần dịch..."
              rows={5}
              style={{
                fontFamily: "Inter,sans-serif",
                fontSize: 16,
                resize: "vertical",
                width: "100%",
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: "12px 28px", fontSize: 15 }}
            >
              🌐 Dịch
            </button>
          </form>
          {loading && <div className="spinner" />}
          {transResult && (
            <div
              style={{
                marginTop: 16,
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #e8e8e8",
              }}
            >
              <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                Kết quả:
              </div>
              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {transResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* OCR */}
      {tab === "ocr" && (
        <div>
          <form id="ocrForm" onSubmit={doOCR}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  padding: "40px 20px",
                  border: "2px dashed #e8e8e8",
                  borderRadius: 12,
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
                {ocrPreview ? (
                  <img
                    src={ocrPreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <div style={{ color: "#999" }}>
                    📷 Bấm để chọn ảnh cần dịch
                  </div>
                )}
              </label>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !ocrFile}
              style={{ padding: "12px 28px", fontSize: 15 }}
            >
              📷 Nhận diện & Dịch
            </button>
          </form>
          {loading && <div className="spinner" />}
          {ocrResult && (
            <div
              style={{
                marginTop: 16,
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #e8e8e8",
              }}
            >
              <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                Văn bản nhận diện:
              </div>
              <div style={{ fontSize: 18, marginBottom: 12 }}>{ocrResult}</div>
              {ocrTransResult && (
                <>
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                    Dịch:
                  </div>
                  <div
                    style={{ fontSize: 16, color: "#3bc4a8", lineHeight: 1.6 }}
                  >
                    {ocrTransResult}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* HANDWRITING MODAL */}
      {showHW && (
        <div className="modal-overlay" onClick={() => setShowHW(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h3>✍️ Viết tay</h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>
              Vẽ chữ Kanji/Hiragana vào khung
            </p>
            <canvas
              ref={canvasRef}
              width={348}
              height={350}
              onMouseDown={hwStart}
              onMouseMove={hwMove}
              onMouseUp={hwEnd}
              onMouseLeave={hwEnd}
              onTouchStart={hwStart}
              onTouchMove={hwMove}
              onTouchEnd={hwEnd}
              style={{
                width: "100%",
                height: 350,
                border: "1px solid #e8e8e8",
                borderRadius: 12,
                cursor: "crosshair",
                touchAction: "none",
                background: "#fff",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={recognizeHW}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                🔍 Nhận dạng
              </button>
              <button
                onClick={clearHW}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Xóa
              </button>
            </div>
            {hwStatus && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#999",
                  textAlign: "center",
                }}
              >
                {hwStatus}
              </div>
            )}
            {hwCandidates.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                  Kết quả — bấm để tra:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {hwCandidates.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => pickHW(c)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #45e3c6",
                        background: i === 0 ? "rgba(69,227,198,0.15)" : "#fff",
                        cursor: "pointer",
                        fontSize: 18,
                        fontFamily: "Inter,sans-serif",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
