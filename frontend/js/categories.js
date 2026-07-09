const modal = document.getElementById('categoryModal');
const form = document.getElementById('categoryForm');

function showAlert(message, type = 'error') {
  document.getElementById('alertBox').innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function openModal(category = null) {
  form.reset();
  document.getElementById('categoryId').value = category ? category.id : '';
  document.getElementById('modalTitle').textContent = category ? 'Editar categoria' : 'Nova categoria';

  if (category) {
    document.getElementById('name').value = category.name;
    document.getElementById('type').value = category.type;
    document.getElementById('color').value = category.color;
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

document.getElementById('newCategoryBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('categoryId').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    type: document.getElementById('type').value,
    color: document.getElementById('color').value
  };

  try {
    if (id) {
      await apiRequest(`/categories/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/categories', { method: 'POST', body: payload });
    }
    closeModal();
    await loadCategories();
  } catch (err) {
    showAlert(err.message);
  }
});

async function deleteCategory(id) {
  if (!confirm('Excluir esta categoria também remove todas as transações vinculadas a ela. Continuar?')) return;
  try {
    await apiRequest(`/categories/${id}`, { method: 'DELETE' });
    await loadCategories();
  } catch (err) {
    showAlert(err.message);
  }
}

async function loadCategories() {
  try {
    const categories = await apiRequest('/categories');
    const tbody = document.getElementById('categoriesBody');

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhuma categoria cadastrada.</td></tr>';
      return;
    }

    tbody.innerHTML = categories
      .map(
        (c) => `
        <tr>
          <td><span class="color-swatch" style="background:${c.color}"></span></td>
          <td>${c.name}</td>
          <td>${c.type === 'receita' ? 'Receita' : 'Despesa'}</td>
          <td class="actions-cell">
            <button class="btn btn-secondary btn-sm" data-edit="${c.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-delete="${c.id}">Excluir</button>
          </td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = categories.find((item) => item.id === Number(btn.dataset.edit));
        openModal(cat);
      });
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.delete));
    });
  } catch (err) {
    showAlert(err.message);
  }
}

loadCategories();
