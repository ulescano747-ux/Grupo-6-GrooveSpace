const base_api = "https://grupo-6-groovespace.onrender.com/api";;

async function pedir(ruta, opciones = {}) {
    const respuesta = await fetch(base_api + ruta, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
        body: opciones.body ? JSON.stringify(opciones.body) : undefined
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || "No se pudo completar la solicitud.");
    return datos;
}

window.api = {
    login: (username, password) => pedir("/login", { method: "POST", body: { username, password } }),
    usuarios: () => pedir("/usuarios"),
    salas: () => pedir("/salas"),
    inventario: () => pedir("/inventario"),
    reservas: id => pedir("/reservas?usuario_id=" + id),
    crear_reserva: datos => pedir("/reservas", { method: "POST", body: datos }),
    cancelar_reserva: (id, usuario_id) => pedir("/reservas/" + id + "/cancelar", { method: "PATCH", body: { usuario_id } }),
    estado_reserva: (id, usuario_id, estado) => pedir("/reservas/" + id + "/estado", { method: "PATCH", body: { usuario_id, estado } }),
    demora: (id, usuario_id, demora, mensaje) => pedir("/reservas/" + id + "/demora", { method: "PATCH", body: { usuario_id, demora, mensaje } }),
    estado_sala: (id, usuario_id, estado) => pedir("/salas/" + id + "/estado", { method: "PATCH", body: { usuario_id, estado } }),
    reporte: (fecha, usuario_id) => pedir("/reportes/diario?fecha=" + fecha + "&usuario_id=" + usuario_id)
};
