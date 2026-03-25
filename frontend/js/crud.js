const API_BASE = '/api/out';

let currentTable = 'customers';
let currentId = null;

// Cargar datos de cada tabla
async function loadCustomers() {
    const response = await fetch(`${API_BASE}/customers`);
    const customers = await response.json();
    const tbody = document.querySelector('#customersTable tbody');
    tbody.innerHTML = '';
    customers.forEach(c => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = c.customer_id;
        row.insertCell(1).textContent = c.first_name;
        row.insertCell(2).textContent = c.last_name;
        row.insertCell(3).textContent = c.email || '';
        const actions = row.insertCell(4);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'btn btn-sm btn-primary me-1';
        editBtn.onclick = () => openForm('customers', 'update', c.customer_id);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.onclick = () => deleteCustomer(c.customer_id);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
    });
}

async function loadRentals() {
    const response = await fetch(`${API_BASE}/rentals`);
    const rentals = await response.json();
    const tbody = document.querySelector('#rentalsTable tbody');
    tbody.innerHTML = '';
    rentals.forEach(r => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = r.rental_id;
        row.insertCell(1).textContent = new Date(r.rental_date).toLocaleString();
        row.insertCell(2).textContent = r.inventory_id;
        row.insertCell(3).textContent = r.customer_id;
        row.insertCell(4).textContent = r.return_date ? new Date(r.return_date).toLocaleString() : '';
        row.insertCell(5).textContent = r.staff_id;
        const actions = row.insertCell(6);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'btn btn-sm btn-primary me-1';
        editBtn.onclick = () => openForm('rentals', 'update', r.rental_id);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.onclick = () => deleteRental(r.rental_id);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
    });
}

async function loadPayments() {
    const response = await fetch(`${API_BASE}/payments`);
    const payments = await response.json();
    const tbody = document.querySelector('#paymentsTable tbody');
    tbody.innerHTML = '';
    payments.forEach(p => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = p.payment_id;
        row.insertCell(1).textContent = p.customer_id;
        row.insertCell(2).textContent = p.staff_id;
        row.insertCell(3).textContent = p.rental_id;
        row.insertCell(4).textContent = p.amount;
        row.insertCell(5).textContent = new Date(p.payment_date).toLocaleString();
        const actions = row.insertCell(6);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'btn btn-sm btn-primary me-1';
        editBtn.onclick = () => openForm('payments', 'update', p.payment_id);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.onclick = () => deletePayment(p.payment_id);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
    });
}

// Funciones CRUD específicas (se llaman desde los botones)
async function deleteCustomer(id) {
    if (confirm('¿Eliminar cliente?')) {
        await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
        loadCustomers();
    }
}
async function deleteRental(id) {
    if (confirm('¿Eliminar renta?')) {
        await fetch(`${API_BASE}/rentals/${id}`, { method: 'DELETE' });
        loadRentals();
    }
}
async function deletePayment(id) {
    if (confirm('¿Eliminar pago?')) {
        await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' });
        loadPayments();
    }
}

// Abrir modal para agregar/editar
function openForm(table, mode, id = null) {
    currentTable = table;
    currentId = id;
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    const formContainer = document.getElementById('dataForm');
    formContainer.innerHTML = ''; // limpiar

    let fields = [];
    if (table === 'customers') {
        fields = [
            { name: 'store_id', type: 'number', label: 'Tienda ID', required: true },
            { name: 'first_name', type: 'text', label: 'Nombre', required: true },
            { name: 'last_name', type: 'text', label: 'Apellido', required: true },
            { name: 'email', type: 'email', label: 'Email', required: false },
            { name: 'address_id', type: 'number', label: 'Dirección ID', required: true },
            { name: 'active', type: 'checkbox', label: 'Activo', required: false }
        ];
    } else if (table === 'rentals') {
        fields = [
            { name: 'rental_date', type: 'datetime-local', label: 'Fecha Renta', required: true },
            { name: 'inventory_id', type: 'number', label: 'Inventario ID', required: true },
            { name: 'customer_id', type: 'number', label: 'Cliente ID', required: true },
            { name: 'return_date', type: 'datetime-local', label: 'Fecha Retorno', required: false },
            { name: 'staff_id', type: 'number', label: 'Staff ID', required: true }
        ];
    } else if (table === 'payments') {
        fields = [
            { name: 'customer_id', type: 'number', label: 'Cliente ID', required: true },
            { name: 'staff_id', type: 'number', label: 'Staff ID', required: true },
            { name: 'rental_id', type: 'number', label: 'Renta ID', required: true },
            { name: 'amount', type: 'number', step: '0.01', label: 'Monto', required: true },
            { name: 'payment_date', type: 'datetime-local', label: 'Fecha Pago', required: true }
        ];
    }

    fields.forEach(f => {
        const div = document.createElement('div');
        div.className = 'mb-3';
        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = f.label;
        div.appendChild(label);
        let input;
        if (f.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.name = f.name;
            input.value = '1';
        } else {
            input = document.createElement('input');
            input.type = f.type;
            input.className = 'form-control';
            input.name = f.name;
            if (f.step) input.step = f.step;
        }
        input.required = f.required;
        div.appendChild(input);
        formContainer.appendChild(div);
    });

    // Si es edición, cargar datos actuales
    if (mode === 'update' && id) {
        fetchDataForEdit(table, id);
    }

    document.getElementById('saveBtn').onclick = () => saveForm();
    modal.show();
}

async function fetchDataForEdit(table, id) {
    let url;
    if (table === 'customers') url = `${API_BASE}/customers/${id}`;
    else if (table === 'rentals') url = `${API_BASE}/rentals/${id}`;
    else url = `${API_BASE}/payments/${id}`;
    const response = await fetch(url);
    const data = await response.json();
    // Llenar formulario
    for (const key in data) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key] == 1;
            } else if (input.type === 'datetime-local') {
                // Convertir a formato adecuado
                if (data[key]) {
                    const date = new Date(data[key]);
                    input.value = date.toISOString().slice(0, 16);
                }
            } else {
                input.value = data[key];
            }
        }
    }
}

async function saveForm() {
    const form = document.getElementById('dataForm');
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'active') value = value === 'on' ? 1 : 0;
        data[key] = value;
    }

    let url, method;
    if (currentId) {
        // Actualizar
        if (currentTable === 'customers') { url = `${API_BASE}/customers/${currentId}`; method = 'PUT'; }
        else if (currentTable === 'rentals') { url = `${API_BASE}/rentals/${currentId}`; method = 'PUT'; }
        else { url = `${API_BASE}/payments/${currentId}`; method = 'PUT'; }
    } else {
        // Crear
        if (currentTable === 'customers') { url = `${API_BASE}/customers`; method = 'POST'; }
        else if (currentTable === 'rentals') { url = `${API_BASE}/rentals`; method = 'POST'; }
        else { url = `${API_BASE}/payments`; method = 'POST'; }
    }

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        // Recargar tabla
        if (currentTable === 'customers') loadCustomers();
        else if (currentTable === 'rentals') loadRentals();
        else loadPayments();
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
    } else {
        alert('Error al guardar');
    }
}

// Cargar datos iniciales al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
    loadRentals();
    loadPayments();

    document.getElementById('addCustomerBtn').onclick = () => openForm('customers', 'create');
    document.getElementById('addRentalBtn').onclick = () => openForm('rentals', 'create');
    document.getElementById('addPaymentBtn').onclick = () => openForm('payments', 'create');
});