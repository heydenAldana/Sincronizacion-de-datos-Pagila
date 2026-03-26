import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, List, Tuple

import psycopg2
import psycopg2.extras
import mysql.connector

logger = logging.getLogger("sync_engine")

#  Conexiones
def get_master_conn():
    return psycopg2.connect(
        host=os.environ["MASTER_HOST"],
        port=int(os.environ.get("MASTER_PORT", 5432)),
        dbname=os.environ["MASTER_DB"],
        user=os.environ["MASTER_USER"],
        password=os.environ["MASTER_PASSWORD"],
    )

def get_slave_conn():
    return mysql.connector.connect(
        host=os.environ["SLAVE_HOST"],
        port=int(os.environ.get("SLAVE_PORT", 3306)),
        database=os.environ["SLAVE_DB"],
        user=os.environ["SLAVE_USER"],
        password=os.environ["SLAVE_PASSWORD"],
        charset="utf8mb4",
        autocommit=False,
    )

def load_mapping(path: str = "/app/mapping.json") -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

#  Utilidades que se manejan
def normalize_value(val):
    if isinstance(val, datetime):
        return val
    return val

def build_upsert_mysql(table: str, fields: List[str], pk) -> str:
    cols = ", ".join(f"`{f}`" for f in fields)
    vals = ", ".join(["%s"] * len(fields))
    updates = ", ".join(
        f"`{f}` = VALUES(`{f}`)"
        for f in fields
        if f != (pk if isinstance(pk, str) else pk[0])
    )
    return f"INSERT INTO `{table}` ({cols}) VALUES ({vals}) ON DUPLICATE KEY UPDATE {updates}"

def build_upsert_pg(table: str, fields: List[str], pk) -> str:
    """Genera un INSERT ... ON CONFLICT DO UPDATE para PostgreSQL."""
    cols = ", ".join(f'"{f}"' for f in fields)
    vals = ", ".join(["%s"] * len(fields))
    pk_cols = [pk] if isinstance(pk, str) else pk
    conflict = ", ".join(f'"{p}"' for p in pk_cols)
    updates = ", ".join(
        f'"{f}" = EXCLUDED."{f}"'
        for f in fields
        if f not in pk_cols
    )
    if updates:
        return f'INSERT INTO "{table}" ({cols}) VALUES ({vals}) ON CONFLICT ({conflict}) DO UPDATE SET {updates}'
    else:
        return f'INSERT INTO "{table}" ({cols}) VALUES ({vals}) ON CONFLICT ({conflict}) DO NOTHING'

#  Registro de historial de sincronizaciones
_sync_history: List[Dict] = []
def record_sync(sync_type: str, status: str, tables: list, rows: int,
                error: str = None, started: datetime = None, finished: datetime = None):
    entry = {
        "sync_type": sync_type,
        "status": status,
        "tables_synced": ", ".join(tables),
        "rows_affected": rows,
        "error_detail": error,
        "started_at": (started or datetime.utcnow()).isoformat(),
        "finished_at": (finished or datetime.utcnow()).isoformat(),
    }
    _sync_history.insert(0, entry)
    # Se guarda en el master también
    try:
        conn = get_master_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sync_history
                (sync_type, status, tables_synced, rows_affected, error_detail, started_at, finished_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            entry["sync_type"], entry["status"], entry["tables_synced"],
            entry["rows_affected"], entry["error_detail"],
            started or datetime.utcnow(), finished or datetime.utcnow()
        ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"No se pudo guardar historial en master: {e}")

def get_sync_history(limit: int = 20) -> List[Dict]:
    return _sync_history[:limit]

#  SYNC-IN: de Master (PostgreSQL) a Slave (MySQL)
def sync_in() -> Dict[str, Any]:
    started = datetime.utcnow()
    mapping = load_mapping()
    tables_cfg = mapping["sync_in"]["tables"]
    total_rows = 0
    synced_tables = []
    errors = []

    # El orden procura que se mantenga la integridad referencial
    ordered_tables = [
        "language", "actor", "category", "country", "city", "address",
        "store", "staff", "film", "film_actor", "film_category", "inventory"
    ]

    try:
        master = get_master_conn()
        slave = get_slave_conn()
        m_cur = master.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        s_cur = slave.cursor()
        for tname in ordered_tables:
            cfg = tables_cfg.get(tname)
            if not cfg:
                continue

            master_table = cfg["master_table"]
            slave_table  = cfg["slave_table"]
            pk = cfg["primary_key"]
            field_map = cfg["fields"]
            master_fields = [v["master"] for v in field_map.values()]
            slave_fields = [v["slave"]  for v in field_map.values()]

            try:
                m_cur.execute(
                    f'SELECT {", ".join(chr(34)+f+chr(34) for f in master_fields)} '
                    f'FROM "{master_table}"'
                )
                rows = m_cur.fetchall()
                if not rows:
                    continue

                sql = build_upsert_mysql(slave_table, slave_fields, pk)
                batch = []
                for row in rows:
                    vals = tuple(normalize_value(row[f]) for f in master_fields)
                    batch.append(vals)

                s_cur.executemany(sql, batch)
                slave.commit()
                total_rows += len(batch)
                synced_tables.append(tname)
                logger.info(f"[SYNC-IN] {tname}: {len(batch)} filas copiadas.")

            except Exception as e:
                slave.rollback()
                err_msg = f"{tname}: {str(e)}"
                errors.append(err_msg)
                logger.error(f"[SYNC-IN] Error en tabla {err_msg}")
        m_cur.close(); master.close()
        s_cur.close(); slave.close()

    except Exception as e:
        errors.append(f"Conexion: {str(e)}")
        logger.error(f"[SYNC-IN] Error de conexion: {e}")
    finished = datetime.utcnow()
    status   = "success" if not errors else ("partial" if synced_tables else "error")
    record_sync("IN", status, synced_tables, total_rows,
                "; ".join(errors) if errors else None, started, finished)

    return {
        "status": status,
        "tables_synced": synced_tables,
        "rows_affected": total_rows,
        "errors": errors,
        "duration_ms": int((finished - started).total_seconds() * 1000),
    }

#  SYNC-OUT: del Slave (MySQL) a Master (PostgreSQL)
def sync_out() -> Dict[str, Any]:
    started = datetime.utcnow()
    mapping = load_mapping()
    tables_cfg = mapping["sync_out"]["tables"]
    total_rows = 0
    synced_tables = []
    errors = []
    out_order = ["customer", "rental", "payment"]
    try:
        master = get_master_conn()
        slave = get_slave_conn()
        m_cur = master.cursor()
        s_cur = slave.cursor(dictionary=True)

        for tname in out_order:
            cfg = tables_cfg.get(tname)
            if not cfg:
                continue

            log_table = cfg["log_table"]
            master_table = cfg["master_table"]
            pk = cfg["primary_key"]
            field_map = cfg["fields"]
            data_fields_slave = [v["slave"]  for v in field_map.values()]
            data_fields_master = [v["master"] for v in field_map.values()]

            try:
                s_cur.execute(
                    f"SELECT log_id, operation, "
                    + ", ".join(f"`{f}`" for f in data_fields_slave)
                    + f" FROM `{log_table}` WHERE synced = 0 ORDER BY log_id ASC"
                )
                log_rows = s_cur.fetchall()
                if not log_rows:
                    continue

                processed_log_ids = []
                for row in log_rows:
                    op = row["operation"]
                    log_id = row["log_id"]

                    try:
                        if op == "INSERT":
                            sql = build_upsert_pg(master_table, data_fields_master, pk)
                            vals = tuple(row[f] for f in data_fields_slave)
                            m_cur.execute(sql, vals)

                        elif op == "UPDATE":
                            sql = build_upsert_pg(master_table, data_fields_master, pk)
                            vals = tuple(row[f] for f in data_fields_slave)
                            m_cur.execute(sql, vals)

                        elif op == "DELETE":
                            pk_col = pk if isinstance(pk, str) else pk[0]
                            pk_field_slave = field_map[pk_col]["slave"]
                            m_cur.execute(
                                f'DELETE FROM "{master_table}" WHERE "{pk_col}" = %s',
                                (row[pk_field_slave],)
                            )

                        processed_log_ids.append(log_id)
                        total_rows += 1

                    except Exception as row_err:
                        master.rollback()
                        errors.append(f"{tname}[log_id={log_id}]: {str(row_err)}")
                        logger.error(f"[SYNC-OUT] Error fila: {row_err}")
                        master = get_master_conn()
                        m_cur  = master.cursor()
                master.commit()

                # Lo marca como synced y limpia
                if processed_log_ids:
                    ids_str = ",".join(str(i) for i in processed_log_ids)
                    s_cur.execute(f"UPDATE `{log_table}` SET synced = 1 WHERE log_id IN ({ids_str})")
                    s_cur.execute(f"DELETE FROM `{log_table}` WHERE synced = 1")
                    slave.commit()
                    synced_tables.append(tname)
                    logger.info(f"[SYNC-OUT] {tname}: {len(processed_log_ids)} operaciones subidas y log limpiado.")

            except Exception as e:
                slave.rollback()
                master.rollback()
                err_msg = f"{tname}: {str(e)}"
                errors.append(err_msg)
                logger.error(f"[SYNC-OUT] Error en tabla {err_msg}")
        m_cur.close(); master.close()
        s_cur.close(); slave.close()

    except Exception as e:
        errors.append(f"Conexion: {str(e)}")
        logger.error(f"[SYNC-OUT] Error de conexion: {e}")
    finished = datetime.utcnow()
    status = "success" if not errors else ("partial" if synced_tables else "error")

    record_sync("OUT", status, synced_tables, total_rows,
                "; ".join(errors) if errors else None, started, finished)

    return {
        "status": status,
        "tables_synced": synced_tables,
        "rows_affected": total_rows,
        "errors": errors,
        "duration_ms": int((finished - started).total_seconds() * 1000),
    }

#  STATUS: Mostrar las benditas estadisticas
def get_db_stats() -> Dict[str, Any]:
    stats = {
        "master": {"connected": False, "tables": {}},
        "slave": {"connected": False, "tables": {}},
    }
    try:
        conn = get_master_conn()
        cur = conn.cursor()
        for t in ["actor", "film", "inventory", "customer", "rental", "payment", "store"]:
            try:
                cur.execute(f'SELECT COUNT(*) FROM "{t}"')
                stats["master"]["tables"][t] = cur.fetchone()[0]
            except:
                stats["master"]["tables"][t] = -1
        cur.close(); conn.close()
        stats["master"]["connected"] = True
    except Exception as e:
        stats["master"]["error"] = str(e)
    try:
        conn = get_slave_conn()
        cur = conn.cursor(dictionary=True)
        for t in ["actor", "film", "inventory", "customer", "rental", "payment", "store",
                  "customer_log", "rental_log", "payment_log"]:
            try:
                cur.execute(f"SELECT COUNT(*) AS cnt FROM `{t}`")
                stats["slave"]["tables"][t] = cur.fetchone()["cnt"]
            except:
                stats["slave"]["tables"][t] = -1
        cur.close(); conn.close()
        stats["slave"]["connected"] = True
    except Exception as e:
        stats["slave"]["error"] = str(e)
    return stats