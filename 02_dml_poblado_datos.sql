-- Ajustar la secuencia de ID de partidas tras la inserción manual con IDs fijos
SELECT
    setval (
        'partidas_partida_id_seq',
        (
            SELECT
                MAX(partida_id)
            FROM
                partidas
        )
    );

-- Poblado de datos iniciales para la tabla jugadores (5 registros vinculados)
INSERT INTO
    jugadores (
        usuario_id,
        partida_id,
        hq_pais_id,
        oro,
        habilidad_puntos,
        tropas_infanteria,
        tropas_caballeria,
        tropas_artilleria
    )
VALUES
    (
        1,
        1,
        'Estados Unidos',
        125000,
        3,
        30000,
        10000,
        5000
    ),
    (2, 2, 'Alemania', 84000, 2, 20000, 6000, 2000),
    (3, 3, 'Japón', 310000, 7, 80000, 20000, 12000),
    (4, 4, 'México', 50000, 1, 10000, 4000, 1000),
    (
        5,
        5,
        'Reino Unido',
        500000,
        12,
        120000,
        40000,
        20000
    );

-- Poblado de datos iniciales para la tabla tiempos (5 registros)
INSERT INTO
    tiempos (partida_id, dias_campana, velocidad, pausado)
VALUES
    (1, 14, 1, FALSE),
    (2, 10, 1, FALSE),
    (3, 25, 2, TRUE),
    (4, 5, 1, FALSE),
    (5, 45, 2, FALSE);

-- =============================================
-- SEED DATA: mapas, continentes, paises_base
-- =============================================
-- Mapa principal
INSERT INTO
    mapas (mapa_id, nombre_mapa, nro_continentes, nro_paises)
VALUES
    (1, 'Tierra Clásica', 6, 190);

SELECT
    setval (
        'mapas_mapa_id_seq',
        (
            SELECT
                MAX(mapa_id)
            FROM
                mapas
        )
    );

-- Continentes
INSERT INTO
    continentes (continente_id, mapa_id, nombre_continente)
VALUES
    (1, 1, 'América del Norte y Central'),
    (2, 1, 'América del Sur'),
    (3, 1, 'Europa'),
    (4, 1, 'Asia'),
    (5, 1, 'África'),
    (6, 1, 'Oceanía');

SELECT
    setval (
        'continentes_continente_id_seq',
        (
            SELECT
                MAX(continente_id)
            FROM
                continentes
        )
    );