### 👤 Integrante 2: Desarrollador del Punto 1 (Diseño y Estrategia)

**Rol:** Definición de endpoints, justificación de consistencia eventual y diseño de llaves.

---

#### 1. Fase de Diseño: ¿Qué vamos a cachear?
Para optimizar el rendimiento global de la plataforma de gestión de eventos y venta de entradas, se han identificado **dos endpoints de alta criticidad de lectura** que se beneficiarán del patrón *Cache-Aside* utilizando Redis.

* **Endpoint 1: Listado de Eventos Activos / Cartelera Principal**
    * **Ruta del Endpoint:** `/api/eventos/activos`
    * **Clave en Redis (Namespacing):** `eventos:lista:activos`
    * **Justificación:** La página principal de una ticketera es consultada de forma masiva y simultánea por miles de usuarios que buscan ver qué shows están disponibles. Es un caso típico de **alta frecuencia de lectura**. Por el contrario, la creación o modificación de un evento musical o deportivo (alta por administración) es una acción de **baja frecuencia de escritura**.
    * **Consistencia Eventual:** Este endpoint tolera perfectamente una consistencia eventual de **2 minutos (120 segundos)**. Si un administrador añade un nuevo evento o corrige la descripción de un show, no es crítico que impacte en el milisegundo exacto en las pantallas de todos los usuarios de la aplicación. Que el catálogo tarde hasta 2 minutos en actualizarse globalmente en la caché no rompe las reglas del negocio ni degrada la experiencia del usuario.

* **Endpoint 2: Distribución de Estructura de un Recinto (Estructura de Bloques/Sectores)**
    * **Ruta del Endpoint:** `/api/recintos/:id/estructura`
    * **Clave en Redis (Namespacing):** `recintos:estructura:id:<id_recinto>` *(Ejemplo: `recintos:estructura:id:1`)*
    * **Justificación:** Cuando un cliente hace clic en un evento, el sistema debe renderizar el mapa del Estadio o Teatro (recorriendo la jerarquía de Sectores y Filas que optimizamos en la Fase 1 con la CTE Recursiva). Esta consulta es pesada para la base de datos relacional si se ejecuta miles de veces por minuto. La lectura es masiva, mientras que la estructura física de un recinto (saber cuántas filas tiene la platea del Luna Park o el Estadio Monumental) tiene una **frecuencia de escritura prácticamente nula** (solo cambia ante remodelaciones edilicias del estadio).
    * **Consistencia Eventual:** Este caso tolera una consistencia eventual incluso mayor, pero se fijará un tiempo de expiración controlado para asegurar que cualquier actualización de metadatos del sector se propague de manera automatizada sin intervención manual. *(Nota: Aquí se almacena la estructura física de los sectores/filas, NO el estado de ocupación en tiempo real del asiento individual).*

---

#### 4. Buenas Prácticas Técnicas (Estándar de Claves y Expiración)

* **A. Nomenclatura Estricta (Namespacing):** Se adopta el estándar de la industria utilizando la separación por dos puntos (`:`) para segmentar los dominios de datos en Redis. Esto permite una organización jerárquica limpia dentro de la memoria RAM, facilitando auditorías de llaves y limpiezas selectivas mediante patrones.
    * *Sintaxis para listas globales:* `[contexto]:[entidad]:[estado]` $\rightarrow$ `eventos:lista:activos`
    * *Sintaxis para entidades específicas:* `[contexto]:[entidad]:[identificador]:[id]` $\rightarrow$ `recintos:estructura:id:1`

* **B. Estrategia de Expiración (TTL - Time To Live):** No se permiten llaves persistentes en memoria de manera indefinida (*volatilidad controlada*).
    * Para la cartelera de eventos activos (`eventos:lista:activos`), se define un **TTL de 120 segundos (2 minutos)**. Al expirar, el próximo cliente provocará un *Cache MISS*, actualizará la memoria con los datos frescos de PostgreSQL y garantizará que la caché se autorregule constantemente.