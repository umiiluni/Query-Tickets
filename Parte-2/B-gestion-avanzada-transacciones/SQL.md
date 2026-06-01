### 👤 Integrante: **Varela Emmanuel**

```sql
CREATE OR REPLACE PROCEDURE procesar_venta_transaccional(
    p_ticket_id INT,
    p_usuario_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Cumplimiento de robustez de tipos (%TYPE) de la entrega general
    v_precio_base   tickets.precio_base%TYPE;
    v_estado_ticket tickets.estado%TYPE;
    v_precio_final  tickets.precio_base%TYPE; 
    v_es_vip        BOOLEAN;
    v_nueva_tx_id   transacciones.transaccion_id%TYPE;
BEGIN
    -- 1. Obtener datos del ticket y validar su estado actual
    SELECT precio_base, estado, COALESCE((metadatos->>'vip')::BOOLEAN, FALSE)
    INTO v_precio_base, v_estado_ticket, v_es_vip 
    FROM tickets 
    WHERE ticket_id = p_ticket_id;
    
    -- Validaciones preventivas de negocio
    IF v_precio_base IS NULL THEN
        RAISE NOTICE 'El ticket solicitado con ID % no existe.', p_ticket_id;
        -- [CHECKLIST 1] Aborta la transacción de forma explícita si el dato no existe
        ROLLBACK; 
        RETURN;
    END IF;

    IF v_estado_ticket <> 'DISPONIBLE' THEN
        RAISE NOTICE 'Operación rechazada: El ticket % se encuentra en estado %.', p_ticket_id, v_estado_ticket;
        -- [CHECKLIST 1] Aborta la transacción de forma explícita si el estado es inválido
        ROLLBACK; 
        RETURN;
    END IF;
    
    -- Consumo de la función del Punto A
    v_precio_final := calcular_precio_final(v_precio_base);

    -- =========================================================
    -- OPERACIONES CRÍTICAS (Flujo Principal)
    -- =========================================================

    -- A. Modificar el estado en el inventario de tickets
    UPDATE tickets SET estado = 'VENDIDO' WHERE ticket_id = p_ticket_id;

    -- B. Registrar la cabecera de la venta
    INSERT INTO transacciones (usuario_id, fecha_compra, total, metodo_pago, estado_pago)
    VALUES (p_usuario_id, CURRENT_TIMESTAMP, v_precio_final, 'TARJETA', 'APROBADO')
    RETURNING transaccion_id INTO v_nueva_tx_id;

    -- C. Registrar el detalle de la venta
    INSERT INTO transaccion_items (transaccion_id, ticket_id, precio_final)
    VALUES (v_nueva_tx_id, p_ticket_id, v_precio_final);

    -- =========================================================
    -- SUBPROCESO SECUNDARIO Y MANEJO DE ERRORES PARCIALES
    -- =========================================================
    IF v_es_vip THEN
        -- [CHECKLIST 2] El bloque BEGIN establece un SAVEPOINT implícito obligatorio en Postgres
        -- para aislar el subproceso secundario propenso a fallas.
        BEGIN
            
            -- Simulamos lógica secundaria que podría fallar
            IF p_usuario_id = 999 THEN
                -- Forzamos un error en el caso borde para activar la reversión
                RAISE EXCEPTION 'Fallo controlado: Módulo de beneficios VIP fuera de línea.';
            ELSE
                RAISE NOTICE 'Beneficio VIP procesado exitosamente para el usuario %.', p_usuario_id;
            END IF;

        EXCEPTION
            -- [CHECKLIST 3] Lógica de reversión parcial (Postgres ejecuta internamente el ROLLBACK TO SAVEPOINT
            -- devolviendo el estado de los datos al inicio de este subbloque, protegiendo los inserts del flujo principal).
            WHEN OTHERS THEN
                RAISE NOTICE 'Manejo de Error Parcial: Falló la lógica VIP, pero la venta principal fue resguardada.';
        END;
    END IF;

    -- [CHECKLIST 1] Asegurar la atomicidad global mediante la confirmación explícita si todo fue correcto
    COMMIT;
    RAISE NOTICE 'Transacción completada con éxito de forma atómica.';

END;
$$;

-- ====================================================================
-- CONTROL DE ACCESOS (Cumplimiento del criterio de Encapsulación)
-- ====================================================================

-- 1. Crear un rol para la aplicación cliente (ej: la API del Frontend)
CREATE ROLE rol_api_ticketera WITH LOGIN PASSWORD 'Seguridad123_';

-- 2. Quitarle TODOS los privilegios directos sobre las tablas (Tablas Privadas)
REVOKE ALL ON TABLE tickets, usuarios, recintos, eventos, transacciones, transaccion_items, audit_logs FROM rol_api_ticketera;

-- 3. Otorgar permiso de ejecución ÚNICAMENTE a los procedimientos y funciones (Capa Pública)
GRANT EXECUTE ON FUNCTION calcular_precio_final TO rol_api_ticketera;
GRANT EXECUTE ON PROCEDURE procesar_venta_transaccional TO rol_api_ticketera;
GRANT EXECUTE ON PROCEDURE procesar_venta_con_auditoria TO rol_api_ticketera;
GRANT EXECUTE ON PROCEDURE procesar_venta_segura TO rol_api_ticketera;