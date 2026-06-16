const redis = require('redis');

const redisClient = redis.createClient({
    url: 'redis://localhost:6379',
    RESP: 2
});

redisClient.on('error', (err) => console.error('⚠️ Redis Error:', err));

// Conectar al cliente de manera asíncrona
(async () => {
    try {
        await redisClient.connect();
        console.log('📶 [REDIS STATUS]: Conectado exitosamente.');
    } catch (err) {
        console.error('❌ No se pudo conectar a Redis. Usando modo Fallback (PostgreSQL directo).');
    }
})();

// Función de invalidación selectiva del Integrante 5 (Requerimiento Punto 4)
async function invalidarCacheEventos() {
    if (!redisClient.isOpen) return false;
    try {
        // Busca selectivamente las llaves de eventos sin usar flushDb()
        const keys = await redisClient.keys('eventos:lista:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🗑️ [REDIS] Invalidación selectiva: Se eliminaron las llaves: ${keys.join(', ')}`);
        }
        return true;
    } catch (error) {
        console.error('Error al invalidar caché:', error.message);
        return false;
    }
}

module.exports = { redisClient, invalidarCacheEventos };