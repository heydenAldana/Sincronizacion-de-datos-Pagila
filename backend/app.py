import logging
import threading
from datetime import datetime
from flask import Flask, jsonify, render_template, request
from sync_engine import sync_in, sync_out, get_db_stats, get_sync_history, get_master_conn, get_slave_conn

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = Flask(__name__, template_folder="templates")

# Esto maneja los estad0s de jobs en curso
_job_lock  = threading.Lock()
_job_state = {"running": False, "type": None, "started": None}

def run_job(job_fn, job_type: str):
    """Ejecuta sync_in o sync_out en background thread-safe."""
    with _job_lock:
        if _job_state["running"]:
            return {"error": "Ya hay una sincronizacion en curso."}
        _job_state["running"] = True
        _job_state["type"] = job_type
        _job_state["started"] = datetime.utcnow().isoformat()

    result = {}
    try:
        result = job_fn()
    except Exception as e:
        result = {"status": "error", "errors": [str(e)], "rows_affected": 0}
    finally:
        with _job_lock:
            _job_state["running"] = False
            _job_state["type"] = None
            _job_state["started"] = None

    return result

# Rutas necesarias en el proyecto
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/status")
def api_status():
    stats = get_db_stats()
    with _job_lock:
        job = dict(_job_state)
    stats["job"] = job
    return jsonify(stats)

@app.route("/api/sync/in", methods=["POST"])
def api_sync_in():
    with _job_lock:
        if _job_state["running"]:
            return jsonify({"error": "Sincronizacion en curso, intente mas tarde."}), 409

    t = threading.Thread(target=run_job, args=(sync_in, "IN"), daemon=True)
    t.start()
    t.join()  
    result = run_job.__wrapped__ if hasattr(run_job, "__wrapped__") else sync_in()
    return jsonify(result)

@app.route("/api/sync/out", methods=["POST"])
def api_sync_out():
    with _job_lock:
        if _job_state["running"]:
            return jsonify({"error": "Sincronizacion en curso, intente mas tarde."}), 409

    result = run_job(sync_out, "OUT")
    return jsonify(result)

@app.route("/api/history")
def api_history():
    limit = int(request.args.get("limit", 20))
    history = get_sync_history(limit)
    return jsonify(history)

@app.route("/api/logs/pending")
def api_pending_logs():
    result = {}
    try:
        conn = get_slave_conn()
        cur = conn.cursor(dictionary=True)
        for log_table in ["customer_log", "rental_log", "payment_log"]:
            try:
                cur.execute(
                    f"SELECT operation, COUNT(*) AS cnt FROM `{log_table}` "
                    f"WHERE synced = 0 GROUP BY operation"
                )
                rows = cur.fetchall()
                result[log_table] = {r["operation"]: r["cnt"] for r in rows}
            except Exception as e:
                result[log_table] = {"error": str(e)}
        cur.close(); conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(result)

@app.route("/api/demo/insert-customer", methods=["POST"])
def api_demo_insert():
    try:
        conn = get_slave_conn()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO customer
                (store_id, first_name, last_name, email, address_id, active, create_date)
            VALUES (1, %s, %s, %s, 5, 1, CURDATE())
        """, (
            request.json.get("first_name", "Demo"),
            request.json.get("last_name",  "User"),
            request.json.get("email",      "demo@example.com"),
        ))
        conn.commit()
        new_id = cur.lastrowid
        cur.close(); conn.close()
        return jsonify({"status": "ok", "customer_id": new_id,
                        "message": "Cliente insertado. El trigger ha creado una entrada en customer_log."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
