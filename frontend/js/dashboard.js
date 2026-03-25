const API_BASE = '/api';

async function fetchStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        document.getElementById('status').innerHTML = `<p>Backend: ${data.status}</p><p>Última sincronización: ${new Date().toLocaleString()}</p>`;
    } catch (error) {
        document.getElementById('status').innerHTML = '<p class="text-danger">Error conectando al backend</p>';
    }
}

async function fetchLogs() {
    try {
        const response = await fetch(`${API_BASE}/sync/logs`); // Este endpoint no está implementado, se puede omitir o crear uno para leer el archivo de log
        if (response.ok) {
            const logs = await response.text();
            document.getElementById('logContent').innerText = logs;
        } else {
            document.getElementById('logContent').innerText = 'No se pudieron cargar los logs.';
        }
    } catch (error) {
        document.getElementById('logContent').innerText = 'Error cargando logs.';
    }
}

document.getElementById('syncInBtn').addEventListener('click', async () => {
    const response = await fetch(`${API_BASE}/sync/in`, { method: 'POST' });
    const result = await response.json();
    alert(result.message || result.error);
    fetchLogs();
});

document.getElementById('syncOutBtn').addEventListener('click', async () => {
    const response = await fetch(`${API_BASE}/sync/out`, { method: 'POST' });
    const result = await response.json();
    alert(result.message || result.error);
    fetchLogs();
});

fetchStatus();
fetchLogs();