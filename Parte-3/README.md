## Checklist: Integración de Caché con Redis (Proyecto Integrador - Parte 3)

Esta sección detalla el progreso de la implementación de la capa de
persistencia políglota utilizando Redis como almacén clave-valor en memoria.

### 1. Fase de Diseño y Selección
- [ ] Identificamos 1 o 2 endpoints estratégicos para cachear (alta frecuencia de
lectura, baja de escritura).
- [ ] Listado de endpoints cacheados:
- *Endpoint 1:* `[RUTA ACÁ]`
- *Endpoint 2:* `[RUTA ACÁ - Opcional]`
- [ ] Asegurar que el caso de uso soporta **consistencia eventual** (tolera
desactualización de 1 o 2 minutos sin romper el sistema).

### 2. Configuración (Setup)
- [X] Instalamos el cliente de Redis en nuestro proyecto.
- [X] Establecemos conexión exitosa con el servidor de Redis (Local o Cloud).
- [X] Implementamos **Manejo de Errores (Fallback)**: Si Redis se cae, la
aplicación registra el error pero sigue funcionando, consultando directamente la
base de datos principal.

### 3. Implementación del Patrón Cache-Aside
- [ ] **Consulta a la Caché:** El endpoint verifica primero si la clave existe en
Redis.
- [ ] **Cache HIT:** Si el dato existe, se retorna inmediatamente al cliente (se
evita ir a la DB).
- [ ] **Cache MISS (Consulta a la DB):** Si el dato NO existe, el sistema realiza
la consulta a la base de datos principal (PostgreSQL, MongoDB, etc.).
- [ ] **Población de la Caché:** Guardamos el resultado obtenido de la base de
datos en Redis.
- [ ] Devolver la respuesta final al cliente en todos los flujos.

### 4. Buenas Prácticas Técnicas
- [X] **Nomenclatura (Namespacing):** Utilizamos el estándar de separación con
dos puntos (`:`) para las claves. *(Ejemplo: `tickets:123` o `categories:list`)*.
- [X] **Asignación de TTL:** Toda clave guardada en Redis tiene un tiempo de
vida (Time-To-Live) configurado.
