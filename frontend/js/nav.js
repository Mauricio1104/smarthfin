requireLogin();

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const badge = document.getElementById('userBadge');
  const avatar = document.getElementById('userAvatar');
  if (user) {
    if (badge) badge.textContent = user.name;
    if (avatar) avatar.textContent = user.name ? user.name.trim().charAt(0).toUpperCase() : '?';
  }

  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach((link) => {
    if (link.getAttribute('data-page') === currentPage) {
      link.classList.add('active');
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = LOGIN_URL;
    });
  }

  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  if (sidebar && collapseBtn) {
    if (localStorage.getItem('smarthfin_sidebar_collapsed') === '1') {
      sidebar.classList.add('collapsed');
    }
    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('smarthfin_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
    });
  }

  const userMenuTrigger = document.getElementById('userMenuTrigger');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuTrigger && userDropdown) {
    userMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userMenuTrigger.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
});
