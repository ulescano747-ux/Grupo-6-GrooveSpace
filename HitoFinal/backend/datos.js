const usuarios = [
    { id: 1, username: "musico1", password: "123", nombre: "Lucas", rol: "musico" },
    { id: 2, username: "musico2", password: "123", nombre: "Valentina", rol: "musico" },
    { id: 3, username: "staff", password: "123", nombre: "Sofía", rol: "encargado" },
    { id: 4, username: "staff2", password: "123", nombre: "Diego", rol: "encargado" },
    { id: 5, username: "jefe", password: "123", nombre: "Martín", rol: "dueño" },
    { id: 6, username: "duena", password: "123", nombre: "Carolina", rol: "dueño" }
];

const salas = [
    { id: "standard", nombre: "Sala Standard", estado: "Liberada", precio_hora: 3500 },
    { id: "premium", nombre: "Sala Premium", estado: "Liberada", precio_hora: 5500 },
    { id: "bateria", nombre: "Sala de Batería", estado: "En mantenimiento", precio_hora: 4000 }
];

const inventario = [
    { id: "guitarra", nombre: "Guitarra eléctrica", cantidad: 3, precio_hora: 500 },
    { id: "pedalera", nombre: "Pedalera de efectos", cantidad: 2, precio_hora: 500 },
    { id: "platillos", nombre: "Set de platillos", cantidad: 4, precio_hora: 500 },
    { id: "amplificador", nombre: "Amplificador", cantidad: 3, precio_hora: 800 }
];

const reservas = [];

module.exports = { usuarios, salas, inventario, reservas };
