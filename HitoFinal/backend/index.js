const express = require("express");
const rutas = require("./rutas");
const rutas_personal = require("./rutas_personal");

const app = express();
const puerto = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, siguiente) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.sendStatus(204);
    siguiente();
});

app.use("/api", rutas);
app.use("/api", rutas_personal);

app.use((req, res) => {
    res.status(404).json({ error: "No existe esa ruta." });
});

app.use((error, req, res, siguiente) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ error: "El cuerpo de la solicitud debe ser JSON válido." });
    }
    res.status(500).json({ error: "Ocurrió un error en el servidor." });
});

if (require.main === module) {
    app.listen(puerto, () => console.log(`GrooveSpace API lista en el puerto ${puerto}`));
}

module.exports = app;
