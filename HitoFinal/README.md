# Grupo 6 - GrooveSpace

## Hito final

## Iniciar
desde la carpeta de la pagina, abres el terminal o el node.js y colocas

```bash
npm install
npm start
```
El servidor usa el puerto 3000 por defecto. En Render toma el puerto de la variable `PORT`. Para permitir un frontend publicado en otro dominio, configura `FRONTEND_URL` con la dirección del sitio. En local se permite cualquier origen.

## Usuarios para la demostración

`GET /api/usuarios` devuelve los usuarios y sus roles. Los identificadores 1 y 2 son músicos, 3 y 4 encargados, y 5 y 6 dueños. Como el hito permite simular los roles, las operaciones reciben `usuario_id`; no es un sistema de inicio de sesión ni sirve como control de acceso para un sistema real.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/estado` | Ver si el servidor responde. |
| GET | `/api/usuarios` | Consultar los usuarios de prueba. |
| GET | `/api/salas` | Consultar salas, estado y precio por hora. |
| GET | `/api/monitor` | Consultar solo nombre y estado de cada sala, sin datos de bandas. |
| GET | `/api/inventario` | Consultar equipos, cantidades y disponibilidad actual. |
| GET | `/api/reservas?usuario_id=1` | El músico ve sus reservas; encargado o dueño ven la grilla completa. |
| POST | `/api/reservas` | Crear una reserva, validando horario, sala y equipamiento. |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar una reserva propia con 24 horas de anticipación. |
| PATCH | `/api/reservas/:id/estado` | El encargado pasa la reserva de confirmada a en uso y luego a finalizada. |
| PATCH | `/api/reservas/:id/demora` | El encargado activa o quita el aviso de demora. |
| PATCH | `/api/salas/:id/estado` | El encargado actualiza el estado operativo de una sala. |
| GET | `/api/reportes/diario` | El dueño consulta reservas y horas ocupadas por sala; acepta `?fecha=AAAA-MM-DD`. |

Las rutas que dependen de un rol reciben `usuario_id` en el cuerpo JSON, salvo el reporte, que lo recibe en la consulta. Las respuestas y errores también se envían en JSON.

### Crear una reserva

```json
{
  "usuario_id": 1,
  "sala_id": "standard",
  "fecha": "2026-12-10",
  "hora": "18:00",
  "duracion": 2,
  "extras": ["guitarra"]
}
```

La duración permitida es de una a cuatro horas.

### Cambiar estado de una sala

```json
{
  "usuario_id": 3,
  "estado": "En uso"
}
```

### Marcar una demora

```json
{
  "usuario_id": 3,
  "demora": true,
  "mensaje": "El turno anterior necesita unos minutos más."
}
```

