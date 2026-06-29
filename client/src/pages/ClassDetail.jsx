import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { classes, ranking } from "../api";
import { esc, randColor, timeAgo, showToast } from "../utils";

const API = "/api";

const QUICK_EMOJIS = [
  { emoji: "🌟", point: 5, label: "Xuất sắc" },
  { emoji: "⭐", point: 3, label: "Tốt" },
  { emoji: "👍", point: 1, label: "Được" },
  { emoji: "💪", point: 2, label: "Cố gắng" },
  { emoji: "👏", point: 2, label: "Hay" },
  { emoji: "🎯", point: 4, label: "Chính xác" },
  { emoji: "🔥", point: 3, label: "Đỉnh" },
  { emoji: "❤️", point: 1, label: "Tốt" },
  { emoji: "👎", point: -1, label: "Chưa tốt" },
  { emoji: "⚠️", point: -2, label: "Nhắc nhở" },
  { emoji: "😴", point: -1, label: "Buồn ngủ" },
  { emoji: "📝", point: -2, label: "Thiếu bài" },
  { emoji: "⏰", point: -1, label: "Đi muộn" },
  { emoji: "🚫", point: -3, label: "Vi phạm" },
  { emoji: "💤", point: -1, label: "Lơ là" },
];

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [rankData, setRankData] = useState(null);
  const [tab, setTab] = useState("ranking");
  const [sel, setSel] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [customPoint, setCustomPoint] = useState("");
  const [giving, setGiving] = useState(false);
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    if (!user) navigate("/login");
    else load();
  }, [id]);

  const load = async () => {
    try {
      const [c, r] = await Promise.all([classes.get(id), ranking.get(id)]);
      setClassData(c.data);
      setRankData(r.data);
    } catch (e) {
      setClassData(null);
    }
  };

  const loadActivity = async () => {
    setLoadingAct(true);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(API + "/rewards/class/" + id + "?limit=30", {
        headers: { Authorization: "Bearer " + t },
      });
      const d = await r.json();
      setActivity(d.data?.logs || []);
    } catch (e) {
      setActivity([]);
    }
    setLoadingAct(false);
  };
  useEffect(() => {
    if (tab === "activity") loadActivity();
  }, [tab]);
  const switchTab = (t) => {
    setTab(t);
    if (t !== "reward") setSel(null);
  };

  const giveEmoji = async (emoji, point) => {
    if (!sel) {
      showToast("Chọn học sinh trước", "error");
      return;
    }
    setGiving(true);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(API + "/rewards/simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + t,
        },
        body: JSON.stringify({
          classId: id,
          studentId: sel.id.toString(),
          point,
          note: emoji,
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`${emoji} → ${sel.fullName}`);
        load();
      } else showToast(d.message || "Lỗi", "error");
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    }
    setGiving(false);
  };

  const giveCustom = async (e) => {
    e.preventDefault();
    const p = parseInt(customPoint);
    if (!p || p === 0) return;
    if (!sel) {
      showToast("Chọn học sinh trước", "error");
      return;
    }
    setGiving(true);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(API + "/rewards/simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + t,
        },
        body: JSON.stringify({
          classId: id,
          studentId: sel.id.toString(),
          point: p,
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`${p > 0 ? "+" : ""}${p} → ${sel.fullName}`);
        load();
        setCustomPoint("");
      } else showToast(d.message || "Lỗi", "error");
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    }
    setGiving(false);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(API + "/classes/" + id + "/import-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + t,
        },
        body: JSON.stringify({ text: importText }),
      });
      const d = await r.json();
      if (d.success) {
        setImportResult(d.data);
        load();
      } else showToast(d.message || "Lỗi", "error");
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    }
    setImporting(false);
  };

  if (!classData) return <div className="spinner" />;
  const ranking2 = rankData?.ranking || [];
  const summary = rankData?.summary || {};
  const rankMap = {};
  ranking2.forEach((r) => {
    rankMap[r.student.id] = r;
  });

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Link to="/dashboard" style={{ fontSize: 20, color: "#999" }}>
          ←
        </Link>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          {esc(classData.className)}
        </h2>
        <span className="badge badge-green">Mã: {classData.joinCode}</span>
      </div>
      <div className="info-bar">
        <span>
          👨‍🏫 <strong>{esc(classData.teacher?.fullName || "—")}</strong>
        </span>
        <span>
          👥 <strong>{classData.members?.length || 0} học sinh</strong>
        </span>
        {isTeacher && (
          <button
            className="btn btn-outline"
            style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 13 }}
            onClick={() => {
              setShowImport(true);
              setImportResult(null);
              setImportText("");
            }}
          >
            📥 Import học sinh
          </button>
        )}
      </div>
      <div className="tabs">
        <button
          className={`tab ${tab === "ranking" ? "active" : ""}`}
          onClick={() => switchTab("ranking")}
        >
          🏆 Bảng xếp hạng
        </button>
        {isTeacher && (
          <button
            className={`tab ${tab === "reward" ? "active" : ""}`}
            onClick={() => switchTab("reward")}
          >
            ⭐ Thưởng / Phạt
          </button>
        )}
        <button
          className={`tab ${tab === "activity" ? "active" : ""}`}
          onClick={() => switchTab("activity")}
        >
          📋 Hoạt động
        </button>
        <button
          className={`tab ${tab === "members" ? "active" : ""}`}
          onClick={() => switchTab("members")}
        >
          👥 Thành viên
        </button>
      </div>

      {tab === "ranking" && (
        <div>
          <div
            className="stats-row"
            style={{ gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div className="stat-card">
              <div className="label">Tổng thưởng</div>
              <div className="value text-green">
                +{summary.totalRewardsGiven || 0}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Tổng phạt</div>
              <div className="value text-red">
                -{summary.totalPenaltiesGiven || 0}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Lượt thao tác</div>
              <div className="value">{summary.totalActions || 0}</div>
            </div>
          </div>
          {ranking2.length === 0 ? (
            <div className="empty">Chưa có dữ liệu</div>
          ) : (
            <div className="rank-list">
              {ranking2.map((r) => (
                <div key={r.student.id} className="rank-item">
                  <div
                    className="rank-num"
                    style={
                      r.rank <= 3
                        ? {
                            background: ["#FFD700", "#C0C0C0", "#CD7F32"][
                              r.rank - 1
                            ],
                            color: "#fff",
                          }
                        : {}
                    }
                  >
                    {["", "🥇", "🥈", "🥉"][r.rank] || r.rank}
                  </div>
                  <div
                    className="rank-avatar"
                    style={{ background: randColor(r.student.id) }}
                  >
                    {r.student.fullName.charAt(0)}
                  </div>
                  <div className="rank-name">{esc(r.student.fullName)}</div>
                  <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
                    <span className="text-green" style={{ fontWeight: 700 }}>
                      +{r.totalReward}
                    </span>
                    <span className="text-red" style={{ fontWeight: 700 }}>
                      -{r.totalPenalty}
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        minWidth: 50,
                        textAlign: "right",
                        color: r.netPoints >= 0 ? "#3bc4a8" : "#f5576c",
                      }}
                    >
                      {r.netPoints >= 0 ? "+" : ""}
                      {r.netPoints}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reward" && (
        <div>
          {sel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #45e3c6",
                marginBottom: 20,
              }}
            >
              <div
                className="rank-avatar"
                style={{
                  background: randColor(sel.id),
                  width: 44,
                  height: 44,
                  fontSize: 16,
                }}
              >
                {sel.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 16 }}>{esc(sel.fullName)}</strong>
              </div>
              <button
                onClick={() => setSel(null)}
                style={{
                  color: "#999",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {!sel && (
            <p style={{ color: "#666", marginBottom: 16 }}>
              👆 Chọn học sinh bên dưới, sau đó bấm emoji để thưởng/phạt.
            </p>
          )}

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 12,
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Chọn học sinh
          </div>
          <div
            className="member-list"
            style={{ marginBottom: 24, maxHeight: 200, overflowY: "auto" }}
          >
            {classData.members?.map((m) => (
              <div
                key={m.student.id}
                className={`member-item ${sel?.id === m.student.id ? "selected" : ""}`}
                onClick={() => setSel(m.student)}
              >
                <div
                  className="rank-avatar"
                  style={{
                    background: randColor(m.student.id),
                    width: 40,
                    height: 40,
                    fontSize: 14,
                  }}
                >
                  {m.student.fullName.charAt(0)}
                </div>
                <div className="member-info">
                  <div className="member-name">{esc(m.student.fullName)}</div>
                </div>
              </div>
            ))}
          </div>

          {sel && (
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e8e8e8",
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: "#666",
                }}
              >
                Chọn emoji để thưởng/phạt {esc(sel.fullName)}:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e.emoji}
                    onClick={() => giveEmoji(e.emoji, e.point)}
                    disabled={giving}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: `2px solid ${e.point > 0 ? "rgba(69,227,198,0.3)" : "rgba(245,87,108,0.3)"}`,
                      background: "#fff",
                      cursor: "pointer",
                      textAlign: "center",
                      minWidth: 80,
                      transition: "all .15s",
                      fontFamily: "Inter,sans-serif",
                    }}
                    onMouseEnter={(t) => {
                      t.target.style.transform = "translateY(-2px)";
                      t.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(t) => {
                      t.target.style.transform = "";
                      t.target.style.boxShadow = "";
                    }}
                  >
                    <span
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {e.emoji}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#666",
                        display: "block",
                      }}
                    >
                      {e.label}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: e.point > 0 ? "#3bc4a8" : "#f5576c",
                      }}
                    >
                      {e.point > 0 ? "+" : ""}
                      {e.point}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{ flex: 1, height: 1, background: "#e8e8e8" }}
                ></div>
                <span style={{ fontSize: 12, color: "#999" }}>
                  HOẶC NHẬP ĐIỂM
                </span>
                <div
                  style={{ flex: 1, height: 1, background: "#e8e8e8" }}
                ></div>
              </div>
              <form
                onSubmit={giveCustom}
                style={{ display: "flex", gap: 8, marginTop: 12 }}
              >
                <input
                  className="form-input"
                  type="number"
                  value={customPoint}
                  onChange={(e) => setCustomPoint(e.target.value)}
                  placeholder="Nhập điểm (+/-)"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={giving}
                  style={{
                    padding: "12px 24px",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  OK
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === "activity" &&
        (loadingAct ? (
          <div className="spinner" />
        ) : activity.length === 0 ? (
          <div className="empty">Chưa có hoạt động</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activity.map((l) => {
              const isR = l.sticker?.type === "REWARD";
              const emoji =
                l.note?.match(/^[^\s]+/)?.[0] || (isR ? "⭐" : "⚠️");
              return (
                <div key={l.id} className="activity-item">
                  <div className="activity-emoji">{emoji}</div>
                  <div className="activity-info">
                    <div className="atitle">
                      {esc(l.student?.fullName || "—")} {isR ? "+" : ""}
                      {l.sticker?.point || 0} điểm
                    </div>
                    <div className="atime">
                      {timeAgo(l.createdAt)} · {esc(l.teacher?.fullName || "—")}
                    </div>
                  </div>
                  <div
                    className="activity-point"
                    style={{ color: isR ? "#3bc4a8" : "#f5576c" }}
                  >
                    {isR ? "+" : "-"}
                    {l.sticker?.point || 0}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "members" && (
        <div className="member-list">
          {classData.members?.map((m) => {
            const r = rankMap[m.student.id];
            return (
              <div key={m.student.id} className="member-item">
                <div
                  className="rank-avatar"
                  style={{
                    background: randColor(m.student.id),
                    width: 40,
                    height: 40,
                    fontSize: 14,
                  }}
                >
                  {m.student.fullName.charAt(0)}
                </div>
                <div className="member-info">
                  <div className="member-name">{esc(m.student.fullName)}</div>
                  <div className="member-email">{esc(m.student.email)}</div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: (r?.netPoints || 0) >= 0 ? "#3bc4a8" : "#f5576c",
                  }}
                >
                  {r ? (r.netPoints >= 0 ? "+" : "") + r.netPoints : "0"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <h3>📥 Import danh sách học sinh</h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>
              Paste danh sách (Mã SV [tab] Họ [tab] Tên đệm [tab] Tên)
            </p>
            <form onSubmit={handleImport}>
              <textarea
                className="form-input"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="HE170629&#9;Nguyễn&#9;Minh&#9;Hiếu&#10;HE180293&#9;Phạm&#9;Quang&#9;Tiến"
                rows={10}
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
              {importResult && (
                <div
                  className={`alert ${importResult.errors?.length ? "alert-error" : "alert-success"}`}
                  style={{ marginTop: 12 }}
                >
                  ✅ Import: <strong>{importResult.imported}</strong> thành công
                  {importResult.skipped > 0 && (
                    <>
                      , <strong>{importResult.skipped}</strong> đã có
                    </>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: 12 }}
                  disabled={importing}
                >
                  {importing ? "Đang import..." : "Import"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: 12 }}
                  onClick={() => setShowImport(false)}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
