-- =========================================================
-- PUNTO C: CAPA DE AUDITORÍA Y FORENSE DE DATOS
-- =========================================================

-- 1. Estructura física para el almacenamiento de logs de error
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_db VARCHAR(100) DEFAULT CURRENT_USER,
    sql_state CHAR(5),
    mensaje_error TEXT,
    contexto TEXT
);

-- 2. Procedimiento con blindaje forense completo
CREATE OR REPLACE PROCEDURE procesar_venta_con_auditoria(
    p_ticket_id INT,
    p_usuario_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_precio_final NUMERIC(12,2);
    v_precio_base  NUMERIC(12,2);
    v_es_vip       BOOLEAN;
    v_nueva_tx_id  INT;
    
    v_err_state    CHAR(5);
    v_err_msg      TEXT;
BEGIN
    -- Validación forense preventiva (Provoca un error si el ID es negativo)
    IF p_ticket_id < 0 THEN
        RAISE EXCEPTION 'Operación rechazada: El ID del ticket no puede ser negativo.' 
            USING ERRCODE = '99001';
    END IF;

    SELECT precio_base, COALESCE((metadatos->>'vip')::BOOLEAN, FALSE)
    INTO v_precio_base, v_es_vip FROM tickets WHERE ticket_id = p_ticket_id;
    
    IF v_precio_base IS NULL THEN
        RAISE EXCEPTION 'El ticket con ID % no existe en el sistema.', p_ticket_id
            USING ERRCODE = 'RE002';
    END IF;
    
    v_precio_final := calcular_precio_final(v_precio_base);

    -- Ejecución del bloque de modificaciones
    UPDATE tickets SET estado = 'VENDIDO' WHERE ticket_id = p_ticket_id;

    INSERT INTO transacciones (usuario_id, fecha_compra, total, metodo_pago, estado_pago)
    VALUES (p_usuario_id, CURRENT_TIMESTAMP, v_precio_final, 'TARJETA', 'APROBADO')
    RETURNING transaccion_id INTO v_nueva_tx_id;

    INSERT INTO transaccion_items (transaccion_id, ticket_id, precio_final)
    VALUES (v_nueva_tx_id, p_ticket_id, v_precio_final);

EXCEPTION
    -- Bloque catch para auditoría activa
    WHEN OTHERS THEN
        -- Extracción limpia de metadatos del error
        GET STACKED DIAGNOSTICS 
            v_err_state = RETURNED_SQLSTATE,
            v_err_msg = MESSAGE_TEXT;
            
        -- Inserción forense de forma persistente
        INSERT INTO audit_logs (sql_state, mensaje_error, contexto)
        VALUES (v_err_state, v_err_msg, 'Fallo crítico al procesar Ticket ID: ' || p_ticket_id || ' con Usuario ID: ' || p_usuario_id);
        
        -- Relanzamiento hacia la aplicación cliente
        RAISE EXCEPTION 'Error registrado en la capa forense: % (SQLSTATE: %)', v_err_msg, v_err_state;
END;
$$;