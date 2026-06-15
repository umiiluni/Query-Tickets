// ============================================================================
// PARTE 3: SERVICIO DE CACHÉ (NOMENCLATURA, TTL Y PATRÓN CACHE-ASIDE)
// PROYECTO: TICKET_QUERY - GESTIÓN DE EVENTOS
// ============================================================================

const { redisClient, checkRedisStatus } = require('../Setup-y-Robustez/setup-redis');

// ⏱️ CONFIGURACIÓN DE TTL (Time-To-Live en segundos) - Consistencia Eventual
const TTL_CONFIG = {
    EVENTOS_ACTIVOS: 120,      // 2 minutos (Tolerancia estricta según consigna)
    ESTRUCTURA_RECINTO: 300    // 5 minutos (Baja frecuencia de escritura estructural)
};

// 📝 NOMENCLATURA DE CLAVES (Keyspace Namespacing con estándar ":")
const KEY_PREFIXES = {
    EVENTOS: 'eventos',
    RECINTOS: 'recintos'
};

/**
 * Constructor dinámico de llaves jerárquicas para Redis
 * @param {string} prefix - Entidad base (eventos / recintos)
 * @param {string|number} [id] - Identificador específico (opcional)
 * @returns {string} Clave formateada (ej: "eventos:lista:activos" o "recintos:estructura:id:1")
 */
function buildKey(prefix, id) {
    if (prefix === KEY_PREFIXES.EVENTOS) {
        return id ? `${prefix}:id:${id}` : `${prefix}:lista:activos`;
    }
    if (prefix === KEY_PREFIXES.RECINTOS) {
        return id ? `${prefix}:estructura:id:${id}` : `${prefix}:lista`;
    }
    return id ? `${prefix}:${id}` : `${prefix}:list`;
}

/**
 * Obtener datos desde la Caché de Redis
 */
async function getFromCache(key) {
    if (!checkRedisStatus()) {
        return null; // Escudo Fallback: Si Redis está caído, deriva silenciosamente
    }

    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            console.log(`✅ [CACHE HIT]: Clave "${key}" encontrada en memoria RAM.`);
            return JSON.parse(cachedData);
        }
        console.log(`❌ [CACHE MISS]: Clave "${key}" no encontrada. Buscando en origen...`);
        return null;
    } catch (error) {
        console.error(`⚠️ Error al consultar caché para clave ${key}:`, error.message);
        return null;
    }
}

/**
 * Guardar datos en la Caché de Redis con un tiempo de expiración controlado
 */
async function setInCache(key, data, ttlSeconds) {
    if (!checkRedisStatus()) {
        return false;
    }

    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
        console.log(`💾 [CACHE SET]: Clave "${key}" guardada exitosamente con un TTL de ${ttlSeconds}s.`);
        return true;
    } catch (error) {
        console.error(`⚠️ Error al guardar en caché la clave ${key}:`, error.message);
        return false;
    }
}

/**
 * Invalidación manual de caché (Útil para mutaciones de datos por administración)
 */
async function invalidateCache(key) {
    if (!checkRedisStatus()) {
        return false;
    }

    try {
        await redisClient.del(key);
        console.log(`🗑️ [CACHE INVALIDATE]: Clave "${key}" eliminada de forma explícita.`);
        return true;
    } catch (error) {
        console.error(`⚠️ Error al invalidar caché para clave ${key}:`, error.message);
        return false;
    }
}

/**
 * Orquestador del Patrón Cache-Aside (Lazy Loading)
 * @param {string} entityType - Tipo de entidad (KEY_PREFIXES)
 * @param {string|number} id - Identificador o modificador de consulta
 * @param {Function} fetchFromDB - Callback con la Query asincrónica de PostgreSQL
 */
async function cacheAsideExample(entityType, id, fetchFromDB) {
    const key = buildKey(entityType, id);
    
    // 1. Intentar recuperar desde Redis
    let data = await getFromCache(key);

    // 2. [Cache HIT]: Si existía, romper el ciclo y devolver
    if (data) {
        return data;
    }

    // 3. [Cache MISS]: Ejecutar la consulta pesada en PostgreSQL
    data = await fetchFromDB();

    // 4. Población de la caché si la DB devolvió registros
    if (data) {
        let ttl;
        switch (entityType) {
            case KEY_PREFIXES.EVENTOS:
                ttl = TTL_CONFIG.EVENTOS_ACTIVOS;
                break;
            case KEY_PREFIXES.RECINTOS:
                ttl = TTL_CONFIG.ESTRUCTURA_RECINTO;
                break;
            default:
                ttl = 60; // TTL de resguardo por defecto (1 minuto)
        }
        
        await setInCache(key, data, ttl);
    }

    return data;
}

module.exports = {
    buildKey,
    getFromCache,
    setInCache,
    invalidateCache,
    cacheAsideExample,
    KEY_PREFIXES,
    TTL_CONFIG
};