import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { classes, ranking } from "../api";
import { esc, randColor, timeAgo, showToast } from "../utils";
import EMOJI_DATA from "../emojiData";

const API = "/api";
const EMOJI_CATEGORIES = Object.keys(EMOJI_DATA);

const DEFAULT_EMOJIS = [
  { emoji: "🌟", point: 5, label: "Xuất sắc" },
  { emoji: "🎯", point: 4, label: "Chính xác" },
  { emoji: "⭐", point: 3, label: "Tốt" },
  { emoji: "🔥", point: 3, label: "Đỉnh" },
  { emoji: "💪", point: 2, label: "Cố gắng" },
  { emoji: "👏", point: 2, label: "Hay" },
  { emoji: "👍", point: 1, label: "Được" },
  { emoji: "👎", point: -1, label: "Chưa tốt" },
  { emoji: "⚠️", point: -2, label: "Nhắc nhở" },
  { emoji: "📝", point: -2, label: "Thiếu bài" },
  { emoji: "⏰", point: -1, label: "Đi muộn" },
  { emoji: "🚫", point: -3, label: "Vi phạm" },
];

function loadEmojis() {
  try {
    const d = localStorage.getItem("customEmojis");
    return d ? JSON.parse(d) : DEFAULT_EMOJIS;
  } catch (e) {
    return DEFAULT_EMOJIS;
  }
}
function saveEmojis(list) {
  localStorage.setItem("customEmojis", JSON.stringify(list));
}

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [rankData, setRankData] = useState(null);
  const [tab, setTab] = useState("ranking");
  const [activity, setActivity] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [giving, setGiving] = useState(false);
  const [quickEmojis, setQuickEmojis] = useState(loadEmojis);
  const [editing, setEditing] = useState(false);
  const [editIdx, setEditIdx] = useState(-99);
  const [editEmoji, setEditEmoji] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editPoint, setEditPoint] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCat, setEmojiCat] = useState(EMOJI_CATEGORIES[0]);
  // Student detail popup
  const [detailStudent, setDetailStudent] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
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
      const r = await fetch(API + "/rewards/class/" + id + "?limit=50", {
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

  const openStudentDetail = async (student) => {
    setDetailStudent(student);
    setDetailLoading(true);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch(
        API + "/rewards/student/" + student.id + "/class/" + id,
        { headers: { Authorization: "Bearer " + t } },
      );
      const d = await r.json();
      setDetailLogs(d.data?.logs || []);
    } catch (e) {
      setDetailLogs([]);
    }
    setDetailLoading(false);
  };

  const giveEmoji = async (emoji, point) => {
    if (!detailStudent) return;
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
          studentId: detailStudent.id.toString(),
          point,
          note: emoji,
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`${emoji} → ${detailStudent.fullName}`);
        load();
        openStudentDetail(detailStudent);
      } else showToast(d.message || "Lỗi", "error");
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    }
    setGiving(false);
  };

  // Edit emojis
  const openEdit = (idx) => {
    if (idx === -1) {
      setEditEmoji("⭐");
      setEditLabel("");
      setEditPoint("1");
    } else {
      const e = quickEmojis[idx];
      setEditEmoji(e.emoji);
      setEditLabel(e.label);
      setEditPoint(String(e.point));
    }
    setEditIdx(idx);
    setShowEmojiPicker(false);
  };
  const saveEdit = () => {
    const p = parseInt(editPoint) || 1;
    const item = {
      emoji: editEmoji || "⭐",
      point: p,
      label: editLabel || (p > 0 ? "Thưởng" : "Phạt"),
    };
    let list;
    if (editIdx === -1) list = [...quickEmojis, item];
    else {
      list = [...quickEmojis];
      list[editIdx] = item;
    }
    setQuickEmojis(list);
    saveEmojis(list);
    setEditIdx(-99);
  };
  const deleteEdit = () => {
    const list = quickEmojis.filter((_, i) => i !== editIdx);
    setQuickEmojis(list);
    saveEmojis(list);
    setEditIdx(-99);
  };
  const resetEmojis = () => {
    setQuickEmojis(DEFAULT_EMOJIS);
    saveEmojis(DEFAULT_EMOJIS);
    setEditing(false);
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
          onClick={() => setTab("ranking")}
        >
          🏆 Bảng xếp hạng
        </button>
        {isTeacher && (
          <button
            className={`tab ${tab === "reward" ? "active" : ""}`}
            onClick={() => setTab("reward")}
          >
            ⭐ Thưởng / Phạt
          </button>
        )}
        <button
          className={`tab ${tab === "activity" ? "active" : ""}`}
          onClick={() => {
            setTab("activity");
            loadActivity();
          }}
        >
          📋 Hoạt động
        </button>
        <button
          className={`tab ${tab === "members" ? "active" : ""}`}
          onClick={() => setTab("members")}
        >
          👥 Thành viên
        </button>
      </div>

      {/* Ranking Tab */}
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
                <div
                  key={r.student.id}
                  className="rank-item"
                  onClick={() => openStudentDetail(r.student)}
                  style={{ cursor: "pointer" }}
                >
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

      {/* Reward Tab - full student list with quick select */}
      {tab === "reward" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              👆 Bấm vào học sinh để thưởng/phạt điểm
            </div>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                fontSize: 12,
                color: "#999",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {editing ? "Xong" : "✏️ Sửa emoji"}
            </button>
          </div>

          {/* Emoji edit bar */}
          {editing && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                border: "1px solid #e8e8e8",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {quickEmojis.map((e, i) => (
                  <button
                    key={i}
                    onClick={() => openEdit(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e8e8e8",
                      background: "#fafafa",
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "Inter,sans-serif",
                    }}
                  >
                    {e.emoji} {e.label} ({e.point > 0 ? "+" : ""}
                    {e.point}) ✏️
                  </button>
                ))}
                <button
                  onClick={() => openEdit(-1)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px dashed #ccc",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 20,
                    color: "#999",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  +
                </button>
              </div>
              {editIdx !== -99 && (
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 11, color: "#999", marginBottom: 4 }}
                    >
                      Emoji
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <input
                        className="form-input"
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        style={{ width: 60, textAlign: "center", fontSize: 20 }}
                      />
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={{
                          fontSize: 18,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        📋
                      </button>
                    </div>
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: "absolute",
                          zIndex: 10,
                          background: "#fff",
                          border: "1px solid #e8e8e8",
                          borderRadius: 8,
                          padding: 8,
                          marginTop: 4,
                          maxWidth: 320,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 2,
                            overflowX: "auto",
                            marginBottom: 4,
                          }}
                        >
                          {EMOJI_CATEGORIES.map((c) => {
                            const icon = c.split(" ")[0];
                            return (
                              <button
                                key={c}
                                onClick={() => setEmojiCat(c)}
                                style={{
                                  padding: "2px 5px",
                                  fontSize: 14,
                                  border: "none",
                                  background:
                                    emojiCat === c
                                      ? "rgba(69,227,198,0.2)"
                                      : "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                }}
                              >
                                {icon}
                              </button>
                            );
                          })}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(10,1fr)",
                            gap: 1,
                            maxHeight: 100,
                            overflowY: "auto",
                            padding: 4,
                          }}
                        >
                          {(EMOJI_DATA[emojiCat] || []).map((e) => (
                            <button
                              key={e}
                              onClick={() => {
                                setEditEmoji(e);
                                setShowEmojiPicker(false);
                              }}
                              style={{
                                fontSize: 18,
                                padding: 2,
                                border:
                                  editEmoji === e
                                    ? "2px solid #45e3c6"
                                    : "2px solid transparent",
                                cursor: "pointer",
                                borderRadius: 4,
                              }}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 11, color: "#999", marginBottom: 4 }}
                    >
                      Nhãn
                    </div>
                    <input
                      className="form-input"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      style={{ width: 100 }}
                    />
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 11, color: "#999", marginBottom: 4 }}
                    >
                      Điểm
                    </div>
                    <input
                      className="form-input"
                      type="number"
                      value={editPoint}
                      onChange={(e) => setEditPoint(e.target.value)}
                      style={{ width: 60, textAlign: "center" }}
                    />
                  </div>
                  <button
                    onClick={saveEdit}
                    className="btn btn-primary"
                    style={{ padding: "8px 14px", fontSize: 13 }}
                  >
                    Lưu
                  </button>
                  {editIdx >= 0 && (
                    <button
                      onClick={deleteEdit}
                      style={{
                        padding: "8px 14px",
                        fontSize: 13,
                        background: "none",
                        border: "1px solid #f5576c",
                        color: "#f5576c",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={resetEmojis}
                style={{
                  fontSize: 11,
                  color: "#f5576c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginTop: 8,
                }}
              >
                ↺ Về mặc định
              </button>
            </div>
          )}

          {/* Student list like ranking */}
          <div className="rank-list">
            {(classData.members || []).map((m) => {
              const r = rankMap[m.student.id];
              return (
                <div
                  key={m.student.id}
                  className="rank-item"
                  onClick={() => openStudentDetail(m.student)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="rank-avatar"
                    style={{ background: randColor(m.student.id) }}
                  >
                    {m.student.fullName.charAt(0)}
                  </div>
                  <div className="rank-name">{esc(m.student.fullName)}</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 14,
                      alignItems: "center",
                    }}
                  >
                    {r && (
                      <>
                        <span
                          className="text-green"
                          style={{ fontWeight: 700 }}
                        >
                          +{r.totalReward}
                        </span>
                        <span className="text-red" style={{ fontWeight: 700 }}>
                          -{r.totalPenalty}
                        </span>
                      </>
                    )}
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 16,
                        minWidth: 50,
                        textAlign: "right",
                        color: (r?.netPoints || 0) >= 0 ? "#3bc4a8" : "#f5576c",
                      }}
                    >
                      {r ? (r.netPoints >= 0 ? "+" : "") + r.netPoints : "0"}
                    </span>
                    <span style={{ color: "#45e3c6", fontSize: 20 }}>➕</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Tab */}
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

      {/* Members Tab */}
      {tab === "members" && (
        <div className="member-list">
          {classData.members?.map((m) => {
            const r = rankMap[m.student.id];
            return (
              <div
                key={m.student.id}
                className="member-item"
                onClick={() => openStudentDetail(m.student)}
                style={{ cursor: "pointer" }}
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

      {/* ===== STUDENT DETAIL POPUP ===== */}
      {detailStudent && (
        <div className="modal-overlay" onClick={() => setDetailStudent(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                className="rank-avatar"
                style={{
                  background: randColor(detailStudent.id),
                  width: 48,
                  height: 48,
                  fontSize: 18,
                }}
              >
                {detailStudent.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>
                  {esc(detailStudent.fullName)}
                </h3>
                <div style={{ fontSize: 13, color: "#999" }}>
                  {esc(detailStudent.email)}
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                style={{
                  color: "#999",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 24,
                }}
              >
                ✕
              </button>
            </div>

            {/* Point summary */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(69,227,198,0.08)",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#999" }}>Tổng thưởng</div>
                <div
                  style={{ fontSize: 24, fontWeight: 800, color: "#3bc4a8" }}
                >
                  +{rankMap[detailStudent.id]?.totalReward || 0}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(245,87,108,0.06)",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#999" }}>Tổng phạt</div>
                <div
                  style={{ fontSize: 24, fontWeight: 800, color: "#f5576c" }}
                >
                  -{rankMap[detailStudent.id]?.totalPenalty || 0}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "#fafafa",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#999" }}>Tổng</div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color:
                      (rankMap[detailStudent.id]?.netPoints || 0) >= 0
                        ? "#3bc4a8"
                        : "#f5576c",
                  }}
                >
                  {(rankMap[detailStudent.id]?.netPoints || 0) >= 0 ? "+" : ""}
                  {rankMap[detailStudent.id]?.netPoints || 0}
                </div>
              </div>
            </div>

            {/* Emoji buttons for teacher */}
            {isTeacher && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: 10,
                  }}
                >
                  Thưởng / Phạt nhanh:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {quickEmojis.map((e, i) => (
                    <button
                      key={i}
                      onClick={() => giveEmoji(e.emoji, e.point)}
                      disabled={giving}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `2px solid ${e.point > 0 ? "rgba(69,227,198,0.3)" : "rgba(245,87,108,0.3)"}`,
                        background: "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        fontFamily: "Inter,sans-serif",
                        transition: "all .15s",
                      }}
                      onMouseEnter={(t) =>
                        (t.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(t) => (t.target.style.transform = "")}
                    >
                      <span
                        style={{
                          fontSize: 24,
                          display: "block",
                          marginBottom: 2,
                        }}
                      >
                        {e.emoji}
                      </span>
                      <span
                        style={{ fontSize: 11, fontWeight: 600, color: "#666" }}
                      >
                        {e.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: e.point > 0 ? "#3bc4a8" : "#f5576c",
                          display: "block",
                        }}
                      >
                        {e.point > 0 ? "+" : ""}
                        {e.point}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#666",
                marginBottom: 8,
              }}
            >
              Lịch sử nhận:
            </div>
            {detailLoading ? (
              <div className="spinner" />
            ) : detailLogs.length === 0 ? (
              <div
                style={{
                  color: "#999",
                  fontSize: 13,
                  textAlign: "center",
                  padding: 16,
                }}
              >
                Chưa có hoạt động nào
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {detailLogs.slice(0, 20).map((l) => {
                  const isR = l.sticker?.type === "REWARD";
                  const emoji =
                    l.note?.match(/^[^\s]+/)?.[0] || (isR ? "⭐" : "⚠️");
                  return (
                    <div
                      key={l.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#fafafa",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{emoji}</span>
                      <div style={{ flex: 1, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>
                          {isR ? "+" : "-"}
                          {l.sticker?.point || 0} điểm
                        </span>
                        <span style={{ color: "#999", marginLeft: 8 }}>
                          {timeAgo(l.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
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
