requireLogin();

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const badge = document.getElementById('userBadge');
  if (badge && user) {
    badge.textContent = user.name;
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
});
