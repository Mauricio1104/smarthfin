let accounts = [];
let categories = [];

const modal = document.getElementById('transactionModal');
const form = document.getElementById('transactionForm');

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function populateSelect(select, items, { includeAll = false } = {}) {
  select.innerHTML = (includeAll ? '<option value="">Todas</option>' : '') +
    items.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
}

function openModal(transaction = null) {
  form.reset();
  document.getElementById('transactionId').value = transaction ? transaction.id : '';
  document.getElementById('modalTitle').textContent = transaction ? 'Editar transação' : 'Nova transação';

  populateSelect(document.getElementById('account'), accounts);
  populateSelect(document.getElementById('category'), categories);

  if (transaction) {
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('type').value = transaction.type;
    document.getElementById('transactionDate').value = transaction.transaction_date;
    document.getElementById('account').value = transaction.account_id;
    document.getElementById('category').value = transaction.category_id;
  } else {
    document.getElementById('transactionDate').value = new Date().toISOString().slice(0, 10);
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

document.getElementById('newTransactionBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('transactionId').value;
  const payload = {
    description: document.getElementById('description').value.trim(),
    amount: Number(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    transaction_date: document.getElementById('transactionDate').value,
    account_id: Number(document.getElementById('account').value),
    category_id: Number(document.getElementById('category').value)
  };

  try {
    if (id) {
      await apiRequest(`/transactions/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/transactions', { method: 'POST', body: payload });
    }
    closeModal();
    await loadTransactions();
  } catch (err) {
    showAlert(err.message);
  }
});

async function deleteTransaction(id) {
  if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
  try {
    await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
    await loadTransactions();
  } catch (err) {
    showAlert(err.message);
  }
}

function buildQuery() {
  const params = new URLSearchParams();
  const start = document.getElementById('filterStart').value;
  const end = document.getElementById('filterEnd').value;
  const type = document.getElementById('filterType').value;
  const category = document.getElementById('filterCategory').value;
  const account = document.getElementById('filterAccount').value;

  if (start) params.set('start_date', start);
  if (end) params.set('end_date', end);
  if (type) params.set('type', type);
  if (category) params.set('category_id', category);
  if (account) params.set('account_id', account);

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function loadTransactions() {
  try {
    const transactions = await apiRequest(`/transactions${buildQuery()}`);
    const tbody = document.getElementById('transactionsBody');

    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma transação encontrada.</td></tr>';
      return;
    }

    tbody.innerHTML = transactions
      .map(
        (t) => `
        <tr>
          <td>${formatDate(t.transaction_date)}</td>
          <td>${t.description}</td>
          <td><span class="tag" style="background:${t.category_color}22;color:${t.category_color}">${t.category_name}</span></td>
          <td>${t.account_name}</td>
          <td class="amount ${t.type}">${t.type === 'receita' ? '+' : '-'} ${formatCurrency(t.amount)}</td>
          <td class="actions-cell">
            <button class="btn btn-secondary btn-sm" data-edit="${t.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-delete="${t.id}">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = transactions.find((item) => item.id === Number(btn.dataset.edit));
        openModal(t);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteTransaction(btn.dataset.delete));
    });
  } catch (err) {
    showAlert(err.message);
  }
}

['filterStart', 'filterEnd', 'filterType', 'filterCategory', 'filterAccount'].forEach((id) => {
  document.getElementById(id).addEventListener('change', loadTransactions);
});

async function init() {
  try {
    [accounts, categories] = await Promise.all([apiRequest('/accounts'), apiRequest('/categories')]);
    populateSelect(document.getElementById('filterCategory'), categories, { includeAll: true });
    populateSelect(document.getElementById('filterAccount'), accounts, { includeAll: true });
    await loadTransactions();
  } catch (err) {
    showAlert(err.message);
  }
}

init();
