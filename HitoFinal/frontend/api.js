const API = "http://localhost:3000/api";

async function pedir(ruta, opciones = {}) {
    const respuesta = await fetch(API + ruta, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
        body: opciones.body ? JSON.stringify(opciones.body) : undefined
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error);  // el backend manda { error: "..." }
    return datos;
}
const api = {
    salas:      () => pedir("/salas"),
    inventario: () => pedir("/inventario"),
    usuarios:   () => pedir("/usuarios"),
    reservas:   (uid) => pedir(`/reservas?usuario_id=${uid}`),
    crearReserva: (reserva) => pedir("/reservas", { method: "POST", body: reserva }),
    cancelar:   (id, uid) => pedir(`/reservas/${id}/cancelar`, { method: "PATCH", body: { usuario_id: uid } })
};

