CREATE TABLE habilidades (
    habilidad_id VARCHAR(50) PRIMARY KEY, -- Ej: 'mil_inf_1', 'des_eco_2'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    costo INT NOT NULL,
    categoria VARCHAR(30) NOT NULL,       -- 'militar' o 'desarrollo'
    rama VARCHAR(50) NOT NULL,            -- 'Infantería', 'Economía', 'Tácticas'
    eje_x INT NOT NULL,                   -- Coordenadas para el Front
    eje_y INT NOT NULL
);