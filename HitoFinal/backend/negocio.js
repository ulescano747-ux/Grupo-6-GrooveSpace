const { usuarios, salas, inventario, reservas } = require("./datos");

function buscar_usuario(id) {
    return usuarios.find(usuario => usuario.id === Number(id));
}

function tiene_rol(id, roles) {
    const usuario = buscar_usuario(id);
    return usuario && roles.includes(usuario.rol);
}

function fecha_hora(fecha, hora) {
    return new Date(`${fecha}T${hora}:00`);
}

function fecha_valida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return false;
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const valor = new Date(anio, mes - 1, dia);
    return valor.getFullYear() === anio && valor.getMonth() === mes - 1 && valor.getDate() === dia;
}

function reserva_activa(reserva) {
    return reserva.estado !== "Cancelada" && reserva.estado !== "Finalizada";
}

function hay_cruce(sala_id, inicio, fin) {
    return reservas.some(reserva => {
        if (reserva.sala_id !== sala_id || !reserva_activa(reserva)) return false;
        const otro_inicio = fecha_hora(reserva.fecha, reserva.hora);
        const otro_fin = new Date(otro_inicio.getTime() + reserva.duracion * 3600000);
        return inicio < otro_fin && otro_inicio < fin;
    });
}

function extras_disponibles(ids, inicio, fin) {
    for (const id of ids) {
        const equipo = inventario.find(item => item.id === id);
        if (!equipo) return false;

        const ocupados = reservas.filter(reserva => {
            if (!reserva_activa(reserva) || !reserva.extras.includes(id)) return false;
            const otro_inicio = fecha_hora(reserva.fecha, reserva.hora);
            const otro_fin = new Date(otro_inicio.getTime() + reserva.duracion * 3600000);
            return inicio < otro_fin && otro_inicio < fin;
        }).length;

        if (ocupados >= equipo.cantidad) return false;
    }
    return true;
}

function crear_reserva(datos) {
    datos = datos || {};
    const { usuario_id, sala_id, fecha, hora, duracion, extras = [] } = datos;
    const usuario = buscar_usuario(usuario_id);
    const sala = salas.find(item => item.id === sala_id);

    if (!usuario || usuario.rol !== "musico") return { estado: 403, error: "La reserva debe realizarla un músico registrado." };
    if (!sala) return { estado: 404, error: "No se encontró la sala." };
    if (sala.estado === "En mantenimiento") return { estado: 409, error: "La sala está en mantenimiento." };
    if (!fecha_valida(fecha) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora || "")) {
        return { estado: 400, error: "La fecha o la hora no son válidas." };
    }
    if (!Number.isInteger(duracion) || duracion < 1 || duracion > 4) {
        return { estado: 400, error: "La duración debe ser de 1 a 4 horas." };
    }
    if (!Array.isArray(extras) || new Set(extras).size !== extras.length) {
        return { estado: 400, error: "Revisa los equipamientos seleccionados." };
    }

    const inicio = fecha_hora(fecha, hora);
    if (Number.isNaN(inicio.getTime()) || inicio <= new Date()) {
        return { estado: 400, error: "El turno debe comenzar en una fecha futura válida." };
    }
    const fin = new Date(inicio.getTime() + duracion * 3600000);
    if (hay_cruce(sala_id, inicio, fin)) return { estado: 409, error: "La sala ya tiene una reserva en ese horario." };
    if (!extras_disponibles(extras, inicio, fin)) return { estado: 409, error: "No hay suficiente equipamiento para ese horario." };

    const precio_extras = extras.reduce((total, id) => {
        const equipo = inventario.find(item => item.id === id);
        return total + equipo.precio_hora;
    }, 0);

    const reserva = {
        id: Date.now(),
        usuario_id: usuario.id,
        sala_id: sala.id,
        sala: sala.nombre,
        fecha,
        hora,
        duracion,
        extras,
        estado: "Confirmada",
        demora: false,
        total: (sala.precio_hora + precio_extras) * duracion
    };

    reservas.push(reserva);
    return { reserva };
}

function cancelar_reserva(id, usuario_id) {
    const reserva = reservas.find(item => item.id === Number(id));
    if (!reserva) return { estado: 404, error: "No se encontró la reserva." };
    if (!tiene_rol(usuario_id, ["musico"]) || reserva.usuario_id !== Number(usuario_id)) {
        return { estado: 403, error: "Solo el músico que hizo la reserva puede cancelarla." };
    }

    const horas_restantes = (fecha_hora(reserva.fecha, reserva.hora) - new Date()) / 3600000;
    if (reserva.estado !== "Confirmada" || horas_restantes < 24) {
        return { estado: 409, error: "La cancelación requiere al menos 24 horas de anticipación." };
    }

    reserva.estado = "Cancelada";
    return { reserva };
}

function obtener_reporte(fecha) {
    const del_dia = reservas.filter(reserva => reserva.fecha === fecha && reserva.estado !== "Cancelada");
    const por_sala = salas.map(sala => {
        const turnos = del_dia.filter(reserva => reserva.sala_id === sala.id);
        return {
            sala_id: sala.id,
            sala: sala.nombre,
            reservas: turnos.length,
            horas_ocupadas: turnos.reduce((total, reserva) => total + reserva.duracion, 0)
        };
    });

    return { fecha, total_reservas: del_dia.length, por_sala };
}

module.exports = { buscar_usuario, tiene_rol, reserva_activa, fecha_valida, crear_reserva, cancelar_reserva, obtener_reporte };
