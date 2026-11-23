# Grupo 6 - GrooveSpace

## Hito 3.2

Sistema de reservas para salas de ensayo. La aplicación carga sus datos desde `data/datos.json` y guarda los cambios de prueba en el navegador.

Para abrirla, inicia un servidor local en esta carpeta y entra a `index.html`. La carga de datos usa `fetch`, por eso no funciona al abrir el HTML directamente.

Las cuentas de prueba tienen la contraseña `123`:
- `musico1` y `musico2`: músicos
- `staff` y `staff2`: encargados
- `jefe` y `duena`: dueños

Las reservas se sincronizan entre pestañas del mismo navegador mediante `localStorage`. La demostración no sincroniza datos entre dispositivos.

Autor: Uriel Joel Lescano Coleandro  
GitHub: [ulescano747-ux](https://github.com/ulescano747-ux)
