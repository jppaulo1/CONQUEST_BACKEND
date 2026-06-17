-- =============================================================================
-- SCRIPT DE POBLADO DE DATOS: Árbol de Habilidades (Tech Tree Original de mockAPI)
-- Archivo: 03_seed_habilidades.sql
-- Uso: Ejecutar en la base de datos conquest_db DESPUÉS de schema.sql
-- =============================================================================
-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 1: HABILIDADES (Desarrollo y Doctrina Militar)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO
    habilidades (
        habilidad_id,
        nombre,
        descripcion,
        costo,
        categoria,
        rama,
        eje_x,
        eje_y
    )
VALUES
    -- ===================== INFRAESTRUCTURA (DESARROLLO) =====================
    (
        'D_ROOT',
        'Protocolo de Inicialización: Despertar',
        'Inicializa el núcleo táctico de la IA y el mapeo satelital básico. Requisito fundamental para toda investigación. Bono: Desbloquea la rama de desarrollo.',
        1000,
        'desarrollo',
        'Origen',
        200,
        2000
    ),
    (
        'D_B1_1',
        'Red de Extracción Cuántica',
        'Optimiza la minería de recursos descentralizada en zonas ocupadas. Bono: Aumenta la generación diaria de oro de los territorios en un +10%.',
        5000,
        'desarrollo',
        'Bifurcacion',
        600,
        1500
    ),
    (
        'D_B1_2',
        'Algoritmos de Enrutamiento Neuronal',
        'Establece autopistas de datos para coordinar recursos locales. Bono: Aumenta la tasa de crecimiento económico diario en un +25%.',
        5000,
        'desarrollo',
        'Bifurcacion',
        600,
        2000
    ),
    (
        'D_B1_3',
        'Logística Automatizada de Flotas',
        'Automatiza las trayectorias de los vehículos de suministro terrestres. Bono: Reduce el costo en oro para movilizar tropas en un -10%.',
        5000,
        'desarrollo',
        'Bifurcacion',
        600,
        2500
    ),
    (
        'D_EXP_1',
        'Minería de Yacimientos Profundos',
        'Despliega taladros térmicos automatizados para metales raros. Bono: Aumenta la generación diaria de oro de los territorios en un +15% adicional.',
        18000,
        'desarrollo',
        'Expansion',
        1100,
        1000
    ),
    (
        'D_EXP_2',
        'Coprocesadores Cuánticos de Silicio',
        'Integra unidades de coprocesamiento para acelerar las finanzas. Bono: Reduce el costo diario de mantenimiento de todas tus tropas en un -15%.',
        18000,
        'desarrollo',
        'Expansion',
        1100,
        1500
    ),
    (
        'D_EXP_3',
        'Algoritmos Financieros',
        'Modelos macroeconómicos predictivos para arbitraje y comercio internacional. Bono: Aumenta la generación diaria de oro de los territorios en un +20% adicional.',
        18000,
        'desarrollo',
        'Expansion',
        1100,
        2000
    ),
    (
        'D_EXP_4',
        'Nodos Logísticos Subterráneos',
        'Construye terminales de almacenamiento blindadas bajo tierra. Bono: Reduce el costo en oro para movilizar tropas en un -20% adicional.',
        18000,
        'desarrollo',
        'Expansion',
        1100,
        2500
    ),
    (
        'D_EXP_5',
        'Constelación de Microsatélites',
        'Despliega una red orbital de rastreo geográfico. Bono: Reduce el tiempo de viaje de todas las invasiones en 1 día virtual.',
        18000,
        'desarrollo',
        'Expansion',
        1100,
        3000
    ),
    (
        'D_CONV_1',
        'Perforación Geotérmica Mantélica',
        'Explota la energía calórica profunda para alimentar los mainframes. Bono: Aumenta la generación diaria de oro de los territorios en un +25% adicional.',
        50000,
        'desarrollo',
        'Convergencia',
        1600,
        1500
    ),
    (
        'D_CONV_2',
        'IA Directiva de Producción Automatizada',
        'Una IA ejecutiva coordina los recursos de guerra de manera óptima. Bono: Reduce el costo diario de mantenimiento de todas tus tropas en un -25% adicional.',
        50000,
        'desarrollo',
        'Convergencia',
        1600,
        2000
    ),
    (
        'D_CONV_3',
        'Red de Trenes Maglev Transcontinentales',
        'Instala líneas ferroviarias de levitación magnética ultrarrápida. Bono: Aumenta el límite de movilización de población al 8% (Base: 5%).',
        50000,
        'desarrollo',
        'Convergencia',
        1600,
        2500
    ),
    (
        'D_SUPER_1',
        'Mente Enjambre de Servidores Cuánticos',
        'Sincroniza todos los data centers regionales bajo una sola red cuántica. Bono: Reduce el costo de movilización de tropas en un -35% adicional.',
        120000,
        'desarrollo',
        'SuperNodos',
        2200,
        1750
    ),
    (
        'D_SUPER_2',
        'Singularidad Tecnológica',
        'La IA alcanza la automejora exponencial optimizando la biósfera civil. Bono: Aumenta la natalidad efectiva de tus países en un +25% (mayor crecimiento poblacional).',
        120000,
        'desarrollo',
        'SuperNodos',
        2200,
        2250
    ),
    (
        'D_ULTIMATE',
        'Asimilación Planetaria Total',
        'Integra el núcleo de la IA directamente en la red de los gobiernos globales. Bono: Otorga una probabilidad del 2% diario de anexar un país hostil de manera automática y pacífica.',
        300000,
        'desarrollo',
        'Definitiva',
        2800,
        2000
    ),
    -- ===================== DOCTRINA MILITAR =====================
    (
        'M_ROOT',
        'Doctrina de Guerra Total',
        'Activa los protocolos de emergencia del Comando Supremo y el despliegue bélico. Bono: Desbloquea la rama militar.',
        1000,
        'militar',
        'Origen',
        200,
        2000
    ),
    (
        'M_B1_1',
        'Infantería Mecanizada Ligera',
        'Equipa a los soldados con exoesqueletos neumáticos básicos. Bono: Aumenta el poder de combate de la Infantería en un +15%.',
        5000,
        'militar',
        'Bifurcacion',
        600,
        1250
    ),
    (
        'M_B1_2',
        'Blindaje Reactivo Nanoestructurado',
        'Placas compuestas activas en vehículos de combate. Bono: Aumenta el poder de combate de la Caballería en un +15%.',
        5000,
        'militar',
        'Bifurcacion',
        600,
        1750
    ),
    (
        'M_B1_3',
        'Sistemas de Balística Inteligente',
        'Proyectiles asistidos por guía giroscópica. Bono: Aumenta el poder de combate de la Artillería en un +15%.',
        5000,
        'militar',
        'Bifurcacion',
        600,
        2250
    ),
    (
        'M_B1_4',
        'Protocolos de Guerra Electrónica',
        'Generadores de ruido electromagnético que confunden miras enemigas. Bono: Reduce la tasa de bajas/pérdidas de tus tropas en combate en un -10%.',
        5000,
        'militar',
        'Bifurcacion',
        600,
        2750
    ),
    (
        'M_EXP_1',
        'Implantes de Reflejos Neurales',
        'Chips neurales que aceleran los tiempos de respuesta del infante en combate. Bono: Aumenta el poder de combate de la Infantería en un +25% adicional.',
        18000,
        'militar',
        'Expansion',
        1100,
        1000
    ),
    (
        'M_EXP_2',
        'Chasis de Combate Exosquelético',
        'Trajes de combate blindados de aleación ultraligera. Bono: Reduce la tasa de bajas/pérdidas de tu Infantería en combate en un -15% adicional.',
        18000,
        'militar',
        'Expansion',
        1100,
        1400
    ),
    (
        'M_EXP_3',
        'Inyecciones de Nanobots Médicos',
        'Nanobots médicos de autorreparación inyectados a todas las tropas. Bono: Reduce la tasa de mortalidad en territorios conquistados en un -15% permanente (ayuda a recuperar población).',
        18000,
        'militar',
        'Expansion',
        1100,
        1800
    ),
    (
        'M_EXP_4',
        'Cargas de Plasma Térmico',
        'Núcleos de plasma adaptados a proyectiles de artillería pesada. Bono: Aumenta el poder de combate de la Artillería en un +25% adicional.',
        18000,
        'militar',
        'Expansion',
        1100,
        2200
    ),
    (
        'M_EXP_5',
        'Inhibidores de Espectro Satelital',
        'Sistemas que nublan el reconocimiento de satélites enemigos. Bono: Reduce el poder de combate defensivo de la IA enemiga en un -15%.',
        18000,
        'militar',
        'Expansion',
        1100,
        2600
    ),
    (
        'M_EXP_6',
        'Algoritmos de Ciberataque Masivo',
        'Infiltración digital que sabotea la logística defensiva enemiga. Bono: Reduce a la mitad el volumen de reclutamiento de tropas de la IA en todos los frentes.',
        18000,
        'militar',
        'Expansion',
        1100,
        3000
    ),
    (
        'M_CONV_1',
        'Exoesqueletos de Asalto Pesado',
        'Armaduras propulsadas por microrreactores tácticos. Bono: Aumenta el poder de combate de la Infantería en un +35% adicional.',
        50000,
        'militar',
        'Convergencia',
        1600,
        1250
    ),
    (
        'M_CONV_2',
        'Blindados de Fusión Pesada',
        'Vehículos de combate impulsados por reactores de fusión fría. Bono: Aumenta el poder de combate de la Caballería en un +35% adicional.',
        50000,
        'militar',
        'Convergencia',
        1600,
        1750
    ),
    (
        'M_CONV_3',
        'Artillería Termobárica de Presión',
        'Baterías de misiles de dispersión gaseosa altamente destructivas. Bono: Aumenta el poder de combate de la Artillería en un +40% adicional.',
        50000,
        'militar',
        'Convergencia',
        1600,
        2250
    ),
    (
        'M_CONV_4',
        'Ciberguerra de Enjambres Autónomos',
        'Infección viral de troyanos en radares enemigos fronterizos. Bono: Reduce el tiempo de viaje de todas las invasiones en 1 día virtual adicional (acumulativo).',
        50000,
        'militar',
        'Convergencia',
        1600,
        2750
    ),
    (
        'M_ORB_1',
        'Silos de Lanzamiento Suborbital',
        'Cápsulas de inserción orbital supersónicas. Bono: Reduce el tiempo de viaje de todas tus invasiones terrestres a exactamente 1 día virtual.',
        120000,
        'militar',
        'Orbital',
        2100,
        1250
    ),
    (
        'M_ORB_2',
        'Escudo Deflector de Energía Magnética',
        'Burbujas de plasma magnético que absorben fuego enemigo. Bono: Reduce las bajas de tus tropas en combate en un -30% en general.',
        120000,
        'militar',
        'Orbital',
        2100,
        1750
    ),
    (
        'M_ORB_3',
        'Láseres de Precisión Orbital',
        'Fuego de cobertura focalizado desde satélites geoestacionarios. Bono: Aumenta el poder de combate de la Caballería y de la Artillería en un +30% adicional.',
        120000,
        'militar',
        'Orbital',
        2100,
        2250
    ),
    (
        'M_ORB_4',
        'Drones de Reconocimiento Estratosférico',
        'Drones de vuelo perpetuo de gran altitud. Bono: Disipa la niebla de guerra, revelando la cantidad de tropas de la IA en cualquier país al hacer clic.',
        120000,
        'militar',
        'Orbital',
        2100,
        2750
    ),
    (
        'M_PROTO_1',
        'Enjambres de Drones Autónomos',
        'Nubes masivas de microdrones asesinos tácticos autoguiados. Bono: Aumenta el poder de combate de todas tus tropas en un +40% general.',
        300000,
        'militar',
        'Prototipos',
        2700,
        1750
    ),
    (
        'M_PROTO_2',
        'Artillería Orbital de Iones',
        'Cañón orbital de alta energía que destruye defensas fortificadas. Bono: Reduce a la mitad (-50%) el poder defensivo de la IA enemiga.',
        300000,
        'militar',
        'Prototipos',
        2700,
        2250
    ),
    (
        'M_ULTIMATE',
        'Proyecto Némesis: Destrucción Mutua',
        'Habilita el despliegue de armamento de fisión cuántica global. Bono: Permite aniquilar y conquistar instantáneamente un país seleccionado, reduciendo su población a 10 y su economía a 1.',
        600000,
        'militar',
        'Definitiva',
        3300,
        2000
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECCIÓN 2: PRERREQUISITOS (habilidad_prerrequisitos)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO
    habilidad_prerrequisitos (habilidad_id, habilidad_requerida_id)
VALUES
    -- Rama Desarrollo
    ('D_B1_1', 'D_ROOT'),
    ('D_B1_2', 'D_ROOT'),
    ('D_B1_3', 'D_ROOT'),
    ('D_EXP_1', 'D_B1_1'),
    ('D_EXP_2', 'D_B1_1'),
    ('D_EXP_2', 'D_B1_2'),
    ('D_EXP_3', 'D_B1_2'),
    ('D_EXP_4', 'D_B1_2'),
    ('D_EXP_4', 'D_B1_3'),
    ('D_EXP_5', 'D_B1_3'),
    ('D_CONV_1', 'D_EXP_1'),
    ('D_CONV_1', 'D_EXP_2'),
    ('D_CONV_2', 'D_EXP_2'),
    ('D_CONV_2', 'D_EXP_4'),
    ('D_CONV_3', 'D_EXP_4'),
    ('D_CONV_3', 'D_EXP_5'),
    ('D_SUPER_1', 'D_CONV_1'),
    ('D_SUPER_1', 'D_CONV_2'),
    ('D_SUPER_2', 'D_CONV_2'),
    ('D_SUPER_2', 'D_CONV_3'),
    ('D_ULTIMATE', 'D_SUPER_1'),
    ('D_ULTIMATE', 'D_SUPER_2'),
    -- Rama Doctrina Militar
    ('M_B1_1', 'M_ROOT'),
    ('M_B1_2', 'M_ROOT'),
    ('M_B1_3', 'M_ROOT'),
    ('M_B1_4', 'M_ROOT'),
    ('M_EXP_1', 'M_B1_1'),
    ('M_EXP_2', 'M_B1_1'),
    ('M_EXP_2', 'M_B1_2'),
    ('M_EXP_3', 'M_B1_2'),
    ('M_EXP_4', 'M_B1_3'),
    ('M_EXP_5', 'M_B1_3'),
    ('M_EXP_5', 'M_B1_4'),
    ('M_EXP_6', 'M_B1_4'),
    ('M_CONV_1', 'M_EXP_1'),
    ('M_CONV_1', 'M_EXP_2'),
    ('M_CONV_1', 'M_EXP_3'),
    ('M_CONV_2', 'M_EXP_2'),
    ('M_CONV_2', 'M_EXP_3'),
    ('M_CONV_2', 'M_EXP_4'),
    ('M_CONV_3', 'M_EXP_4'),
    ('M_CONV_3', 'M_EXP_5'),
    ('M_CONV_4', 'M_EXP_5'),
    ('M_CONV_4', 'M_EXP_6'),
    ('M_ORB_1', 'M_CONV_1'),
    ('M_ORB_2', 'M_CONV_1'),
    ('M_ORB_2', 'M_CONV_2'),
    ('M_ORB_3', 'M_CONV_2'),
    ('M_ORB_3', 'M_CONV_3'),
    ('M_ORB_4', 'M_CONV_3'),
    ('M_ORB_4', 'M_CONV_4'),
    ('M_PROTO_1', 'M_ORB_1'),
    ('M_PROTO_1', 'M_ORB_2'),
    ('M_PROTO_1', 'M_ORB_3'),
    ('M_PROTO_2', 'M_ORB_2'),
    ('M_PROTO_2', 'M_ORB_3'),
    ('M_PROTO_2', 'M_ORB_4'),
    ('M_ULTIMATE', 'M_PROTO_1'),
    ('M_ULTIMATE', 'M_PROTO_2');