const { checkRedisStatus } = require('./setup-redis');

console.log('🚀 Iniciando simulación de sistema...');

// Simulamos peticiones del usuario cada 3 segundos
setInterval(() => {
    if (checkRedisStatus()) {
        console.log('🟢 [Simulación]: El usuario pide datos ➔ Servidor de Redis ONLINE. Usando caché a alta velocidad.');
    } else {
        console.log('🔴 [Simulación]: El usuario pide datos ➔ Servidor de Redis OFFLINE. ¡Escudo Fallback activo! Consultando a PostgreSQL.');
    }
}, 3000);