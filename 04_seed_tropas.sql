-- ============================================================
-- SCRIPT DE POBLADO: 04_seed_tropas.sql
-- Inserción de tropas base y sincronización de secuencia
-- ============================================================

-- Limpiar datos previos si existen (gracias a CASCADE se limpian las tablas hijas)
TRUNCATE TABLE tropas CASCADE;

-- 1. Insertar Tropas Maestras
INSERT INTO tropas (tropa_id, nombre_tropa, costo_base, multiplicador_combate) VALUES
(1, 'Cibersoldado de Asalto', 15, 1.0),
(2, 'Guardia de Neo-Tokio', 25, 1.2),
(3, 'Motorista de Asalto Cyber', 45, 1.5),
(4, 'Nómada del Desierto', 60, 1.8),
(5, 'Cañón de Plasma Pesado', 120, 3.0),
(6, 'Meca de Asedio Goliath', 250, 4.0);

-- 2. Insertar en tabla hija: Infanterías (bono_defensa_trinchera)
INSERT INTO infanterias (tropa_id, bono_defensa_trinchera) VALUES
(1, 1.5),
(2, 2.0);

-- 3. Insertar en tabla hija: Caballerías (bono_ataque_flanqueo)
INSERT INTO caballerias (tropa_id, bono_ataque_flanqueo) VALUES
(3, 2.5),
(4, 3.5);

-- 4. Insertar en tabla hija: Artillerías (bono_perforacion_plasma)
INSERT INTO artillerias (tropa_id, bono_perforacion_plasma) VALUES
(5, 4.5),
(6, 6.0);

-- 5. Sincronizar la secuencia de la llave primaria para evitar errores en futuros inserts manuales
SELECT setval('tropas_tropa_id_seq', (SELECT COALESCE(MAX(tropa_id), 1) FROM tropas));
