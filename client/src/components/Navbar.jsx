import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo">
          <img src="/assets/images/logo.svg" alt="ClassReward" />
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/dashboard">Quản lý lớp học</NavLink>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <div className="nav-avatar">{user.fullName?.charAt(0)}</div>
              <span className="nav-name">{user.fullName}</span>
              <button className="btn-sm" onClick={handleLogout}>Thoát</button>
            </>
          ) : (
            <Link to="/login" className="btn-sm">Đăng nhập</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
