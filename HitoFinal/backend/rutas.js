const express = require("express");
const { usuarios, salas, inventario, reservas } = require("./datos");
const { crear_reserva, cancelar_reserva, reserva_activa } = require("./negocio");

const router = express.Router();

function responder_error(res, resultado) {
    return res.status(resultado.estado).json({ error: resultado.error });
}

router.get("/estado", (req, res) => {
    res.json({ estado: "ok" });
});

router.get("/usuarios", (req, res) => {
    res.json(usuarios);
});

router.get("/salas", (req, res) => {
    res.json(salas);
});

router.get("/monitor", (req, res) => {
    res.json(salas.map(sala => ({ id: sala.id, nombre: sala.nombre, estado: sala.estado })));
});

router.get("/inventario", (req, res) => {
    const ahora = new Date();
    const disponibles = inventario.map(equipo => {
        const usados = reservas.filter(reserva => {
            if (!reserva_activa(reserva) || !reserva.extras.includes(equipo.id)) return false;
            const inicio = new Date(`${reserva.fecha}T${reserva.hora}:00`);
            const fin = new Date(inicio.getTime() + reserva.duracion * 3600000);
            return inicio <= ahora && ahora < fin;
        }).length;
        return { ...equipo, disponibles: Math.max(0, equipo.cantidad - usados) };
    });
    res.json(disponibles);
});

router.get("/reservas", (req, res) => {
    const usuario_id = req.query.usuario_id;
    const usuario = usuarios.find(item => item.id === Number(usuario_id));
    if (!usuario) return res.status(400).json({ error: "Indica un usuario registrado." });

    const lista = usuario.rol === "musico"
        ? reservas.filter(reserva => reserva.usuario_id === usuario.id)
        : reservas;
    res.json([...lista].sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`)));
});

router.post("/reservas", (req, res) => {
    const resultado = crear_reserva(req.body);
    if (resultado.error) return responder_error(res, resultado);
    res.status(201).json(resultado.reserva);
});

router.patch("/reservas/:id/cancelar", (req, res) => {
    const resultado = cancelar_reserva(req.params.id, req.body?.usuario_id);
    if (resultado.error) return responder_error(res, resultado);
    res.json(resultado.reserva);
});

module.exports = router;
