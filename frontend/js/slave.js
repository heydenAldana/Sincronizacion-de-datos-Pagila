let currentSlaveTable = '';
let currentSlaveData = [];
let editId = null;

async function loadSlaveTable(table) {
    currentSlaveTable = table;
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>Tabla: ${table.toUpperCase()} (Slave - MySQL)</span>
                <button class="btn btn-sm btn-success" id="addSlaveBtn"><i class="bi bi-plus"></i> Agregar</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped" id="slaveTable">
                        <thead><tr></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    await fetchSlaveData();
    document.getElementById('addSlaveBtn').addEventListener('click', () => openSlaveForm());
}

async function fetchSlaveData() {
    const res = await fetch(`/api/out/${currentSlaveTable}`);
    const data = await res.json();
    currentSlaveData = data;
    renderSlaveTable(data);
}

function renderSlaveTable(data) {
    const thead = document.querySelector('#slaveTable thead tr');
    const tbody = document.querySelector('#slaveTable tbody');
    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="100">No hay datos</td></tr>';
        return;
    }
    const columns = Object.keys(data[0]);
    thead.innerHTML = columns.map(col => `<th>${col}</th><th>Acciones</th>`).join('');
    tbody.innerHTML = data.map(row => {
        const cells = columns.map(col => `<td>${row[col] ?? ''}</td>`).join('');
        return `<tr>${cells}<td>
            <button class="btn btn-sm btn-primary me-1" onclick="editSlaveRow(${row[columns[0]]})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteSlaveRow(${row[columns[0]]})"><i class="bi bi-trash"></i></button>
        </td></tr>`;
    }).join('');
}

function openSlaveForm(id = null) {
    editId = id;
    const modal = new bootstrap.Modal(document.getElementById('crudModal'));
    const form = document.getElementById('crudForm');
    form.innerHTML = '';
    // Obtener la estructura de campos según la tabla
    let fields = [];
    if (currentSlaveTable === 'customer') {
        fields = [
            { name: 'store_id', type: 'number', label: 'Tienda ID', required: true },
            { name: 'first_name', type: 'text', label: 'Nombre', required: true },
            { name: 'last_name', type: 'text', label: 'Apellido', required: true },
            { name: 'email', type: 'email', label: 'Email', required: false },
            { name: 'address_id', type: 'number', label: 'Dirección ID', required: true },
            { name: 'active', type: 'checkbox', label: 'Activo', required: false }
        ];
    } else if (currentSlaveTable === 'rental') {
        fields = [
            { name: 'rental_date', type: 'datetime-local', label: 'Fecha Renta', required: true },
            { name: 'inventory_id', type: 'number', label: 'Inventario ID', required: true },
            { name: 'customer_id', type: 'number', label: 'Cliente ID', required: true },
            { name: 'return_date', type: 'datetime-local', label: 'Fecha Retorno', required: false },
            { name: 'staff_id', type: 'number', label: 'Staff ID', required: true }
        ];
    } else if (currentSlaveTable === 'payment') {
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
            if (f.type === 'datetime-local') input.placeholder = 'YYYY-MM-DDTHH:MM';
        }
        input.required = f.required;
        div.appendChild(input);
        form.appendChild(div);
    });
    if (id) {
        const row = currentSlaveData.find(r => r[Object.keys(r)[0]] == id);
        if (row) {
            for (const key in row) {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = row[key] == 1;
                    } else if (input.type === 'datetime-local' && row[key]) {
                        input.value = new Date(row[key]).toISOString().slice(0, 16);
                    } else {
                        input.value = row[key];
                    }
                }
            }
        }
    }
    document.getElementById('saveCrudBtn').onclick = () => saveSlaveForm();
    modal.show();
}

async function saveSlaveForm() {
    const form = document.getElementById('crudForm');
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (key === 'active') value = value === 'on' ? 1 : 0;
        data[key] = value;
    }
    let url = `/api/out/${currentSlaveTable}`;
    let method = 'POST';
    if (editId) {
        url += `/${editId}`;
        method = 'PUT';
    }
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('crudModal')).hide();
        fetchSlaveData();
    } else {
        alert('Error al guardar');
    }
}

window.editSlaveRow = (id) => openSlaveForm(id);
window.deleteSlaveRow = async (id) => {
    if (confirm('¿Eliminar registro?')) {
        const res = await fetch(`/api/out/${currentSlaveTable}/${id}`, { method: 'DELETE' });
        if (res.ok) fetchSlaveData();
        else alert('Error al eliminar');
    }
};