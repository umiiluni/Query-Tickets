-- =====================================================
-- Punto E - Automatizacion con triggers
-- =====================================================

/*
1. TABLA OBJETIVO Y SINCRONIZACIÓN TEMPORAL

Tabla objetivo: tickets

Tipo de trigger: BEFORE UPDATE

Objetivo:
Evitar la duplicidad de ventas (Double-Selling)
validando el estado del ticket antes de que la
actualización sea guardada.
*/


-- =====================================================
-- funcion disparadora

CREATE OR REPLACE FUNCTION validar_disponibilidad_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    /*
    OLD = valor actual almacenado

    NEW = nuevo valor que intenta guardarse
    */

    IF OLD.estado = 'VENDIDO'
       AND NEW.estado = 'VENDIDO' THEN

        RAISE EXCEPTION
        'Operación denegada: El ticket con ID % ya fue vendido anteriormente.',
        OLD.ticket_id
        USING ERRCODE = 'RE001';

    END IF;

    RETURN NEW;

END;
$$;


-- =====================================================
-- creacion de trigger

CREATE TRIGGER trg_verificar_estado_ticket
BEFORE UPDATE
ON tickets
FOR EACH ROW
EXECUTE FUNCTION validar_disponibilidad_ticket();


-- =====================================================
-- verificacion de reactividad

/*
Evento DML: UPDATE

Ejemplo:

UPDATE tickets
SET estado = 'VENDIDO'
WHERE ticket_id = 1;

Resultado:
Actualización permitida.

Si el ticket ya estaba vendido:

UPDATE tickets
SET estado = 'VENDIDO'
WHERE ticket_id = 1;

Resultado:

ERROR:
Operación denegada:
El ticket con ID 1 ya fue vendido anteriormente.
*/