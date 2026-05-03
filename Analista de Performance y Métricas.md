 Integrante 5: Analista de Performance y Métricas   
   - Responsabilidad : Validar que la optimización realmente funcione.
   - Tareas : Ejecutar EXPLAIN ANALYZE antes y después de los índices. Generar los diagramas en Dalibo (PEV2) y extraer las métricas de pg_stat_statements .
   - Entregable : Documentación de performance comparativa y capturas de los visualizadores.


Informe de Optimización y Performance
El objetivo de esta fase fue validar la eficiencia de las estrategias de indexación aplicadas sobre un volumen de 1.000.000 de registros. A continuación, se detalla el impacto real en los tiempos de respuesta:

1. Índice GIN (Búsqueda en JSONB)
Descripción: El índice GIN (Generalized Inverted Index) permite indexar las llaves y valores dentro de un campo JSONB, evitando recorrer todo el documento de forma secuencial.

Comparativa:

![Logo](umiiluni/Query-Tickets/Diagramas-antes/GIN.png)

Sin Índice: 667 ms (Ejecución vía Seq Scan).

Con Índice: 310 ms (Ejecución vía Bitmap Index Scan).

Conclusión: Se logró una reducción del tiempo de respuesta superior al 50%, optimizando la búsqueda de metadatos específicos en la tabla de tickets.

2. Índice HASH (Igualdad Exacta)
Descripción: Diseñado específicamente para comparaciones de igualdad (=). Es más compacto y rápido que un B-Tree para textos largos.

Comparativa:

Sin Índice: 949 ms (Requirió Parallel Seq Scan con 3 workers).

Con Índice: 10,8 ms (Ejecución vía Index Scan).

Conclusión: Representa la mejora más drástica del proyecto, reduciendo el tiempo de búsqueda en un 98.8%.

3. Índice B-Tree (Rangos de Valores)
Descripción: Estructura equilibrada ideal para operadores de comparación y rangos como BETWEEN, > o <.

Comparativa:

Sin Índice: 456 ms.

Con Índice: 349 ms.

Conclusión: Se optimizó la recuperación de tickets por rango de precio, eliminando la necesidad de leer cada página de la tabla.

4. Índice GiST (Rangos Temporales)
Descripción: Permite indexar tipos de datos complejos como rangos de tiempo (tsrange), soportando operadores de inclusión y solapamiento.

Observación Técnica: En las pruebas actuales, el planificador mantuvo un Seq Scan debido al bajo volumen de la tabla eventos (48 filas). No obstante, el índice es funcional y su beneficio será exponencial conforme aumente la cantidad de eventos registrados.



Análisis de Métricas con pg_stat_statements
La extensión pg_stat_statements es una herramienta de monitoreo que registra estadísticas de todas las sentencias SQL ejecutadas por el servidor. A diferencia de un EXPLAIN ANALYZE que mide una ejecución aislada, este módulo permite identificar patrones de carga y las consultas que más recursos consumen acumulativamente.

Según el reporte extraído:

Uso: Se observa que las consultas de diagnóstico (EXPLAIN) y los procesos de mantenimiento (como reset) son registrados con precisión.

Utilidad: Para el sistema de tickets, esta herramienta permite detectar si las consultas de Window Functions o la CTE Recursiva presentan una degradación de performance tras múltiples ejecuciones en un entorno de producción, permitiendo al Analista de Performance sugerir ajustes proactivos en la infraestructura o el diseño de las queries.