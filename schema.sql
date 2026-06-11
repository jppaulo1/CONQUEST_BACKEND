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

--Tabla asociativa para los prerrequisitos (Muchos a Muchos autorreferenciada)
CREATE TABLE habilidad_prerrequisitos (
    habilidad_id VARCHAR(50) REFERENCES habilidades(habilidad_id) ON DELETE CASCADE,
    habilidad_requerida_id VARCHAR(50) REFERENCES habilidades(habilidad_id) ON DELETE CASCADE,
    PRIMARY KEY (habilidad_id, habilidad_requerida_id)
);

--Registro de qué partida tiene qué habilidad

CREATE TABLE partida_habilidades (
    partida_id INT NOT NULL,              -- ID de la partida
    habilidad_id VARCHAR(50) REFERENCES habilidades(habilidad_id) ON DELETE CASCADE,
    fecha_desbloqueo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (partida_id, habilidad_id)
);

-- Tipos de árbol
CREATE TABLE arbol_habilidades (
    arbol_id SERIAL PRIMARY KEY,
    nombre_arbol VARCHAR(50) NOT NULL UNIQUE
);
