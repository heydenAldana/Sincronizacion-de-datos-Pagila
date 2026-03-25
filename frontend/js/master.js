async function loadMasterTable(table) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="card">
            <div class="card-header">
                Tabla: ${table.toUpperCase()} (Master - PostgreSQL)
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped" id="masterTable">
                        <thead><tr></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    const res = await fetch(`/api/master/${table}`);
    const data = await res.json();
    if (!data.length) {
        document.querySelector('#masterTable tbody').innerHTML = '<tr><td colspan="100">No hay datos</td></tr>';
        return;
    }
    const columns = Object.keys(data[0]);
    const thead = document.querySelector('#masterTable thead tr');
    thead.innerHTML = columns.map(col => `<th>${col}</th>`).join('');
    const tbody = document.querySelector('#masterTable tbody');
    tbody.innerHTML = data.map(row => `<tr>${columns.map(col => `<td>${row[col] ?? ''}</td>`).join('')}</tr>`).join('');
}