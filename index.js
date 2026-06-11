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

// =============================================================================
// 8. GET /api/habilidades?partidaId=X
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
// 9. POST /api/partidas/:partidaId/habilidades/desbloquear
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
// =============================================================================
// 10. GET /api/mapas — Devuelve todos los mapas disponibles
// =============================================================================
app.get('/api/mapas', async (req, res) => {
  try {
    const result = await pool.query('SELECT mapa_id, nombre_mapa, nro_continentes, nro_paises FROM mapas ORDER BY mapa_id');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en GET /api/mapas:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// 11. GET /api/continentes?mapa_id=X — Devuelve continentes de un mapa
// =============================================================================
app.get('/api/continentes', async (req, res) => {
  const { mapa_id } = req.query;
  try {
    let query = 'SELECT continente_id, mapa_id, nombre_continente FROM continentes';
    const params = [];
    if (mapa_id) {
      query += ' WHERE mapa_id = $1';
      params.push(parseInt(mapa_id));
    }
    query += ' ORDER BY continente_id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error en GET /api/continentes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// 12. GET /api/paises-base — Devuelve todos los países base con datos geopolíticos
//     Opcionalmente filtra por ?continente_id=X
// =============================================================================
app.get('/api/paises-base', async (req, res) => {
  const { continente_id } = req.query;
  try {
    let query = `
      SELECT 
        pb.pais_id, pb.nombre_es, pb.continente_id,
        pb.poblacion_real_tierra, pb.gdp_per_capita_base,
        pb.ejercito_multiplicador,
        pb.pct_composicion_infanteria, pb.pct_composicion_caballeria, pb.pct_composicion_artilleria,
        pb.tasa_natalidad_diaria, pb.tasa_mortalidad_diaria,
        pb.multiplicador_reclutamiento, pb.multiplicador_pesadas,
        c.nombre_continente
      FROM paises_base pb
      JOIN continentes c ON pb.continente_id = c.continente_id
    `;
    const params = [];
    if (continente_id) {
      query += ' WHERE pb.continente_id = $1';
      params.push(parseInt(continente_id));
    }
    query += ' ORDER BY pb.continente_id, pb.pais_id';
    const result = await pool.query(query, params);

    // Mapeo para garantizar tipos numéricos correctos (pg devuelve NUMERIC como string)
    const paises = result.rows.map(row => ({
      pais_id:                      row.pais_id,
      nombre_es:                    row.nombre_es,
      continente_id:                row.continente_id,
      poblacion_real_tierra:        parseInt(row.poblacion_real_tierra),
      gdp_per_capita_base:          parseInt(row.gdp_per_capita_base),
      ejercito_multiplicador:       parseFloat(row.ejercito_multiplicador),
      pct_composicion_infanteria:   parseFloat(row.pct_composicion_infanteria),
      pct_composicion_caballeria:   parseFloat(row.pct_composicion_caballeria),
      pct_composicion_artilleria:   parseFloat(row.pct_composicion_artilleria),
      tasa_natalidad_diaria:        parseFloat(row.tasa_natalidad_diaria),
      tasa_mortalidad_diaria:       parseFloat(row.tasa_mortalidad_diaria),
      multiplicador_reclutamiento:  parseFloat(row.multiplicador_reclutamiento),
      multiplicador_pesadas:        parseFloat(row.multiplicador_pesadas),
      nombre_continente:            row.nombre_continente,
    }));

    res.json(paises);
  } catch (error) {
    console.error('❌ Error en GET /api/paises-base:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Conquest escuchando en http://localhost:${PORT}`);
  console.log(`📡 Endpoint de control de conexión:  http://localhost:${PORT}/api/status`);
  console.log(`🌲 Tech Tree:                         http://localhost:${PORT}/api/habilidades`);
  console.log(`🔓 Desbloquear habilidad:             POST http://localhost:${PORT}/api/partidas/:id/habilidades/desbloquear`);
  console.log(`🗺️  Países Base:                       http://localhost:${PORT}/api/paises-base`);
});
