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
const uid = () => JSON.parse(localStorage.getItem("groovespace_usuario_activo")).id;

const api = {
    salas:      () => pedir("/salas"),
    inventario: () => pedir("/inventario"),
    usuarios:   () => pedir("/usuarios"),
    reservas:   (id) => pedir(`/reservas?usuario_id=${id}`),
    crearReserva: (reserva) => pedir("/reservas", { method: "POST", body: reserva }),
    cancelar:   (id, usuarioId) => pedir(`/reservas/${id}/cancelar`, { method: "PATCH", body: { usuario_id: usuarioId } }),
    estadoReserva: (id, estado) => pedir(`/reservas/${id}/estado`, { method: "PATCH", body: { usuario_id: uid(), estado } }),
    demora:     (id, demora, mensaje) => pedir(`/reservas/${id}/demora`, { method: "PATCH", body: { usuario_id: uid(), demora, mensaje } }),
    estadoSala: (id, estado) => pedir(`/salas/${id}/estado`, { method: "PATCH", body: { usuario_id: uid(), estado } })
};
async function cargarDatos() {
    try {
        const [usuarios, salas, inventario] = await Promise.all([
            api.usuarios(), api.salas(), api.inventario()
        ]);
        const usuario = obtenerUsuario();
        const reservas = usuario ? await api.reservas(usuario.id) : [];

        guardarDatos({
            politicaCancelacion: { horasAnticipacion: 24 },
            usuarios: usuarios,
            salas: salas.map(s => ({
                id: s.id, nombre: s.nombre, estado: s.estado, precioFijo: s.precio_hora
            })),
            inventario: inventario.map(i => ({
                id: i.id, tipo: i.nombre, cantidadTotal: i.cantidad,
                enUso: i.cantidad - i.disponibles, precioHora: i.precio_hora
            })),
            reservas: reservas.map(r => ({
                ...r, usuarioId: r.usuario_id, salaId: r.sala_id, mensajeDemora: r.mensaje_demora
            }))
        });
    } catch (error) {
        alert("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
    }
}
formulario.onsubmit = async function(event) {
    event.preventDefault();
    const nombre = document.getElementById("login-user").value.trim().toLowerCase();
    const usuario = obtenerDatos().usuarios.find(item => item.nombre.toLowerCase() === nombre);

    if (!usuario) {
        alert("Usuario no encontrado. Probá con: Lucas, Sofía o Martín.");
        return;
    }

    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    if (modal) modal.classList.remove("activo");
    await cargarDatos();          // vuelve a pedir las reservas de este usuario
    actualizarPantalla();
};
formulario.onsubmit = async function(event) {
    event.preventDefault();
    const usuario = obtenerUsuario();
    if (!usuario || usuario.rol !== "musico") {
        alert("Inicia sesión como músico para solicitar una reserva.");
        location.href = "../index.html";
        return;
    }

    const extras = [];
    document.querySelectorAll("input[name='extras']:checked").forEach(check => extras.push(check.value));

    try {
        const reserva = await api.crearReserva({
            usuario_id: usuario.id,
            sala_id: select.value,
            fecha: document.getElementById("fecha").value,
            hora: document.getElementById("hora").value,
            duracion: Number(duracion.value),
            extras: extras
        });
        location.href = "confirmacion.html?id=" + reserva.id;
    } catch (error) {
        alert(error.message);     // el backend explica el motivo
    }
};
async function cancelarReserva(id) {
    if (!confirm("¿Quieres cancelar esta reserva?")) return;
    try {
        await api.cancelar(id, obtenerUsuario().id);
        await cargarDatos();
        mostrarMisReservas();
    } catch (error) {
        alert(error.message);
    }
}
async function ejecutar(accion) {
    try {
        await accion();
        await cargarDatos();
        actualizarPantalla();
    } catch (error) {
        alert(error.message);
    }
}

window.cambiarEstadoSala = (id, estado) => ejecutar(() => api.estadoSala(id, estado));

window.iniciarEnsayo = (id) => ejecutar(async () => {
    const reserva = obtenerDatos().reservas.find(r => r.id === id);
    await api.estadoReserva(id, "En uso");
    await api.estadoSala(reserva.salaId, "En uso");
});

window.finalizarEnsayo = (id) => ejecutar(async () => {
    const reserva = obtenerDatos().reservas.find(r => r.id === id);
    await api.estadoReserva(id, "Finalizada");
    await api.estadoSala(reserva.salaId, "Liberada");
});

window.avisarDemora = (id) => ejecutar(() =>
    api.demora(id, true, "El ensayo anterior tuvo una demora. Consulta al encargado para más información.")
);
