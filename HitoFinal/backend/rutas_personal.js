const express = require("express");
const { salas, reservas } = require("./datos");
const { tiene_rol, fecha_valida, obtener_reporte } = require("./negocio");

const router = express.Router();
const estados_sala = ["En uso", "Liberada", "En mantenimiento"];
const cambios_reserva = { Confirmada: ["En uso"], "En uso": ["Finalizada"], Finalizada: [] };

function responder_error(res, estado, mensaje) {
    return res.status(estado).json({ error: mensaje });
}

router.patch("/reservas/:id/estado", (req, res) => {
    const datos = req.body || {};
    if (!tiene_rol(datos.usuario_id, ["encargado"])) {
        return responder_error(res, 403, "Solo un encargado puede cambiar el estado de una reserva.");
    }

    const reserva = reservas.find(item => item.id === Number(req.params.id));
    if (!reserva) return responder_error(res, 404, "No se encontró la reserva.");
    if (!cambios_reserva[reserva.estado]?.includes(datos.estado)) {
        return responder_error(res, 400, "Ese cambio de estado no está permitido.");
    }

    reserva.estado = datos.estado;
    res.json(reserva);
});

router.patch("/reservas/:id/demora", (req, res) => {
    const datos = req.body || {};
    if (!tiene_rol(datos.usuario_id, ["encargado"])) {
        return responder_error(res, 403, "Solo un encargado puede informar una demora.");
    }

    const reserva = reservas.find(item => item.id === Number(req.params.id));
    if (!reserva) return responder_error(res, 404, "No se encontró la reserva.");
    if (typeof datos.demora !== "boolean") return responder_error(res, 400, "Indica si hay demora.");

    reserva.demora = datos.demora;
    reserva.mensaje_demora = reserva.demora ? String(datos.mensaje || "El turno anterior tiene una demora.") : "";
    res.json(reserva);
});

router.patch("/salas/:id/estado", (req, res) => {
    const datos = req.body || {};
    if (!tiene_rol(datos.usuario_id, ["encargado"])) {
        return responder_error(res, 403, "Solo un encargado puede cambiar el estado de una sala.");
    }

    const sala = salas.find(item => item.id === req.params.id);
    if (!sala) return responder_error(res, 404, "No se encontró la sala.");
    if (!estados_sala.includes(datos.estado)) return responder_error(res, 400, "El estado de sala no es válido.");

    sala.estado = datos.estado;
    res.json(sala);
});

router.get("/reportes/diario", (req, res) => {
    if (!tiene_rol(req.query.usuario_id, ["dueño"])) {
        return responder_error(res, 403, "Solo el dueño puede consultar el reporte.");
    }

    const hoy = new Date();
    const fecha_hoy = [hoy.getFullYear(), String(hoy.getMonth() + 1).padStart(2, "0"), String(hoy.getDate()).padStart(2, "0")].join("-");
    const fecha = req.query.fecha || fecha_hoy;
    if (!fecha_valida(fecha)) {
        return responder_error(res, 400, "La fecha debe tener el formato AAAA-MM-DD.");
    }

    res.json(obtener_reporte(fecha));
});

module.exports = router;
