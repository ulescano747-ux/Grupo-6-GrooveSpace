# Grupo 6 - GrooveSpace

## Aplicaciones publicadas

- Frontend: [https://grupo-6-groovespace-fqdx.onrender.com](https://grupo-6-groovespace-fqdx.onrender.com)
- Backend: [https://grupo-6-groovespace.onrender.com](https://grupo-6-groovespace.onrender.com)
- Estado de la API: [https://grupo-6-groovespace.onrender.com/api/estado](https://grupo-6-groovespace.onrender.com/api/estado)

## Iniciar localmente

### Backend

Desde la carpeta `HitoFinal`, abre una terminal y ejecuta:

```bash
cd backend
npm install
npm start
```

### Frontend

Abre `HitoFinal/frontend` con un servidor local, por ejemplo Live Server de Visual Studio Code, y entra a `index.html`. No abras el archivo directamente con `file://`, porque la página consulta la API con `fetch`.

El frontend está configurado para usar el backend publicado. 

Para probar ambos proyectos en local, cambia temporalmente `base_api` en `frontend/js/api.js` a `http://localhost:3000/api`.

En Render, configura la variable `FRONTEND_URL` del backend con `https://grupo-6-groovespace-fqdx.onrender.com`.

## Usuarios para la demostración

Todos usan la contraseña `123`: `musico1` y `musico2` son músicos; `staff` y `staff2`, encargados; `jefe` y `duena`, dueños. Son cuentas de demostración.

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/estado` | Ver si el servidor responde. |
| GET | `/api/usuarios` | Consultar los usuarios de prueba. |
| POST | `/api/login` | Validar el usuario de demostración. |
| GET | `/api/salas` | Consultar salas, estado y precio por hora. |
| GET | `/api/monitor` | Consultar nombre y estado de cada sala. |
| GET | `/api/inventario` | Consultar equipos, cantidades y disponibilidad. |
| GET | `/api/reservas?usuario_id=1` | Consultar reservas según el rol del usuario. |
| POST | `/api/reservas` | Crear una reserva y validar sala, horario y equipamiento. |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar una reserva propia con 24 horas de anticipación. |
| PATCH | `/api/reservas/:id/estado` | Cambiar el estado de una reserva. |
| PATCH | `/api/reservas/:id/demora` | Activar o quitar un aviso de demora. |
| PATCH | `/api/salas/:id/estado` | Actualizar el estado operativo de una sala. |
| GET | `/api/reportes/diario?fecha=AAAA-MM-DD&usuario_id=5` | Consultar el reporte diario como dueño. |

Las respuestas y errores de la API se envían en JSON. Las reservas y los estados se guardan en memoria mientras el servidor está activo.

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
