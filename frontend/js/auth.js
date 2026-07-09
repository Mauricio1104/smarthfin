function showAlert(message, type = 'error') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.innerHTML = `<div class="alert ${type}">${message}</div>`;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
      setSession(data.token, data.user);
      window.location.href = DASHBOARD_URL;
    } catch (err) {
      showAlert(err.message);
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
      setSession(data.token, data.user);
      window.location.href = DASHBOARD_URL;
    } catch (err) {
      showAlert(err.message);
    }
  });
}

if (getToken() && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('register.html') || window.location.pathname === '/')) {
  window.location.href = DASHBOARD_URL;
}

const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', () => {
    showAlert('Login com Google estará disponível em breve.', 'info');
  });
}

document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.classList.toggle('is-visible', input.type === 'text');
  });
});
