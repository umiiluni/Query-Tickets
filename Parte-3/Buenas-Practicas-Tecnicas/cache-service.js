// ============================================================================
// PARTE 3: BUENAS PRÁCTICAS TÉCNICAS (NOMENCLATURA Y TTL)
// INTEGRANTE: [Tu nombre aquí]
// ============================================================================

const { redisClient, checkRedisStatus } = require('../Setup-y-Robustez/setup-redis');

// CONFIGURACIÓN DE TTL (Time-To-Live)
const TTL_CONFIG = {
    TICKET_CATEGORIES: 300,    // 5 minutos
    TICKET_STATUSES: 600,      // 10 minutos
    USER_PROFILES: 120,        // 2 minutos
    TICKET_LIST: 180           // 3 minutos
};

// NOMENCLATURA DE CLAVES (Keyspace Namespacing)
const KEY_PREFIXES = {
    TICKET: 'tickets',
    CATEGORY: 'categories',
    STATUS: 'statuses',
    USER: 'users'
};

function buildKey(prefix, id) {
    if (id) {
        return `${prefix}:${id}`;
    }
    return `${prefix}:list`;
}

async function getFromCache(key) {
    if (!checkRedisStatus()) {
        return null;
    }

    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            console.log(`✅ [CACHE HIT]: Clave ${key} encontrada en caché.`);
            return JSON.parse(cachedData);
        }
        console.log(`❌ [CACHE MISS]: Clave ${key} no encontrada en caché.`);
        return null;
    } catch (error) {
        console.error(`⚠️ Error al consultar caché para clave ${key}:`, error.message);
        return null;
    }
}

async function setInCache(key, data, ttlSeconds) {
    if (!checkRedisStatus()) {
        return false;
    }

    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
        console.log(`💾 [CACHE SET]: Clave ${key} guardada con TTL de ${ttlSeconds} segundos.`);
        return true;
    } catch (error) {
        console.error(`⚠️ Error al guardar en caché la clave ${key}:`, error.message);
        return false;
    }
}

async function invalidateCache(key) {
    if (!checkRedisStatus()) {
        return false;
    }

    try {
        await redisClient.del(key);
        console.log(`🗑️ [CACHE INVALIDATE]: Clave ${key} eliminada de caché.`);
        return true;
    } catch (error) {
        console.error(`⚠️ Error al invalidar caché para clave ${key}:`, error.message);
        return false;
    }
}

async function cacheAsideExample(entityType, id, fetchFromDB) {
    const key = buildKey(entityType, id);
    let data = await getFromCache(key);

    if (data) {
        return data;
    }

    data = await fetchFromDB();

    if (data) {
        let ttl;
        switch (entityType) {
            case KEY_PREFIXES.CATEGORY:
                ttl = TTL_CONFIG.TICKET_CATEGORIES;
                break;
            case KEY_PREFIXES.STATUS:
                ttl = TTL_CONFIG.TICKET_STATUSES;
                break;
            case KEY_PREFIXES.USER:
                ttl = TTL_CONFIG.USER_PROFILES;
                break;
            case KEY_PREFIXES.TICKET:
                ttl = TTL_CONFIG.TICKET_LIST;
                break;
            default:
                ttl = 60;
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
