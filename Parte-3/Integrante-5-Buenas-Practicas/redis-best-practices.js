// Configuración de TTL

const TTL_EVENTOS = 120;
const TTL_RECINTOS = 120;

// Namespacing

const KEY_EVENTOS_ACTIVOS = "eventos:activos";

function getRecintoKey(id) {
    return `recintos:estructura:${id}`;
}

/*
Ejemplos de uso:

await redisClient.setEx(
    KEY_EVENTOS_ACTIVOS,
    TTL_EVENTOS,
    JSON.stringify(eventos)
);

await redisClient.setEx(
    getRecintoKey(1),
    TTL_RECINTOS,
    JSON.stringify(recinto)
);
*/