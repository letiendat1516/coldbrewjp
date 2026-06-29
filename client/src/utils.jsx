import { Link } from 'react-router-dom';

const colors = ['#45E3C6','#667EEA','#F5576C','#FF9800','#4CAF50','#9C27B0','#00BCD4','#FF5722','#3F51B5'];

export function randColor(id) {
  return colors[Number(BigInt(id) % BigInt(colors.length))] || colors[0];
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return m + ' phút trước';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' giờ trước';
  return Math.floor(h / 24) + ' ngày trước';
}

export function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
