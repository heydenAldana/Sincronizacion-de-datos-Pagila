async function loadSyncPanel() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Sincronización IN (Master → Slave)
                    </div>
                    <div class="card-body text-center">
                        <button id="syncInBtn" class="btn btn-primary btn-lg"><i class="bi bi-arrow-down"></i> Ejecutar Sync-IN</button>
                        <div id="syncInResult" class="mt-3"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Sincronización OUT (Slave → Master)
                    </div>
                    <div class="card-body text-center">
                        <button id="syncOutBtn" class="btn btn-success btn-lg"><i class="bi bi-arrow-up"></i> Ejecutar Sync-OUT</button>
                        <div id="syncOutResult" class="mt-3"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('syncInBtn').addEventListener('click', async () => {
        const resultDiv = document.getElementById('syncInResult');
        resultDiv.innerHTML = '<div class="spinner-border text-primary"></div> Sincronizando...';
        try {
            const res = await fetch('/api/sync/in', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                resultDiv.innerHTML = '<div class="alert alert-success">Sync-IN completado exitosamente</div>';
                localStorage.setItem('lastSyncIn', new Date().toLocaleString());
            } else {
                resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
            }
        } catch (error) {
            resultDiv.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
        }
    });

    document.getElementById('syncOutBtn').addEventListener('click', async () => {
        const resultDiv = document.getElementById('syncOutResult');
        resultDiv.innerHTML = '<div class="spinner-border text-primary"></div> Sincronizando...';
        try {
            const res = await fetch('/api/sync/out', { method: 'POST' });
            const data = await res.json();
            // Se actualiza el contador de pendientes en dashboard si es visible aún
            if (res.ok)
                resultDiv.innerHTML = '<div class="alert alert-success">Sync-OUT completado exitosamente</div>';
            else
                resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
        } catch (error) {
            resultDiv.innerHTML = '<div class="alert alert-danger">Error de conexión</div>';
        }
    });
}