# Grupo 6 - GrooveSpace

## Hito final

## Iniciar
Desde una terminal, entra a la carpeta `backend` y ejecuta:

```bash
cd backend
npm install
npm start
```

## Usuarios para la demostración

El inicio de sesión usa usuarios de prueba con la contraseña `123`: `musico1`, `musico2`, `staff`, `staff2`, `jefe` y `duena`. Los identificadores 1 y 2 son músicos, 3 y 4 encargados, y 5 y 6 dueños. Es una cuenta de demostración; no es un sistema de autenticación para uso real.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/estado` | Ver si el servidor responde. |
| GET | `/api/usuarios` | Consultar los usuarios de prueba. |
| POST | `/api/login` | Validar el usuario de demostración. |
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

