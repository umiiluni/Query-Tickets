# Integrante 5 - Buenas Prácticas Técnicas

## Objetivo

Aplicar las buenas prácticas solicitadas para la implementación de Redis.

## Nomenclatura de Claves (Namespacing)

Se utiliza el carácter ":" para organizar las claves.

Ejemplos:

- eventos:activos
- recintos:estructura:1
- recintos:estructura:2

Beneficios:

- Organización del almacenamiento.
- Evita conflictos entre claves.
- Facilita el mantenimiento.

## TTL (Time-To-Live)

Toda clave almacenada en Redis debe poseer un tiempo de expiración.

Ejemplos:

- eventos:activos → 120 segundos
- recintos:estructura:{id} → 120 segundos

Beneficios:

- Evita acumulación innecesaria de datos.
- Mantiene la consistencia eventual.
- Actualiza automáticamente la información almacenada.

## Checklist Cumplido

- [x] Nomenclatura con ":"
- [x] Uso de claves organizadas por entidad
- [x] Definición de TTL
- [x] Cumplimiento de consistencia eventuals