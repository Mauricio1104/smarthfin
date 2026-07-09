const ACCOUNT_TYPE_LABELS = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  carteira: 'Carteira',
  cartao_credito: 'Cartão de crédito',
  investimento: 'Investimento'
};

const modal = document.getElementById('accountModal');
const form = document.getElementById('accountForm');

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function openModal(account = null) {
  form.reset();
  document.getElementById('accountId').value = account ? account.id : '';
  document.getElementById('modalTitle').textContent = account ? 'Editar conta' : 'Nova conta';

  if (account) {
    document.getElementById('name').value = account.name;
    document.getElementById('type').value = account.type;
    document.getElementById('initialBalance').value = account.initial_balance;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

document.getElementById('newAccountBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('accountId').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    type: document.getElementById('type').value,
    initial_balance: Number(document.getElementById('initialBalance').value)
  };

  try {
    if (id) {
      await apiRequest(`/accounts/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/accounts', { method: 'POST', body: payload });
    }
    closeModal();
    await loadAccounts();
  } catch (err) {
    showAlert(err.message);
  }
});

async function deleteAccount(id) {
  if (!confirm('Excluir esta conta também remove todas as transações vinculadas a ela. Continuar?')) return;
  try {
    await apiRequest(`/accounts/${id}`, { method: 'DELETE' });
    await loadAccounts();
  } catch (err) {
    showAlert(err.message);
  }
}

async function loadAccounts() {
  try {
    const accounts = await apiRequest('/accounts');
    const tbody = document.getElementById('accountsBody');

    if (accounts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma conta cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = accounts
      .map(
        (a) => `
        <tr>
          <td>${a.name}</td>
          <td>${ACCOUNT_TYPE_LABELS[a.type] || a.type}</td>
          <td>${formatCurrency(a.initial_balance)}</td>
          <td class="amount ${a.current_balance >= 0 ? 'receita' : 'despesa'}">${formatCurrency(a.current_balance)}</td>
          <td class="actions-cell">
            <button class="btn btn-secondary btn-sm" data-edit="${a.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-delete="${a.id}">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const acc = accounts.find((item) => item.id === Number(btn.dataset.edit));
        openModal(acc);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteAccount(btn.dataset.delete));
    });
  } catch (err) {
    showAlert(err.message);
  }
}

loadAccounts();
