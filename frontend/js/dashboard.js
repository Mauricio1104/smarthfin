async function loadDashboard() {
  try {
    const [summary, monthly, byCategory, transactions] = await Promise.all([
      apiRequest('/reports/summary'),
      apiRequest('/reports/monthly?months=6'),
      apiRequest('/reports/by-category?type=despesa'),
      apiRequest('/transactions')
    ]);

    document.getElementById('cardSaldoTotal').textContent = formatCurrency(summary.saldo_total);
    document.getElementById('cardReceitasMes').textContent = formatCurrency(summary.receitas_mes);
    document.getElementById('cardDespesasMes').textContent = formatCurrency(summary.despesas_mes);

    const saldoMesEl = document.getElementById('cardSaldoMes');
    saldoMesEl.textContent = formatCurrency(summary.saldo_mes);
    saldoMesEl.classList.add(summary.saldo_mes >= 0 ? 'positive' : 'negative');

    renderMonthlyChart(monthly);
    renderCategoryChart(byCategory);
    renderRecentTransactions(transactions.slice(0, 5));
  } catch (err) {
    document.getElementById('alertBox').innerHTML = `<div class="alert error">${err.message}</div>`;
  }
}

function renderMonthlyChart(monthly) {
  const ctx = document.getElementById('monthlyChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthly.map((m) => m.month),
      datasets: [
        { label: 'Receitas', data: monthly.map((m) => m.receitas), backgroundColor: '#16a34a' },
        { label: 'Despesas', data: monthly.map((m) => m.despesas), backgroundColor: '#dc2626' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderCategoryChart(byCategory) {
  const ctx = document.getElementById('categoryChart');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: byCategory.map((c) => c.category_name),
      datasets: [
        {
          data: byCategory.map((c) => c.total),
          backgroundColor: byCategory.map((c) => c.color)
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recentTransactionsBody');
  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma transação cadastrada ainda.</td></tr>';
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
      </tr>`
    )
    .join('');
}

loadDashboard();
