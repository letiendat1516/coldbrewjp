import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { classes, rewards, ranking } from "../api";
import { esc, randColor, timeAgo, showToast } from "../utils";

const API = "/api";

const EMOJI_LIST = [
  "😀",
  "😂",
  "🤣",
  "😍",
  "🥰",
  "😘",
  "😜",
  "😎",
  "🤩",
  "🥳",
  "😤",
  "😢",
  "😭",
  "😡",
  "🤬",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "🔥",
  "⭐",
  "🌟",
  "✨",
  "💯",
  "🎉",
  "🎊",
  "🏆",
  "🥇",
  "📌",
  "❤️",
  "💔",
  "🎯",
  "🚀",
  "💡",
  "📚",
  "✏️",
  "⚠️",
  "🚫",
  "❌",
  "✅",
  "🟢",
  "🔴",
  "🟡",
  "💩",
  "👻",
  "🤖",
  "🎓",
  "📝",
];

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [rankData, setRankData] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [tab, setTab] = useState("ranking");
  const [sel, setSel] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadingAct, setLoadingAct] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showAddSticker, setShowAddSticker] = useState(false);
  const [stickerType, setStickerType] = useState("REWARD");
  const [allStickerSets, setAllStickerSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState("⭐");
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
      const stk = [];
      if (c.data.stickerSets)
        for (const m of c.data.stickerSets)
          if (m.stickerSet?.stickers) stk.push(...m.stickerSet.stickers);
      setStickers(stk);
    } catch (e) {
      setClassData(null);
    }
  };

  const loadStickerSets = async () => {
    setLoadingSets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API + "/stickers/sets", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setAllStickerSets(data.data);
    } catch (e) {}
    setLoadingSets(false);
  };

  const openAddSticker = (type) => {
    setStickerType(type);
    setShowAddSticker(true);
    loadStickerSets();
  };

  const pickSticker = async (sticker) => {
    try {
      const token = localStorage.getItem("token");
      const assigned = classData.stickerSets?.some(
        (m) => m.stickerSetId?.toString() === sticker.stickerSetId?.toString(),
      );
      if (!assigned)
        await fetch(API + "/stickers/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            classId: id,
            stickerSetId: sticker.stickerSetId?.toString(),
          }),
        });
      setShowAddSticker(false);
      showToast("Đã thêm: " + sticker.name);
      load();
    } catch (e) {
      showToast("Lỗi", "error");
    }
  };

  const createNewSticker = async (e) => {
    e.preventDefault();
    const name = document.getElementById("nsName").value.trim();
    const point = parseInt(document.getElementById("nsPoint").value) || 1;
    if (!name) return;
    try {
      const token = localStorage.getItem("token");
      let setId = allStickerSets[0]?.id?.toString();
      if (!setId) {
        const sr = await fetch(API + "/stickers/sets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ name: "Default Stickers", isDefault: true }),
        });
        const sd = await sr.json();
        if (!sd.success) throw new Error(sd.message);
        setId = sd.data.id.toString();
      }
      const sr = await fetch(API + "/stickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          stickerSetId: setId,
          name,
          emoji: pickedEmoji,
          point,
          type: stickerType,
        }),
      });
      const sd = await sr.json();
      if (!sd.success) throw new Error(sd.message);
      const already = classData.stickerSets?.some(
        (m) => m.stickerSetId?.toString() === setId,
      );
      if (!already)
        await fetch(API + "/stickers/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ classId: id, stickerSetId: setId }),
        });
      setShowAddSticker(false);
      showToast("Đã tạo: " + name);
      load();
    } catch (e) {
      showToast(e.message || "Lỗi", "error");
    }
  };

  const loadActivity = async () => {
    setLoadingAct(true);
    try {
      const data = await rewards.classLogs(id, "limit=30");
      setActivity(data.data?.logs || []);
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
  const giveSticker = async (stickerId) => {
    if (!sel) {
      showToast("Chọn học sinh trước", "error");
      return;
    }
    try {
      await rewards.give(id, sel.id.toString(), stickerId);
      const s = stickers.find((s) => s.id == stickerId);
      showToast(`${s?.emoji || ""} ${s?.name || ""} → ${sel.fullName}`);
      load();
    } catch (e) {
      showToast("Lỗi", "error");
    }
  };
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API + "/classes/" + id + "/import-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ text: importText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.data);
        load();
      } else showToast(data.message || "Lỗi", "error");
    } catch (e) {
      showToast("Lỗi kết nối", "error");
    }
    setImporting(false);
  };

  if (!classData) return <div className="spinner" />;
  const rewardsList = stickers.filter((s) => s.type === "REWARD");
  const penaltiesList = stickers.filter((s) => s.type === "PENALTY");
  const ranking2 = rankData?.ranking || [];
  const summary = rankData?.summary || {};
  const rankMap = {};
  ranking2.forEach((r) => {
    rankMap[r.student.id] = r;
  });
  const availableRewards = allStickerSets.flatMap((set) =>
    (set.stickers || []).filter((s) => s.type === "REWARD"),
  );
  const availablePenalties = allStickerSets.flatMap((set) =>
    (set.stickers || []).filter((s) => s.type === "PENALTY"),
  );

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

      {/* TABS CONTENT - same as before, keeping it compact */}
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
                padding: 12,
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #45e3c6",
                marginBottom: 16,
              }}
            >
              <div
                className="rank-avatar"
                style={{
                  background: randColor(sel.id),
                  width: 40,
                  height: 40,
                  fontSize: 14,
                }}
              >
                {sel.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <strong>{esc(sel.fullName)}</strong>
              </div>
              <button
                onClick={() => setSel(null)}
                style={{
                  color: "#999",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {!sel && (
            <p style={{ color: "#666", marginBottom: 12 }}>
              Chọn học sinh bên dưới, sau đó chọn sticker để thưởng/phạt.
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
            style={{ marginBottom: 16, maxHeight: 200, overflowY: "auto" }}
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
          {stickers.length === 0 ? (
            <div className="empty">
              <p>Chưa có sticker nào.</p>
              {isTeacher && (
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => openAddSticker("REWARD")}
                >
                  + Thêm sticker
                </button>
              )}
            </div>
          ) : (
            <>
              {rewardsList.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#666",
                        textTransform: "uppercase",
                      }}
                    >
                      ⭐ Thưởng
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => openAddSticker("REWARD")}
                        style={{
                          fontSize: 12,
                          color: "#45e3c6",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        + Thêm
                      </button>
                    )}
                  </div>
                  <div className="sticker-grid">
                    {rewardsList.map((s) => (
                      <button
                        key={s.id}
                        className="sticker-btn reward"
                        onClick={() => giveSticker(s.id)}
                      >
                        <span className="sticker-emoji">{s.emoji || "⭐"}</span>
                        <span className="sticker-name">{esc(s.name)}</span>
                        <span className="sticker-point text-green">
                          +{s.point}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {penaltiesList.length > 0 && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#666",
                        textTransform: "uppercase",
                      }}
                    >
                      ⚠️ Phạt
                    </div>
                    {isTeacher && (
                      <button
                        onClick={() => openAddSticker("PENALTY")}
                        style={{
                          fontSize: 12,
                          color: "#f5576c",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        + Thêm
                      </button>
                    )}
                  </div>
                  <div className="sticker-grid">
                    {penaltiesList.map((s) => (
                      <button
                        key={s.id}
                        className="sticker-btn penalty"
                        onClick={() => giveSticker(s.id)}
                      >
                        <span className="sticker-emoji">{s.emoji || "⚠️"}</span>
                        <span className="sticker-name">{esc(s.name)}</span>
                        <span className="sticker-point text-red">
                          {s.point}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
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
            {activity.map((l) => (
              <div key={l.id} className="activity-item">
                <div className="activity-emoji">{l.sticker?.emoji || "📌"}</div>
                <div className="activity-info">
                  <div className="atitle">
                    {esc(l.student?.fullName || "—")} —{" "}
                    {esc(l.sticker?.name || "—")}
                  </div>
                  <div className="atime">
                    {timeAgo(l.createdAt)} · {esc(l.teacher?.fullName || "—")}
                  </div>
                </div>
                <div
                  className="activity-point"
                  style={{
                    color: l.sticker?.type === "REWARD" ? "#3bc4a8" : "#f5576c",
                  }}
                >
                  {l.sticker?.type === "REWARD" ? "+" : ""}
                  {l.sticker?.point || 0}
                </div>
              </div>
            ))}
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
                placeholder={`HE170629\tNguyễn\tMinh\tHiếu\nHE180293\tPhạm\tQuang\tTiến`}
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

      {/* Add Sticker Modal */}
      {showAddSticker && (
        <div className="modal-overlay" onClick={() => setShowAddSticker(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            <h3>
              + Thêm sticker{" "}
              {stickerType === "REWARD" ? "thưởng ⭐" : "phạt ⚠️"}
            </h3>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#666",
                  marginBottom: 10,
                }}
              >
                Chọn từ sticker có sẵn:
              </div>
              {loadingSets ? (
                <div className="spinner" />
              ) : (
                <div className="sticker-grid">
                  {(stickerType === "REWARD"
                    ? availableRewards
                    : availablePenalties
                  ).map((s) => (
                    <button
                      key={s.id}
                      className={`sticker-btn ${stickerType === "REWARD" ? "reward" : "penalty"}`}
                      onClick={() => pickSticker(s)}
                    >
                      <span className="sticker-emoji">
                        {s.emoji || (stickerType === "REWARD" ? "⭐" : "⚠️")}
                      </span>
                      <span className="sticker-name">{esc(s.name)}</span>
                      <span
                        className="sticker-point"
                        style={{
                          color:
                            stickerType === "REWARD" ? "#3bc4a8" : "#f5576c",
                        }}
                      >
                        {stickerType === "REWARD" ? "+" : ""}
                        {s.point}
                      </span>
                    </button>
                  ))}
                  {(stickerType === "REWARD"
                    ? availableRewards
                    : availablePenalties
                  ).length === 0 && (
                    <p style={{ color: "#999", fontSize: 13 }}>
                      Chưa có sticker{" "}
                      {stickerType === "REWARD" ? "thưởng" : "phạt"} nào.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "16px 0",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "#e8e8e8" }}></div>
              <span style={{ fontSize: 12, color: "#999" }}>HOẶC TẠO MỚI</span>
              <div style={{ flex: 1, height: 1, background: "#e8e8e8" }}></div>
            </div>

            <form onSubmit={createNewSticker}>
              <div className="form-group">
                <label className="form-label">Tên sticker</label>
                <input
                  id="nsName"
                  className="form-input"
                  placeholder={
                    stickerType === "REWARD" ? "VD: Xuất sắc" : "VD: Đi muộn"
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Emoji</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        minWidth: 36,
                        textAlign: "center",
                      }}
                    >
                      {pickedEmoji}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: 2,
                      maxHeight: 140,
                      overflowY: "auto",
                      background: "#fafafa",
                      borderRadius: 8,
                      padding: 6,
                    }}
                  >
                    {EMOJI_LIST.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setPickedEmoji(e)}
                        style={{
                          fontSize: 20,
                          padding: 3,
                          border:
                            pickedEmoji === e
                              ? "2px solid #45e3c6"
                              : "2px solid transparent",
                          background:
                            pickedEmoji === e
                              ? "rgba(69,227,198,0.15)"
                              : "none",
                          cursor: "pointer",
                          borderRadius: 6,
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Điểm</label>
                  <input
                    id="nsPoint"
                    className="form-input"
                    type="number"
                    defaultValue="1"
                    min="1"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: 10 }}
                >
                  Tạo mới
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: 10 }}
                  onClick={() => setShowAddSticker(false)}
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
