import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Translate() {
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(sp.get("tab") || "dictionary");

  // Dictionary
  const [keyword, setKeyword] = useState("");
  const [dictResult, setDictResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Translate
  const [transText, setTransText] = useState("");
  const [transResult, setTransResult] = useState("");
  const [sourceLang, setSourceLang] = useState("ja");
  const [targetLang, setTargetLang] = useState("vi");

  // OCR
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrPreview, setOcrPreview] = useState("");
  const [ocrResult, setOcrResult] = useState("");
  const [ocrTransResult, setOcrTransResult] = useState("");

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
      const r = await fetch("/api/ocr", {
        method: "POST",
        body: form,
      });
      const d = await r.json();
      const text = d.data?.text || d.text || "";
      setOcrResult(text);
      // Auto translate OCR result
      if (text && typeof text === "string") {
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
      setTimeout(() => { if (ocrFile) document.querySelector('#ocrForm')?.requestSubmit(); }, 100);
    if (file) {
      setOcrFile(file);
      setOcrPreview(URL.createObjectURL(file));
    }
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
                onClick={() => {
                  setKeyword(w);
                }}
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
                                  onClick={() => {
                                    setKeyword(w);
                                  }}
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
                            onClick={() => {
                              setKeyword(item.word);
                            }}
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
    </div>
  );
}
