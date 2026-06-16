const express = require('express');
const pool = require('./db');
const { invalidarCacheEventos } = require('./setup-redis');

const app = express();
app.use(express.json()); // Permite leer los cuerpos JSON de Postman

// =====================================================================
// 👤 LO QUE HACES VOS: Emmanuel V.
// 🟢 PUNTO 1: Alta de Ticket (POST)
// =====================================================================
app.post('/api/eventos', async (req, res) => {
    // Captura tolerante a fallos de formato
    const evento_id = req.body.evento_id;
    const ubicacion_id = req.body.ubicacion_id;
    const precio_base = req.body.precio_base;

    // Validación estricta con respuesta limpia en Postman en vez de romper el servidor
    if (evento_id === undefined || ubicacion_id === undefined || precio_base === undefined) {
        return res.status(400).json({ 
            success: false, 
            error: 'Campos obligatorios ausentes en el JSON enviado. Verifique que se incluyan evento_id, ubicacion_id y precio_base.' 
        });
    }

    try {
        const queryText = `
            INSERT INTO tickets (evento_id, ubicacion_id, precio_base, estado, metadatos)
            VALUES ($1, $2, $3, 'DISPONIBLE', '{}'::jsonb)
            RETURNING ticket_id, evento_id, ubicacion_id, precio_base, estado, metadatos, ultima_actualizacion;
        `;
        const result = await pool.query(queryText, [evento_id, ubicacion_id, precio_base]);
        
        // Llamada a la invalidación de caché de tu compañero (Integrante 5)
        await invalidarCacheEventos();

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error detectado en Base de Datos:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================================
// 👤 LO QUE HACES VOS: Emmanuel V.
// 🟡 PUNTO 2: Modificación de Precio (PUT)
// =====================================================================
app.put('/api/eventos/:id', async (req, res) => {
    const { id } = req.params;
    const { precio_base } = req.body;

    if (!precio_base) {
        return res.status(400).json({ success: false, error: 'precio_base es requerido.' });
    }

    try {
        const queryText = `
            UPDATE tickets
            SET precio_base = $1
            WHERE ticket_id = $2
            RETURNING ticket_id, evento_id, ubicacion_id, precio_base, estado, metadatos, ultima_actualizacion;
        `;
        const result = await pool.query(queryText, [precio_base, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado.' });
        }

        await invalidarCacheEventos();

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Error en el servidor.' });
    }
});

// =====================================================================
// 🔴 LO QUE HIZO TU EQUIPO: Baja Lógica (DELETE)
// =====================================================================
app.delete('/api/eventos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const queryText = `
            UPDATE tickets
            SET estado = 'VENDIDO'
            WHERE ticket_id = $1
            RETURNING ticket_id, estado, ultima_actualizacion;
        `;
        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado.' });
        }

        await invalidarCacheEventos();

        return res.status(200).json({
            success: true,
            message: "Baja lógica aplicada (Ticket pasado a VENDIDO) con éxito.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Error en el servidor.' });
    }
});

// Levantar servidor
app.listen(3000, () => {
    console.log('🚀 Servidor híbrido corriendo en http://localhost:3000');
});