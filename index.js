const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuración del Pool de conexiones usando DATABASE_URL (para Supabase/Heroku) o parámetros individuales
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'conquest_db',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '5432'),
    };

// Supabase y otras bases de datos en la nube requieren conexiones seguras (SSL)
if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

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

// 4. Obtener Partidas Guardadas de un Operario
app.get('/api/saves', async (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ error: "Falta usuario_id" });
  }
  try {
    const query = `
      SELECT p.partida_id AS id, p.commander_id AS "commanderID", j.hq_pais_id AS hq,
             to_char(p.fecha_creacion, 'YYYY-MM-DD HH24:MI') AS "creationDate",
             to_char(p.ultima_vez_guardado, 'YYYY-MM-DD HH24:MI') AS "lastSaveDate",
             p.dias_campana AS "campaignDays", p.porcentaje_dominio AS "dominionPercent",
             j.oro AS budget, (j.tropas_infanteria + j.tropas_caballeria + j.tropas_artilleria) AS troops,
             j.tropas_infanteria, j.tropas_caballeria, j.tropas_artilleria, j.habilidad_puntos,
             COALESCE(t.velocidad, 1) AS velocidad, COALESCE(t.pausado, FALSE) AS pausado
      FROM partidas p
      JOIN jugadores j ON p.partida_id = j.partida_id
      LEFT JOIN tiempos t ON p.partida_id = t.partida_id
      WHERE j.usuario_id = $1 AND p.estado_activo = TRUE
      ORDER BY p.ultima_vez_guardado DESC
    `;
    const result = await pool.query(query, [usuario_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Inicializar Nueva Partida y Jugador
app.post('/api/saves', async (req, res) => {
  const { usuario_id, commander_id, hq_pais_id, oro, tropas_infanteria, tropas_caballeria, tropas_artilleria, velocidad, pausado } = req.body;
  
  if (!usuario_id || !commander_id || !hq_pais_id) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertPartida = `
      INSERT INTO partidas (commander_id, estado_activo, dias_campana, porcentaje_dominio)
      VALUES ($1, TRUE, 1, 0.0)
      RETURNING partida_id, commander_id, to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS "creationDate"
    `;
    const partidaResult = await client.query(insertPartida, [commander_id]);
    const newPartida = partidaResult.rows[0];

    const insertJugador = `
      INSERT INTO jugadores (usuario_id, partida_id, hq_pais_id, oro, habilidad_puntos, tropas_infanteria, tropas_caballeria, tropas_artilleria)
      VALUES ($1, $2, $3, $4, 0, $5, $6, $7)
      RETURNING jugador_id
    `;
    await client.query(insertJugador, [
      usuario_id,
      newPartida.partida_id,
      hq_pais_id,
      oro || 5000,
      tropas_infanteria || 5000,
      tropas_caballeria || 2000,
      tropas_artilleria || 500
    ]);

    // Inicializar record en la tabla tiempos
    const insertTiempos = `
      INSERT INTO tiempos (partida_id, dias_campana, velocidad, pausado)
      VALUES ($1, 1, $2, $3)
    `;
    await client.query(insertTiempos, [
      newPartida.partida_id,
      velocidad || 1,
      pausado !== undefined ? pausado : false
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      id: newPartida.partida_id,
      commanderID: newPartida.commander_id,
      hq: hq_pais_id,
      creationDate: newPartida.creationDate,
      lastSaveDate: newPartida.creationDate,
      campaignDays: 1,
      dominionPercent: 0.0,
      budget: oro || 5000,
      troops: (tropas_infanteria || 5000) + (tropas_caballeria || 2000) + (tropas_artilleria || 500),
      tropas_infanteria: tropas_infanteria || 5000,
      tropas_caballeria: tropas_caballeria || 2000,
      tropas_artilleria: tropas_artilleria || 500,
      habilidad_puntos: 0,
      velocidad: velocidad || 1,
      pausado: pausado !== undefined ? pausado : false
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 6. Guardar Estado de Partida Existente
app.put('/api/saves/:partida_id', async (req, res) => {
  const { partida_id } = req.params;
  const { dias_campana, porcentaje_dominio, oro, tropas_infanteria, tropas_caballeria, tropas_artilleria, habilidad_puntos, velocidad, pausado } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatePartida = `
      UPDATE partidas
      SET dias_campana = $1, porcentaje_dominio = $2, ultima_vez_guardado = NOW()
      WHERE partida_id = $3
    `;
    await client.query(updatePartida, [dias_campana, porcentaje_dominio, partida_id]);

    const updateJugador = `
      UPDATE jugadores
      SET oro = $1, tropas_infanteria = $2, tropas_caballeria = $3, tropas_artilleria = $4, habilidad_puntos = $5
      WHERE partida_id = $6
    `;
    await client.query(updateJugador, [
      oro,
      tropas_infanteria,
      tropas_caballeria,
      tropas_artilleria,
      habilidad_puntos,
      partida_id
    ]);

    // Actualizar la tabla tiempos
    const updateTiempos = `
      UPDATE tiempos
      SET dias_campana = $1, velocidad = $2, pausado = $3
      WHERE partida_id = $4
    `;
    const resultTiempos = await client.query(updateTiempos, [
      dias_campana,
      velocidad || 1,
      pausado !== undefined ? pausado : false,
      partida_id
    ]);

    if (resultTiempos.rowCount === 0) {
      await client.query(`
        INSERT INTO tiempos (partida_id, dias_campana, velocidad, pausado)
        VALUES ($1, $2, $3, $4)
      `, [partida_id, dias_campana, velocidad || 1, pausado !== undefined ? pausado : false]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Partida guardada correctamente." });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 7. Eliminar Partida
app.delete('/api/saves/:partida_id', async (req, res) => {
  const { partida_id } = req.params;
  try {
    await pool.query('DELETE FROM partidas WHERE partida_id = $1', [partida_id]);
    res.json({ success: true, message: "Partida eliminada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Conquest escuchando en http://localhost:${PORT}`);
  console.log(`📡 Endpoint de control de conexión: http://localhost:${PORT}/api/status`);
});
