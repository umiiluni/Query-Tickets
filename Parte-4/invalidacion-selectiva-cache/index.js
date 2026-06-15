// ============================================================================
// PROYECTO INTEGRADOR - PARTE 4 (COMPLETO Y UNIFICADO)
// TRABAJO GRUPAL - ENTORNO CENTRALIZADO
// ============================================================================

const cors = require('cors');
const express = require('express');
const { Pool } = require('pg'); 
const app = express();
const PORT = 3000;

// 🐘 1. CONEXIÓN DIRECTA A POSTGRESQL (Configuración de Sol)
const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Query_Tickets', 
    password: '1234', 
    port: 5432,
});

// 🎒 2. IMPORTACIONES DE REDIS (Rutas de la Parte 3)
const { checkRedisStatus } = require('../../Parte-3/Setup-y-Robustez/setup-redis');
const { KEY_PREFIXES, buildKey, invalidateCache } = require('../../Parte-3/Buenas-Practicas-Tecnicas/cache-service');

app.use(express.json());
app.use(cors());
// Le dice a Express que sirva el archivo index.html cuando entres a localhost:3000
app.use(express.static(__dirname));

// ============================================================================
// 1️⃣ ENDPOINT POST (Alta de Ticket con precio_base)
// ============================================================================
app.post('/api/eventos', async (req, res) => {
    // Recibimos los datos obligatorios según tus columnas de la tabla 'tickets'
    const { evento_id, ubicacion_id, precio_base } = req.body;
    if (!evento_id || !ubicacion_id || !precio_base) {
        return res.status(400).json({ success: false, message: "Faltan datos obligatorios (evento_id, ubicacion_id, precio_base)." });
    }

    try {
        // Insertamos directamente en la tabla 'tickets' que contiene la columna precio_base
        const queryText = 'INSERT INTO tickets(evento_id, ubicacion_id, precio_base, estado, ultima_actualizacion) VALUES($1, $2, $3, \'DISPONIBLE\', NOW()) RETURNING *;';
        const result = await db.query(queryText, [evento_id, ubicacion_id, precio_base]);

        // 🛡️ [PUNTO 4]: INVALIDACIÓN SELECTIVA DE REDIS
        if (checkRedisStatus()) {
            const cacheKey = buildKey(KEY_PREFIXES.EVENTOS); 
            await invalidateCache(cacheKey); 
            console.log(`🗑️ [PUNTO 4]: Clave "${cacheKey}" invalidada en Redis por ALTA de Ticket.`);
        }

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// 2️⃣ ENDPOINT PUT (Modificación del precio_base en la tabla tickets)
// ============================================================================
app.put('/api/eventos/:id', async (req, res) => {
    const { id } = req.params; // Este 'id' representará al ticket_id
    const { precio_base } = req.body;

    if (!precio_base || precio_base < 0) {
        return res.status(400).json({ success: false, message: "Precio base inválido." });
    }

    try {
        // Modificamos el precio_base apuntando a ticket_id
        const queryText = 'UPDATE tickets SET precio_base = $1, ultima_actualizacion = NOW() WHERE ticket_id = $2 RETURNING *;';
        const result = await db.query(queryText, [precio_base, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "El ticket especificado no existe." });
        }

        // 🛡️ [PUNTO 4]: INVALIDACIÓN SELECTIVA
        if (checkRedisStatus()) {
            const cacheKey = buildKey(KEY_PREFIXES.EVENTOS);
            await invalidateCache(cacheKey);
            console.log(`🗑️ [PUNTO 4]: Clave "${cacheKey}" invalidada en Redis por MODIFICACIÓN de Precio.`);
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// 3️⃣ ENDPOINT DELETE - BAJA LÓGICA (Adaptado al CHECK de tu base de datos)
// ============================================================================
app.delete('/api/eventos/:id', async (req, res) => {
    const { id } = req.params; // ticket_id

    try {
        // Usamos 'VENDIDO' que ya sabemos 100% que tu base de datos lo acepta gracias al trigger
        const queryText = 'UPDATE tickets SET estado = \'VENDIDO\', ultima_actualizacion = NOW() WHERE ticket_id = $1 RETURNING *;';
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Ticket no encontrado." });
        }

        // 🛡️ [PUNTO 4]: INVALIDACIÓN SELECTIVA
        if (checkRedisStatus()) {
            const cacheKey = buildKey(KEY_PREFIXES.EVENTOS);
            await invalidateCache(cacheKey);
            console.log(`🗑️ [PUNTO 4]: Clave "${cacheKey}" invalidada en Redis por BAJA LÓGICA (Ticket Marcado como VENDIDO).`);
        }

        return res.status(200).json({ success: true, message: "Baja lógica aplicada (Ticket pasado a VENDIDO) con éxito.", data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor centralizado adaptado corriendo en http://localhost:${PORT}`);
});