# Parte 4 - DELETE (Baja Lógica)

## Objetivo

Implementar una baja lógica sin eliminar físicamente registros de la base de datos.

## Endpoint

DELETE /api/eventos/:id

## Funcionamiento

En lugar de utilizar DELETE FROM, se actualiza el estado del ticket a VENDIDO.

## Invalidación de Caché

Luego de modificar PostgreSQL se ejecuta:

invalidarCacheEventos();

para garantizar que Redis no devuelva información desactualizada.

## Prueba realizada

DELETE http://localhost:3000/api/eventos/3

Status: 200 OK