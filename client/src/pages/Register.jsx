import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Vui lòng nhập đầy đủ'); return; }
    if (password.length < 6) { setError('Mật khẩu ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      await doRegister(name, email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Bắt đầu quản lý lớp học ngay</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" />
          </div>
          <div className="form-group">
            <label className="form-label">Bạn là</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['TEACHER', 'STUDENT'].map(r => (
                <button key={r} type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600,
                    border: `2px solid ${role === r ? '#45e3c6' : '#e8e8e8'}`,
                    background: role === r ? 'rgba(69,227,198,0.08)' : '#fafafa',
                    borderRadius: 8, cursor: 'pointer', color: role === r ? '#111' : '#666',
                  }}>
                  {r === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="auth-footer">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}
