import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { classes } from '../api';
import { esc, showToast } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [semester, setSemester] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [modalError, setModalError] = useState('');

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => { if (!user) navigate('/login'); else load(); }, [user]);

  const load = async () => {
    try {
      const data = await classes.list();
      setData(data.data);
    } catch (e) {
      setData([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!className.trim()) return;
    try {
      await classes.create({ className: className.trim(), description: classDesc, schoolYear, semester: semester || null });
      setShowCreate(false); setClassName(''); setClassDesc(''); setSchoolYear(''); setSemester('');
      load(); showToast('Tạo lớp thành công!');
    } catch (err) { setModalError(err.message); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await classes.join(joinCode.trim().toUpperCase());
      setShowJoin(false); setJoinCode('');
      load(); showToast('Tham gia thành công!');
    } catch (err) { setModalError(err.message); }
  };

  if (!data) return <div className="spinner" />;

  const totalStudents = data.reduce((s, c) => s + (c._count?.members || 0), 0);

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div className="stats-row">
        <div className="stat-card"><div className="label">Lớp học</div><div className="value">{data.length}</div></div>
        <div className="stat-card"><div className="label">Học sinh</div><div className="value">{totalStudents}</div></div>
        <div className="stat-card">
          <div className="label">Thao tác nhanh</div>
          {isTeacher
            ? <button className="btn btn-primary mt-2" onClick={() => setShowCreate(true)}>+ Tạo lớp mới</button>
            : <button className="btn btn-primary mt-2" onClick={() => setShowJoin(true)}>+ Tham gia lớp</button>}
        </div>
      </div>

      <h2 className="section-title">{isTeacher ? 'Lớp của tôi' : 'Lớp đã tham gia'}</h2>

      {data.length === 0 ? (
        <div className="empty">
          <p>{isTeacher ? 'Chưa có lớp học nào.' : 'Chưa tham gia lớp nào.'}</p>
          {isTeacher
            ? <button className="btn btn-primary mt-2" onClick={() => setShowCreate(true)}>Tạo lớp đầu tiên</button>
            : <button className="btn btn-primary mt-2" onClick={() => setShowJoin(true)}>Tham gia ngay</button>}
        </div>
      ) : (
        <div className="class-grid">
          {data.map(c => (
            <Link to={`/class/${c.id}`} key={c.id} className="class-card">
              <div className="name">{esc(c.className)}</div>
              <div className="meta">
                <span>{c.schoolYear || '—'} · HK{c.semester || '—'}</span>
                <span>{c._count?.members || 0} học sinh</span>
              </div>
              <div className="code">Mã: {esc(c.joinCode)}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Tạo lớp học mới</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="form-label">Tên lớp</label><input className="form-input" value={className} onChange={e => setClassName(e.target.value)} placeholder="Toán 8A" /></div>
              <div className="form-group"><label className="form-label">Mô tả</label><input className="form-input" value={classDesc} onChange={e => setClassDesc(e.target.value)} placeholder="Mô tả" /></div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Năm học</label><input className="form-input" value={schoolYear} onChange={e => setSchoolYear(e.target.value)} placeholder="2026-2027" /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Học kỳ</label><select className="form-input" value={semester} onChange={e => setSemester(e.target.value)}><option value="">--</option><option value="1">Kỳ 1</option><option value="2">Kỳ 2</option></select></div>
              </div>
              {modalError && <div className="alert alert-error">{modalError}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>Tạo lớp</button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: 8, padding: 12 }} onClick={() => setShowCreate(false)}>Hủy</button>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Tham gia lớp học</h3>
            <form onSubmit={handleJoin}>
              <div className="form-group"><label className="form-label">Mã lớp</label><input className="form-input" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Nhập mã lớp" style={{ textTransform: 'uppercase' }} /></div>
              {modalError && <div className="alert alert-error">{modalError}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>Tham gia</button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: 8, padding: 12 }} onClick={() => setShowJoin(false)}>Hủy</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
