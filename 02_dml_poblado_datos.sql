-- Poblado de datos iniciales para la tabla usuarios
INSERT INTO usuarios (correo, username, nombre, pais, password_hash, rango) VALUES 
('general.kenobi@republica.com', 'KENOBI', 'Obi-Wan Kenobi', 'Reino Unido', 'contrasenaSegura123', 'COMANDANTE SUPREMO'),
('m.gomez@correo.com', 'MGOMEZ', 'María Gómez', 'España', 'admin456', 'OPERARIO DE ÉLITE'),
('jugador_elite@gaming.net', 'ELITE_CARLOS', 'Carlos Ruiz', 'México', 'qwerty789', 'OPERARIO EXPERTO'),
('valeria.silva@correo.com', 'VALE_JUEGOS', 'Valeria Silva', 'Argentina', 'valejuegos45', 'OPERARIO NOVATO'),
('arthur.pendragon@reino.com', 'PENDRAGON', 'Arturo Pendragon', 'Reino Unido', 'excalibur123', 'OPERARIO NOVATO');

-- Poblado de datos iniciales para la tabla partidas (5 registros basados en MockAPI)
INSERT INTO partidas (partida_id, commander_id, estado_activo, dias_campana, porcentaje_dominio, fecha_creacion, ultima_vez_guardado) VALUES
(1, 'OMEGA-PROTOCOL-01', TRUE, 14, 32.50, '2027-05-01 08:30:00+00', '2027-05-15 22:45:00+00'),
(2, 'NEXUS-COMMANDER-09', TRUE, 10, 15.20, '2027-04-10 12:15:00+00', '2027-04-20 18:33:00+00'),
(3, 'SHADOW-OPERATOR-X', TRUE, 25, 68.90, '2027-05-18 19:00:00+00', '2027-06-02 01:10:00+00'),
(4, 'ALPHA-STRIKER-04', TRUE, 5, 8.40, '2027-06-01 10:00:00+00', '2027-06-05 14:20:00+00'),
(5, 'EXCALIBUR-PRIME', TRUE, 45, 90.00, '2027-05-01 09:00:00+00', '2027-06-10 17:40:00+00');

-- Ajustar la secuencia de ID de partidas tras la inserción manual con IDs fijos
SELECT setval('partidas_partida_id_seq', (SELECT MAX(partida_id) FROM partidas));

-- Poblado de datos iniciales para la tabla jugadores (5 registros vinculados)
INSERT INTO jugadores (usuario_id, partida_id, hq_pais_id, oro, habilidad_puntos, tropas_infanteria, tropas_caballeria, tropas_artilleria) VALUES
(1, 1, 'Estados Unidos', 125000, 3, 30000, 10000, 5000),
(2, 2, 'Alemania', 84000, 2, 20000, 6000, 2000),
(3, 3, 'Japón', 310000, 7, 80000, 20000, 12000),
(4, 4, 'México', 50000, 1, 10000, 4000, 1000),
(5, 5, 'Reino Unido', 500000, 12, 120000, 40000, 20000);

-- Poblado de datos iniciales para la tabla tiempos (5 registros)
INSERT INTO tiempos (partida_id, dias_campana, velocidad, pausado) VALUES
(1, 14, 1, FALSE),
(2, 10, 1, FALSE),
(3, 25, 2, TRUE),
(4, 5, 1, FALSE),
(5, 45, 2, FALSE);