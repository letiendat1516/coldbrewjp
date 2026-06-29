import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
          <div style={{ flex: 1 }}>
            <h1 className="hero-title">Thưởng phạt dễ dàng.<br />Dạy thông minh hơn.</h1>
            <p className="hero-text">
              Quản lý thưởng phạt, xếp hạng học sinh và báo cáo dễ dàng từ mọi thiết bị.
              Thay đổi cách bạn quản lý lớp học.
            </p>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 12 }}>
              Vào lớp học
            </Link>
          </div>
          <div style={{ flex: 1 }}>
            <img src="/people.webp" alt="ClassReward" className="hero-image" />
          </div>
        </div>
      </div>
    </section>
  );
}
