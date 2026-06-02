-- =====================================================
-- Punto A: Abstracción y Lógica Procedural (Función de Cálculo)
-- =====================================================

/*
Ajuste realizado: Se aplicó %TYPE tanto al parámetro de entrada como al tipo de dato que retorna la función, 
vinculándolos dinámicamente a la estructura de la columna precio_base de la tabla tickets.
*/

CREATE OR REPLACE FUNCTION calcular_precio_final( 
    p_precio_base tickets.precio_base%TYPE -- [CONSIGNA: Robustez con %TYPE] 
) 
RETURNS tickets.precio_base%TYPE       -- [CONSIGNA: Robustez con %TYPE] 
LANGUAGE plpgsql 
STABLE -- [CONSIGNA: Categorización de volatilidad correcta para cachear CPU] 
AS $$ 
DECLARE 
    v_cargo_servicio NUMERIC := 0.15; -- 15% de recargo por servicio de la ticketera 
BEGIN 
    -- Validación preventiva de consistencia de datos 
    IF p_precio_base IS NULL OR p_precio_base < 0 THEN 
        RAISE EXCEPTION 'El precio base no es válido para realizar el cálculo.'; 
    END IF; 

    -- Devuelve el precio final redondeado a 2 decimales 
    RETURN ROUND(p_precio_base * (1 + v_cargo_servicio), 2); 
END; 
$$;
