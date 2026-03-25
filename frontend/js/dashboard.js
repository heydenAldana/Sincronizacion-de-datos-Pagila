async function loadDashboard() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-info-circle"></i> Estado de Sincronización
                    </div>
                    <div class="card-body" id="syncStatus">
                        Cargando...
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-file-text"></i> Últimos Logs
                    </div>
                    <div class="card-body">
                        <pre id="logContent">Cargando logs...</pre>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-graph-up"></i> Actividad Reciente
                    </div>
                    <div class="card-body">
                        <p>Aquí se mostrarán estadísticas de sincronización (próximamente).</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    await updateSyncStatus();
    await loadLogs();
}

async function updateSyncStatus() {
    try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const lastSync = localStorage.getItem('lastSyncIn') || 'No realizada';
        const pendingOut = await getPendingOutCount();
        document.getElementById('syncStatus').innerHTML = `
            <p><strong>Backend:</strong> ${data.status}</p>
            <p><strong>Última Sync-IN:</strong> ${lastSync}</p>
            <p><strong>Registros pendientes OUT:</strong> ${pendingOut}</p>
        `;
    } catch (error) {
        document.getElementById('syncStatus').innerHTML = '<p class="text-danger">Error conectando al backend</p>';
    }
}

async function getPendingOutCount() {
    try {
        const tables = ['customer', 'rental', 'payment'];
        let total = 0;
        for (const table of tables) {
            const res = await fetch(`/api/out/${table}_log/count`); // endpoint no implementado, se puede agregar
            if (res.ok) {
                const data = await res.json();
                total += data.count;
            } else {
                total = '?';
            }
        }
        return total;
    } catch {
        return '?';
    }
}

async function loadLogs() {
    try {
        const res = await fetch('/api/sync/logs');
        const logs = await res.text();
        document.getElementById('logContent').innerText = logs || 'No hay logs aún.';
    } catch {
        document.getElementById('logContent').innerText = 'Error cargando logs.';
    }
}