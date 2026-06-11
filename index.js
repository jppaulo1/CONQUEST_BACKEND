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

// =============================================================================
// 4. GET /api/habilidades?partidaId=X
//    Devuelve el árbol de habilidades completo.
//    Si se pasa ?partidaId=X, añade el flag `desbloqueada` (true/false) por habilidad.
// =============================================================================
app.get('/api/habilidades', async (req, res) => {
  const { partidaId } = req.query;

  try {
    let query;
    let params = [];

    if (partidaId) {
      // Con partida: LEFT JOIN para saber si la partida ya desbloqueó cada habilidad
      query = `
        SELECT
          h.habilidad_id                                        AS id,
          h.nombre,
          h.descripcion,
          h.costo,
          h.categoria,
          h.rama,
          h.eje_x                                              AS x,
          h.eje_y                                              AS y,
          COALESCE(
            ARRAY_AGG(hp.habilidad_requerida_id) FILTER (WHERE hp.habilidad_requerida_id IS NOT NULL),
            '{}'
          )                                                    AS prerrequisitos,
          (ph.habilidad_id IS NOT NULL)                        AS desbloqueada
        FROM habilidades h
        LEFT JOIN habilidad_prerrequisitos hp
               ON h.habilidad_id = hp.habilidad_id
        LEFT JOIN partida_habilidades ph
               ON h.habilidad_id = ph.habilidad_id
              AND ph.partida_id  = $1
        GROUP BY h.habilidad_id, h.nombre, h.descripcion, h.costo,
                 h.categoria, h.rama, h.eje_x, h.eje_y, ph.habilidad_id
        ORDER BY h.categoria, h.eje_x, h.eje_y
      `;
      params = [parseInt(partidaId)];
    } else {
      // Sin partida: todas las habilidades con desbloqueada = false
      query = `
        SELECT
          h.habilidad_id                                        AS id,
          h.nombre,
          h.descripcion,
          h.costo,
          h.categoria,
          h.rama,
          h.eje_x                                              AS x,
          h.eje_y                                              AS y,
          COALESCE(
            ARRAY_AGG(hp.habilidad_requerida_id) FILTER (WHERE hp.habilidad_requerida_id IS NOT NULL),
            '{}'
          )                                                    AS prerrequisitos,
          FALSE                                                AS desbloqueada
        FROM habilidades h
        LEFT JOIN habilidad_prerrequisitos hp
               ON h.habilidad_id = hp.habilidad_id
        GROUP BY h.habilidad_id, h.nombre, h.descripcion, h.costo,
                 h.categoria, h.rama, h.eje_x, h.eje_y
        ORDER BY h.categoria, h.eje_x, h.eje_y
      `;
    }

    const result = await pool.query(query, params);

    // Mapeo explícito para garantizar los tipos correctos que espera el frontend
    const habilidades = result.rows.map(row => ({
      id:             row.id,
      nombre:         row.nombre,
      descripcion:    row.descripcion,
      costo:          row.costo,
      categoria:      row.categoria,
      rama:           row.rama,
      x:              row.x,
      y:              row.y,
      prerrequisitos: row.prerrequisitos,        // ya es un array de strings por ARRAY_AGG
      desbloqueada:   Boolean(row.desbloqueada), // garantizar booleano true/false
      enDesarrollo:   false,                     // estado local de UI, siempre false al cargar
      tiempoRestante: null,                      // idem
    }));

    res.json(habilidades);
  } catch (error) {
    console.error('❌ Error en GET /api/habilidades:', error.message);
    res.status(500).json({ error: 'Error interno al obtener el árbol de habilidades.', detail: error.message });
  }
});


// =============================================================================
// 5. POST /api/partidas/:partidaId/habilidades/desbloquear
//    Body: { habilidadId: string }
//    Valida reglas de negocio y registra el desbloqueo en partida_habilidades.
// =============================================================================
app.post('/api/partidas/:partidaId/habilidades/desbloquear', async (req, res) => {
  const { partidaId } = req.params;
  const { habilidadId } = req.body;

  // Validación básica de request
  if (!habilidadId || typeof habilidadId !== 'string' || habilidadId.trim() === '') {
    return res.status(400).json({ success: false, error: 'Se requiere el campo habilidadId en el cuerpo de la solicitud.' });
  }

  const partidaIdInt = parseInt(partidaId);
  if (isNaN(partidaIdInt)) {
    return res.status(400).json({ success: false, error: 'El partidaId debe ser un número entero válido.' });
  }

  try {
    // ── VALIDACIÓN 1: La habilidad debe existir en el catálogo ──────────────
    const existeHabilidad = await pool.query(
      'SELECT habilidad_id FROM habilidades WHERE habilidad_id = $1',
      [habilidadId]
    );
    if (existeHabilidad.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `La habilidad '${habilidadId}' no existe en el catálogo.`
      });
    }

    // ── VALIDACIÓN 2: La partida no debe tener ya esa habilidad ─────────────
    const yaDesbloqueada = await pool.query(
      'SELECT 1 FROM partida_habilidades WHERE partida_id = $1 AND habilidad_id = $2',
      [partidaIdInt, habilidadId]
    );
    if (yaDesbloqueada.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `La habilidad '${habilidadId}' ya está desbloqueada en esta partida.`
      });
    }

    // ── VALIDACIÓN 3: Todos los prerrequisitos deben estar desbloqueados ─────
    // Subconsulta: obtiene los prerreqs de la habilidad que NO están en la partida
    const prereqsFaltantes = await pool.query(
      `
      SELECT hp.habilidad_requerida_id
      FROM   habilidad_prerrequisitos hp
      WHERE  hp.habilidad_id = $1
        AND  hp.habilidad_requerida_id NOT IN (
               SELECT ph.habilidad_id
               FROM   partida_habilidades ph
               WHERE  ph.partida_id = $2
             )
      `,
      [habilidadId, partidaIdInt]
    );

    if (prereqsFaltantes.rows.length > 0) {
      const faltantes = prereqsFaltantes.rows.map(r => r.habilidad_requerida_id);
      return res.status(400).json({
        success: false,
        error: `No se puede desbloquear '${habilidadId}'. Prerrequisitos pendientes: [${faltantes.join(', ')}].`
      });
    }

    // ── ACCIÓN: Registrar el desbloqueo ─────────────────────────────────────
    const insertResult = await pool.query(
      `INSERT INTO partida_habilidades (partida_id, habilidad_id)
       VALUES ($1, $2)
       RETURNING partida_id, habilidad_id, fecha_desbloqueo`,
      [partidaIdInt, habilidadId]
    );

    const registro = insertResult.rows[0];
    res.status(201).json({
      success: true,
      message: `Habilidad '${habilidadId}' desbloqueada con éxito.`,
      data: {
        partidaId:       registro.partida_id,
        habilidadId:     registro.habilidad_id,
        fechaDesbloqueo: registro.fecha_desbloqueo,
      }
    });

  } catch (error) {
    console.error('❌ Error en POST /api/partidas/:partidaId/habilidades/desbloquear:', error.message);
    res.status(500).json({ success: false, error: 'Error interno al intentar desbloquear la habilidad.', detail: error.message });
  }
});


// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Conquest escuchando en http://localhost:${PORT}`);
  console.log(`📡 Endpoint de control de conexión:  http://localhost:${PORT}/api/status`);
  console.log(`🌲 Tech Tree:                         http://localhost:${PORT}/api/habilidades`);
  console.log(`🔓 Desbloquear habilidad:             POST http://localhost:${PORT}/api/partidas/:id/habilidades/desbloquear`);
});
