import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTranslate, setShowTranslate] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo">
          <img src="/assets/images/logo.svg" alt="ClassReward" />
        </Link>
        <div className="nav-links" style={{ position: "relative" }}>
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <NavLink to="/dashboard">Quản lý lớp học</NavLink>
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setShowTranslate(true)}
            onMouseLeave={() => setShowTranslate(false)}
          >
            <NavLink
              to="/translate"
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              Dịch
            </NavLink>
            {showTranslate && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e8e8e8",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                  padding: 8,
                  minWidth: 180,
                  zIndex: 50,
                }}
              >
                <Link
                  to="/translate?tab=dictionary"
                  onClick={() => setShowTranslate(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#666",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "none")}
                >
                  📖 Tra từ điển
                </Link>
                <Link
                  to="/translate?tab=translate"
                  onClick={() => setShowTranslate(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#666",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "none")}
                >
                  🌐 Dịch văn bản
                </Link>
                <Link
                  to="/translate?tab=ocr"
                  onClick={() => setShowTranslate(false)}
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#666",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "none")}
                >
                  📷 Dịch ảnh
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <div className="nav-avatar">{user.fullName?.charAt(0)}</div>
              <span className="nav-name">{user.fullName}</span>
              <button className="btn-sm" onClick={handleLogout}>
                Thoát
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-sm">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
