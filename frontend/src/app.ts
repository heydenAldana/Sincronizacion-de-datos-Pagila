const API = "http://localhost:3000/api";

const clockEl = document.getElementById("clock")!;
const statusPg = document.getElementById("status-pg")!;
const statusMy = document.getElementById("status-my")!;
const pendingLogs = document.getElementById("pending-logs")!;
const btnIn = document.getElementById("btn-sync-in") as HTMLButtonElement;
const btnOut = document.getElementById("btn-sync-out") as HTMLButtonElement;
const progressSection = document.getElementById("progress-section")!;
const progressMsg = document.getElementById("progress-msg")!;
const resultsSection = document.getElementById("results-section")!;
const resultsBody = document.getElementById("results-body")!;
const historyList = document.getElementById("history-list")!;

function updateClock(): void {
  clockEl.textContent = new Date().toLocaleString("es-HN");
}
setInterval(updateClock, 1000);
updateClock();

async function fetchStatus(): Promise<void> {
  try {
    const res = await fetch(`${API}/status`);
    const data = await res.json();

    statusPg.textContent = data.postgres === "connected" ? "Conectado" : "Error";
    statusPg.className = "status-dot " + (data.postgres === "connected" ? "ok" : "err");

    statusMy.textContent = data.mysql === "connected" ? "Conectado" : "Error";
    statusMy.className = "status-dot " + (data.mysql === "connected" ? "ok" : "err");

    pendingLogs.innerHTML = "";
    const logs: Record<string, number> = data.pending_logs || {};
    for (const [table, count] of Object.entries(logs)) {
      const li = document.createElement("li");
      li.innerHTML = `${table}: <span>${count}</span>`;
      pendingLogs.appendChild(li);
    }
  } catch {
    statusPg.textContent = "Sin respuesta";
    statusMy.textContent = "Sin respuesta";
  }
}

function setLoading(msg: string, loading: boolean): void {
  btnIn.disabled = loading;
  btnOut.disabled = loading;
  progressSection.style.display = loading ? "flex" : "none";
  progressMsg.textContent = msg;
}

function renderResults(results: any[]): void {
  resultsBody.innerHTML = "";
  resultsSection.style.display = "block";

  for (const r of results) {
    const tr = document.createElement("tr");
    const hasErrors = r.errors && r.errors.length > 0;
    tr.innerHTML = `
      <td>${r.table}</td>
      <td class="${r.inserted > 0 ? "ok-cell" : ""}">${r.inserted}</td>
      <td class="${r.updated > 0 ? "ok-cell" : ""}">${r.updated}</td>
      <td class="${hasErrors ? "err-cell" : "ok-cell"}">
        ${hasErrors ? r.errors.slice(0, 2).join("<br>") + (r.errors.length > 2 ? `<br>+${r.errors.length - 2} más` : "") : "✓"}
      </td>
    `;
    resultsBody.appendChild(tr);
  }
}

async function fetchHistory(): Promise<void> {
  try {
    const res = await fetch(`${API}/sync/history`);
    const history: any[] = await res.json();
    historyList.innerHTML = "";

    if (!history.length) {
      historyList.innerHTML = `<p style="color:var(--muted);font-size:.9rem">Sin historial aún.</p>`;
      return;
    }

    for (const entry of history.slice(0, 10)) {
      const div = document.createElement("div");
      div.className = "history-item";
      const total = entry.results.reduce(
        (acc: any, r: any) => ({
          ins: acc.ins + r.inserted,
          upd: acc.upd + r.updated,
          err: acc.err + (r.errors?.length || 0),
        }),
        { ins: 0, upd: 0, err: 0 }
      );

      div.innerHTML = `
        <div class="meta">
          <span class="badge badge-${entry.type.toLowerCase()}">${entry.type}</span>
          <span>${new Date(entry.timestamp).toLocaleString("es-HN")}</span>
        </div>
        <div>+${total.ins} insertados &nbsp; ~${total.upd} actualizados &nbsp; ${total.err > 0 ? `<span style="color:var(--error)">${total.err} errores</span>` : "✓ sin errores"}</div>
      `;
      historyList.appendChild(div);
    }
  } catch {}
}

btnIn.addEventListener("click", async () => {
  setLoading("Ejecutando Sync IN (Master → Slave)...", true);
  try {
    const res = await fetch(`${API}/sync/in`, { method: "POST" });
    const data = await res.json();
    renderResults(data.results);
    fetchHistory();
    fetchStatus();
  } catch (e: any) {
    alert(`Error: ${e.message}`);
  } finally {
    setLoading("", false);
  }
});

btnOut.addEventListener("click", async () => {
  setLoading("Ejecutando Sync OUT (Slave → Master)...", true);
  try {
    const res = await fetch(`${API}/sync/out`, { method: "POST" });
    const data = await res.json();
    renderResults(data.results);
    fetchHistory();
    fetchStatus();
  } catch (e: any) {
    alert(`Error: ${e.message}`);
  } finally {
    setLoading("", false);
  }
});

// Polling cada 30s
fetchStatus();
fetchHistory();
setInterval(() => { fetchStatus(); fetchHistory(); }, 30000);