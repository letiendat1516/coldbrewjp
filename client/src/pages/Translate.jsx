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
      setResult(d.data?.data || d.data || d);
    } catch (e) {
      setResult({ error: "Lỗi kết nối" });
    }
    setLoading(false);
  };

  const results =
    result?.suggestWords ||
    result?.results ||
    result?.data ||
    (Array.isArray(result) ? result : []);

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        📖 Tra từ điển Nhật - Việt
      </h2>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
        Dữ liệu từ Mazii — nhập từ tiếng Nhật hoặc tiếng Việt
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
        <div>
          {result.error ? (
            <div className="alert alert-error">{result.error}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.slice(0, 30).map((item, i) => (
                <div
                  key={item._id || i}
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
                      alignItems: "baseline",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#e74c3c",
                      }}
                    >
                      {item.word}
                    </span>
                    {item.phonetic && (
                      <span style={{ fontSize: 14, color: "#999" }}>
                        {item.phonetic}
                      </span>
                    )}
                    {item.short_mean && (
                      <span
                        style={{
                          fontSize: 13,
                          color: "#666",
                          marginLeft: "auto",
                        }}
                      >
                        {item.short_mean}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                    {(item.means || []).map((m, j) => (
                      <div key={j} style={{ marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{m.mean}</span>
                        {m.kind && (
                          <span
                            style={{
                              color: "#999",
                              fontSize: 12,
                              marginLeft: 6,
                            }}
                          >
                            ({m.kind})
                          </span>
                        )}
                        {(m.examples || []).slice(0, 2).map((ex, k) => (
                          <div
                            key={k}
                            style={{
                              fontSize: 12,
                              color: "#999",
                              marginLeft: 8,
                            }}
                          >
                            • {ex}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div className="empty">
                  Không tìm thấy kết quả cho "{keyword}"
                </div>
              )}
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
        </a>
      </div>
    </div>
  );
}
