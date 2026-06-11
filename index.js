const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuración del Pool de conexiones usando variables de entorno o valores por defecto
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'conquest_db',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// 1. Estado / Verificación de Conexión a la BD
app.get('/api/status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS database_time');
    res.json({
      status: 'ONLINE',
      message: 'Conexión a PostgreSQL establecida con éxito.',
      dbTime: result.rows[0].database_time,
    });
  } catch (error) {
    res.status(500).json({
      status: 'OFFLINE',
      message: 'Error al conectar con la base de datos PostgreSQL.',
      error: error.message,
    });
  }
});

// 2. Autenticación de Operarios (Login)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const query = `
      SELECT usuario_id AS id, username, correo AS email, nombre, pais, rango,
             to_char(fecha_registro, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "fechaRegistro"
      FROM usuarios 
      WHERE LOWER(username) = LOWER($1) AND password_hash = $2
    `;
    const result = await pool.query(query, [username, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: "CRED_INVALIDAS" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Registro de Nuevas Cuentas
app.post('/api/auth/register', async (req, res) => {
  const { username, email, nombre, pais, password } = req.body;
  try {
    const checkUser = await pool.query(
      'SELECT username, correo FROM usuarios WHERE LOWER(username) = LOWER($1) OR LOWER(correo) = LOWER($2)',
      [username, email]
    );
    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ success: false, error: "ID_TOMADO" });
      }
      return res.status(400).json({ success: false, error: "EMAIL_TOMADO" });
    }

    const insertQuery = `
      INSERT INTO usuarios (username, correo, nombre, pais, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING usuario_id AS id, username, correo AS email, nombre, pais, rango,
                to_char(fecha_registro, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "fechaRegistro"
    `;
    const result = await pool.query(insertQuery, [username, email, nombre, pais, password]);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Conquest escuchando en http://localhost:${PORT}`);
  console.log(`📡 Endpoint de control de conexión: http://localhost:${PORT}/api/status`);
});
