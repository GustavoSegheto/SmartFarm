// NodeJS/config/conexao.js
"use strict";

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",        // ajuste se necessário
  password: "root",    // ajuste se necessário
  database: "farm_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    //console.log("[DB] Conexão com farm_db OK");
    conn.release();
  } catch (err) {
    console.error("[DB] ERRO ao conectar no MySQL:", err.message);
  }
}

testConnection();

async function query(sql, params = []) {
  return pool.execute(sql, params);
}

module.exports = { pool, query };
