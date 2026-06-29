/**
 * Shared Sidebar Logic — used across all pages
 */
(function () {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    const loginBtn = document.getElementById('sidebarLoginBtn');
    const logoutBtn = document.getElementById('sidebarLogoutBtn');
    const avatar = document.getElementById('sidebarAvatar');
    const name = document.getElementById('sidebarName');
    const role = document.getElementById('sidebarRole');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (avatar) avatar.textContent = user.fullName.charAt(0).toUpperCase();
        if (name) name.textContent = user.fullName;
        if (role) role.textContent = user.role === 'TEACHER' ? 'Giáo viên' : user.role === 'STUDENT' ? 'Học sinh' : 'Quản trị';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    // Redirect to login if no token on protected pages
    const protectedPages = ['dashboard.html', 'class.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage) && (!token || !userStr)) {
        window.location.href = 'login.html';
    }
})();

function doLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// Highlight active nav
(function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navHome = document.getElementById('navHome');
    const navDashboard = document.getElementById('navDashboard');

    if (navHome && navDashboard) {
        navHome.classList.remove('active');
        navDashboard.classList.remove('active');
        if (currentPage === '' || currentPage === '/' || currentPage === 'class-reward.html' || currentPage === 'index.html') {
            navHome.classList.add('active');
        } else if (currentPage === 'dashboard.html' || currentPage === 'class.html') {
            navDashboard.classList.add('active');
        }
    }
})();
