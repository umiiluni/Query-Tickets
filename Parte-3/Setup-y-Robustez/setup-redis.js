// ============================================================================
// PARTE 3: INFRAESTRUCTURA Y CONFIGURACIÓN DE REDIS (SETUP & ROBUSTEZ)
// INTEGRANTE: Sol De Francesco
// ============================================================================

const redis = require('redis');

// CONFIGURACIÓN DE CONEXIÓN (Checklist: Conexión exitosa Local/Cloud)
const redisClient = redis.createClient({
    url: 'redis://localhost:6379' // URI estándar para el contenedor local de Docker
});

let isRedisOperational = false;

// Evento que confirma la conexión exitosa
redisClient.on('connect', () => {
    isRedisOperational = true;
    console.log('🎉 [REDIS STATUS]: Conexión establecida con éxito en el entorno local.');
});

// MANEJO DE ERRORES / MECANISMO DE FALLBACK (Checklist: Si Redis se cae, la app sigue)
// Si el contenedor se apaga, este evento evita que la app de Node.js colapse (Crash)
redisClient.on('error', (errorTécnico) => {
    isRedisOperational = false;
    console.error('⚠️ [ALERTA INFRAESTRUCTURA]: Servidor de caché Redis inaccesible.');
    console.error(`Detalle del fallo: ${errorTécnico.message}`);
    console.log('🛡️ [FALLBACK]: Derivando de forma transparente todas las consultas a PostgreSQL...');
});

// Inicialización asrincrónica segura
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        isRedisOperational = false;
        console.error('❌ Error crítico en el handshake inicial con Redis:', err.message);
    }
})();

module.exports = {
    redisClient,
    checkRedisStatus: () => isRedisOperational
};