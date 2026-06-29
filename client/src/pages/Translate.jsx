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

  const words = result?.words || [];
  const suggestions = result?.suggestWords || [];
  const romajiMap = {
    a: "a",
    i: "i",
    u: "u",
    e: "e",
    o: "o",
    ka: "ka",
    ki: "ki",
    ku: "ku",
    ke: "ke",
    ko: "ko",
    sa: "sa",
    shi: "shi",
    su: "su",
    se: "se",
    so: "so",
    ta: "ta",
    chi: "chi",
    tsu: "tsu",
    te: "te",
    to: "to",
    na: "na",
    ni: "ni",
    nu: "nu",
    ne: "ne",
    no: "no",
    ha: "ha",
    hi: "hi",
    fu: "fu",
    he: "he",
    ho: "ho",
    ma: "ma",
    mi: "mi",
    mu: "mu",
    me: "me",
    mo: "mo",
    ya: "ya",
    yu: "yu",
    yo: "yo",
    ra: "ra",
    ri: "ri",
    ru: "ru",
    re: "re",
    ro: "ro",
    wa: "wa",
    wo: "wo",
    n: "n",
    ga: "ga",
    gi: "gi",
    gu: "gu",
    ge: "ge",
    go: "go",
    za: "za",
    ji: "ji",
    zu: "zu",
    ze: "ze",
    zo: "zo",
    da: "da",
    ji2: "ji",
    zu2: "zu",
    de: "de",
    do: "do",
    ba: "ba",
    bi: "bi",
    bu: "bu",
    be: "be",
    bo: "bo",
    pa: "pa",
    pi: "pi",
    pu: "pu",
    pe: "pe",
    po: "po",
  };

  const toRomaji = (kana) => {
    if (!kana) return "";
    // rough romaji conversion
    return kana;
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        📖 Tra từ điển Nhật - Việt
      </h2>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24 }}>
        Dữ liệu từ Mazii.net
      </p>

      <form
        onSubmit={search}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
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
          🔍 Tra cứu
        </button>
      </form>

      {/* Popular words */}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}
      >
        {["猫", "勉強", "日本", "ありがとう", "シューシュー"].map((w) => (
          <button
            key={w}
            onClick={() => {
              setKeyword(w);
              document.querySelector("form").requestSubmit();
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

      {result && (
        <div>
          {result.error ? (
            <div className="alert alert-error">{result.error}</div>
          ) : (
            <>
              {/* Exact matches */}
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
                          <span>{item.phonetic}</span>
                          {item.phonetic && (
                            <span
                              style={{
                                color: "#999",
                                marginLeft: 12,
                                fontSize: 14,
                              }}
                            >
                              {toRomaji(item.phonetic)}
                            </span>
                          )}
                        </div>
                      )}
                      {(item.means || []).map((m, j) => (
                        <div
                          key={j}
                          style={{
                            fontSize: 15,
                            color: "#333",
                            marginTop: 6,
                            display: "flex",
                            alignItems: "baseline",
                            gap: 6,
                          }}
                        >
                          <span>→</span>
                          <span>{m.mean}</span>
                          {m.kind && (
                            <span style={{ color: "#999", fontSize: 12 }}>
                              ({m.kind})
                            </span>
                          )}
                        </div>
                      ))}
                      {/* Related words (synsets) */}
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
                                  document
                                    .querySelector("form")
                                    .requestSubmit();
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

              {/* Suggestions */}
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
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
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
                            document.querySelector("form").requestSubmit();
                          }}
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#e74c3c",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "Inter,sans-serif",
                            textAlign: "left",
                          }}
                        >
                          {item.word}
                        </button>
                        {item.phonetic && (
                          <span style={{ fontSize: 12, color: "#999" }}>
                            {item.phonetic}
                          </span>
                        )}
                        <span style={{ fontSize: 13, color: "#666", flex: 1 }}>
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
