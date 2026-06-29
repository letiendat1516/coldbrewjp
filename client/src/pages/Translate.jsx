import { useState } from "react";

export default function Translate() {
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/mazii/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const d = await r.json();
      setResult(d.data);
    } catch (e) {
      setResult({ error: "Lỗi kết nối" });
    }
    setLoading(false);
  };

  const maziiWords = result?.mazii?.suggestWords || result?.mazii?.data || [];
  const jishoWords = result?.jisho || [];
  const jishoMap = result?.jishoMap || {};

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        📖 Tra từ điển Nhật - Việt
      </h2>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
        Dữ liệu từ Mazii (Việt) + Jisho (JLPT, romaji)
      </p>

      <form
        onSubmit={search}
        style={{ display: "flex", gap: 8, marginBottom: 24 }}
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
          Tra
        </button>
      </form>

      {loading && <div className="spinner" />}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jishoWords.slice(0, 5).map((item, i) => {
            const jp = item.japanese?.[0] || {};
            const maziiMatch = maziiWords.find(
              (m) => m.word === (jp.word || jp.reading),
            );
            return (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 18,
                  border: "1px solid #e8e8e8",
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
                    style={{ fontSize: 22, fontWeight: 700, color: "#e74c3c" }}
                  >
                    {jp.word || item.slug}
                  </span>
                  {jp.reading && (
                    <span style={{ fontSize: 15, color: "#999" }}>
                      {jp.reading}
                    </span>
                  )}
                  {(item.jlpt || []).map((l) => (
                    <span
                      key={l}
                      style={{
                        background: "#e8f5e9",
                        color: "#2e7d32",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {l.toUpperCase().replace("JLPT-", "N")}
                    </span>
                  ))}
                  {item.is_common && (
                    <span
                      style={{
                        background: "#fff3e0",
                        color: "#e65100",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Common
                    </span>
                  )}
                </div>
                {maziiMatch && (
                  <div
                    style={{
                      fontSize: 14,
                      color: "#555",
                      marginBottom: 8,
                      lineHeight: 1.6,
                    }}
                  >
                    {(maziiMatch.means || []).map((m, j) => (
                      <div key={j}>
                        • {m.mean}{" "}
                        {m.kind && (
                          <span style={{ color: "#999", fontSize: 12 }}>
                            ({m.kind})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                  {(item.senses || []).slice(0, 3).map((s, j) => (
                    <div key={j}>
                      {s.english_definitions?.join(", ")}
                      {s.parts_of_speech?.length > 0 && (
                        <span style={{ color: "#aaa", marginLeft: 8 }}>
                          ({s.parts_of_speech.join(", ")})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {jishoWords.length === 0 && maziiWords.length === 0 && (
            <div className="empty">Không tìm thấy kết quả cho "{keyword}"</div>
          )}
          {jishoWords.length === 0 && maziiWords.length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>
                Kết quả từ Mazii:
              </div>
              {maziiWords.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 14,
                    border: "1px solid #e8e8e8",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700 }}>
                    {item.word}
                  </span>
                  {item.phonetic && (
                    <span
                      style={{ fontSize: 13, color: "#999", marginLeft: 10 }}
                    >
                      {item.phonetic}
                    </span>
                  )}
                  <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                    {(item.means || []).map((m, j) => (
                      <div key={j}>• {m.mean}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 40,
          padding: 16,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8e8e8",
          fontSize: 13,
          color: "#999",
        }}
      >
        ⚡ Dữ liệu từ{" "}
        <a
          href="https://mazii.net"
          target="_blank"
          style={{ color: "#45e3c6" }}
        >
          Mazii.net
        </a>{" "}
        +{" "}
        <a
          href="https://jisho.org"
          target="_blank"
          style={{ color: "#45e3c6" }}
        >
          Jisho.org
        </a>
      </div>
    </div>
  );
}
