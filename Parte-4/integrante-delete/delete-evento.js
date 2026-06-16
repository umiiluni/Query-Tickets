const express = require('express');
const pool = require('./db');
const { invalidarCacheEventos } = require('./setup-redis');

const app = express();
app.use(express.json());

// =====================================================
// 🔴 PARTE 4 - DELETE (BAJA LÓGICA)
// =====================================================

app.delete('/api/eventos/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const queryText = `
            UPDATE tickets
            SET estado = 'VENDIDO'
            WHERE ticket_id = $1
            RETURNING ticket_id,
                      evento_id,
                      ubicacion_id,
                      precio_base,
                      estado,
                      ultima_actualizacion;
        `;

        const result = await pool.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ticket no encontrado.'
            });
        }

        await invalidarCacheEventos();

        return res.status(200).json({
            success: true,
            message: 'Baja lógica aplicada correctamente.',
            data: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: 'Error en el servidor.'
        });
    }
});

module.exports = app;