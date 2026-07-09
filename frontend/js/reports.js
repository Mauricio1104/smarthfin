let expenseChart = null;
let incomeChart = null;
let monthlyChart = null;

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function buildDateQuery() {
  const params = new URLSearchParams();
  const start = document.getElementById('filterStart').value;
  const end = document.getElementById('filterEnd').value;
  if (start) params.set('start_date', start);
  if (end) params.set('end_date', end);
  return params.toString();
}

function renderDoughnut(canvasId, existingChart, data) {
  const ctx = document.getElementById(canvasId);
  if (existingChart) existingChart.destroy();

  if (data.length === 0) {
    return new Chart(ctx, { type: 'doughnut', data: { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] } });
  }

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map((c) => c.category_name),
      datasets: [{ data: data.map((c) => c.total), backgroundColor: data.map((c) => c.color) }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

async function loadCategoryCharts() {
  const query = buildDateQuery();
  try {
    const [expenses, income] = await Promise.all([
      apiRequest(`/reports/by-category?type=despesa${query ? '&' + query : ''}`),
      apiRequest(`/reports/by-category?type=receita${query ? '&' + query : ''}`)
    ]);
    expenseChart = renderDoughnut('expenseCategoryChart', expenseChart, expenses);
    incomeChart = renderDoughnut('incomeCategoryChart', incomeChart, income);
  } catch (err) {
    showAlert(err.message);
  }
}

async function loadMonthlyChart() {
  try {
    const monthly = await apiRequest('/reports/monthly?months=12');
    const ctx = document.getElementById('monthlyChart');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthly.map((m) => m.month),
        datasets: [
          { label: 'Receitas', data: monthly.map((m) => m.receitas), backgroundColor: '#16a34a' },
          { label: 'Despesas', data: monthly.map((m) => m.despesas), backgroundColor: '#dc2626' }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    });
  } catch (err) {
    showAlert(err.message);
  }
}

['filterStart', 'filterEnd'].forEach((id) => {
  document.getElementById(id).addEventListener('change', loadCategoryCharts);
});

loadMonthlyChart();
loadCategoryCharts();
