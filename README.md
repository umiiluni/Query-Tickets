# Query Tickets

## Modelado y Estructura: Documentación del Concepto

### Problemática a resolver
En la actualidad, la organización de eventos masivos (recitales, obras de teatro, festivales) enfrenta desafíos críticos relacionados con la gestión de grandes volúmenes de datos en tiempo real. Las plataformas suelen colapsar ante la carga masiva de usuarios o presentan dificultades para gestionar estructuras de precios y ubicaciones complejas.

**Query Tickets** surge como una solución robusta y escalable diseñada para optimizar la experiencia de compra y la administración de inventario. La aplicación resuelve tres problemas fundamentales:

1.  **Escalabilidad y Performance**: Mediante técnicas avanzadas de indexación, la base de datos permite realizar búsquedas rápidas entre millones de registros de transacciones y disponibilidad de tickets, evitando cuellos de botella durante las "preventas" de alta demanda.
2.  **Complejidad de Inventario**: Gestiona de forma eficiente la jerarquía física de los recintos (Estadios > Sectores > Filas > Asientos) mediante consultas recursivas, lo que permite una asignación precisa y evita la sobreventa.
3.  **Flexibilidad de Datos**: Gracias al uso de tipos de datos no relacionales (JSONB), la plataforma permite almacenar metadatos variables para cada ticket (beneficios VIP, acceso a estacionamiento, kits de bienvenida o restricciones de edad) sin necesidad de alterar la estructura fija del esquema relacional.

### Objetivo Técnico
Demostrar que es posible mantener la integridad referencial (3NF) y la consistencia de los datos mientras se procesa una carga superior al 1.000.000 de registros, garantizando tiempos de respuesta mínimos mediante el análisis y optimización del Query Planner de PostgreSQL.

Link a plantilla del proyecto en Drive
https://docs.google.com/document/d/1Mdxy4bTwR4yIG9ggeNpwXmmbmvdT_tMVWjkQWkgdM2g/edit?usp=sharing    
