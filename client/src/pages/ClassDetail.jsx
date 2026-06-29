import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { classes, rewards, ranking } from "../api";
import { esc, randColor, timeAgo, showToast } from "../utils";

const API = "/api";

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

  // Add sticker form
  const [showAddSticker, setShowAddSticker] = useState(false);
  const [stickerName, setStickerName] = useState("");
  const [stickerEmoji, setStickerEmoji] = useState("");
  const [stickerPoint, setStickerPoint] = useState("1");
  const [stickerType, setStickerType] = useState("REWARD");
  const [stickerSetId, setStickerSetId] = useState(null);

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
      const setIds = [];
      if (c.data.stickerSets)
        for (const m of c.data.stickerSets) {
          if (m.stickerSet?.stickers) stk.push(...m.stickerSet.stickers);
          setIds.push(m.stickerSetId?.toString());
        }
      setStickers(stk);
      if (setIds.length > 0) setStickerSetId(setIds[0]);
    } catch (e) {
      setClassData(null);
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

  const handleAddSticker = async (e) => {
    e.preventDefault();
    if (!stickerName.trim() || !stickerPoint) return;
    try {
      const token = localStorage.getItem("token");

      // Create or find sticker set
      let setId = stickerSetId;
      if (!setId) {
        // Create a new sticker set for this teacher
        const setRes = await fetch(API + "/stickers/sets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ name: "Default Stickers", isDefault: true }),
        });
        const setData = await setRes.json();
        if (!setData.success) throw new Error(setData.message);
        setId = setData.data.id.toString();

        // Assign to class
        await fetch(API + "/stickers/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ classId: id, stickerSetId: setId }),
        });
      }

      // Create sticker
      const stickerRes = await fetch(API + "/stickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          stickerSetId: setId,
          name: stickerName.trim(),
          emoji: stickerEmoji || (stickerType === "REWARD" ? "⭐" : "⚠️"),
          point: parseInt(stickerPoint),
          type: stickerType,
        }),
      });
      const stickerData = await stickerRes.json();
      if (!stickerData.success) throw new Error(stickerData.message);

      setShowAddSticker(false);
      setStickerName("");
      setStickerEmoji("");
      setStickerPoint("1");
      showToast("Đã thêm sticker: " + stickerName);
      load();
    } catch (e) {
      showToast(e.message || "Lỗi", "error");
    }
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
        <span>
          📅{" "}
          <strong>
            {classData.schoolYear || "—"} - HK{classData.semester || "—"}
          </strong>
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

      {/* ... ranking, reward, activity, members tabs (same as before) ... */}

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

          {stickers.length === 0 && !showAddSticker ? (
            <div className="empty">
              <p>Chưa có sticker nào.</p>
              {isTeacher && (
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => setShowAddSticker(true)}
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
                        onClick={() => {
                          setStickerType("REWARD");
                          setShowAddSticker(true);
                        }}
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
                        onClick={() => {
                          setStickerType("PENALTY");
                          setShowAddSticker(true);
                        }}
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
              {isTeacher &&
                (rewardsList.length === 0 || penaltiesList.length === 0) && (
                  <button
                    className="btn btn-outline"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => setShowAddSticker(true)}
                  >
                    + Thêm sticker mới
                  </button>
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
                placeholder={`HE170629\tNguyễn\tMinh\tHiếu\nHE180293\tPhạm\tQuang\tTiến\n...`}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              + Thêm sticker {stickerType === "REWARD" ? "thưởng" : "phạt"}
            </h3>
            <form onSubmit={handleAddSticker}>
              <div className="form-group">
                <label className="form-label">Tên sticker</label>
                <input
                  className="form-input"
                  value={stickerName}
                  onChange={(e) => setStickerName(e.target.value)}
                  placeholder={
                    stickerType === "REWARD" ? "VD: Xuất sắc" : "VD: Đi muộn"
                  }
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Emoji</label>
                  <input
                    className="form-input"
                    value={stickerEmoji}
                    onChange={(e) => setStickerEmoji(e.target.value)}
                    placeholder="⭐"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    Điểm {stickerType === "REWARD" ? "(+)" : "(-)"}
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    value={stickerPoint}
                    onChange={(e) => setStickerPoint(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Loại</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setStickerType("REWARD")}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: `2px solid ${stickerType === "REWARD" ? "#45e3c6" : "#e8e8e8"}`,
                      background:
                        stickerType === "REWARD"
                          ? "rgba(69,227,198,0.08)"
                          : "#fafafa",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⭐ Thưởng
                  </button>
                  <button
                    type="button"
                    onClick={() => setStickerType("PENALTY")}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: `2px solid ${stickerType === "PENALTY" ? "#f5576c" : "#e8e8e8"}`,
                      background:
                        stickerType === "PENALTY"
                          ? "rgba(245,87,108,0.06)"
                          : "#fafafa",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⚠️ Phạt
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: 12 }}
                >
                  Thêm
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: 12 }}
                  onClick={() => setShowAddSticker(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
