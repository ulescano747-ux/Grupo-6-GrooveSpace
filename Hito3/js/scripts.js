document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
    await cargarDatos();
    actualizarUsuario();
    configurarLogin();
    mostrarSalas();
    cargarSalas();
    configurarReserva();
    mostrarMisReservas();
    mostrarConfirmacion();
}

async function cargarDatos() {
    const ruta = location.pathname.includes("/pages/") ? "../data/datos.json" : "data/datos.json";

    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los datos.");

        const datos = await respuesta.json();
        const guardados = leerDatos();

        if (guardados) {
            datos.salas.forEach(sala => {
                const anterior = (guardados.salas || []).find(item => item.id === sala.id);
                if (anterior) sala.estado = anterior.estado;
            });

            datos.inventario.forEach(item => {
                const anterior = (guardados.inventario || []).find(guardado => guardado.id === item.id);
                if (anterior) item.enUso = anterior.enUso;
            });

            (guardados.reservas || []).forEach(reserva => {
                const indice = datos.reservas.findIndex(item => item.id === reserva.id);
                if (indice === -1) datos.reservas.push(reserva);
                else datos.reservas[indice] = reserva;
            });
        }

        guardarDatos(datos);
    } catch (error) {
        if (!leerDatos()) {
            console.error(error);
            guardarDatos({ usuarios: [], salas: [], inventario: [], reservas: [] });
        }
    }
}

function leerDatos() {
    try {
        const datos = JSON.parse(localStorage.getItem("groovespace_datos"));
        if (datos && Array.isArray(datos.usuarios)) return datos;
    } catch (error) {
        return null;
    }
}

function obtenerDatos() {
    return leerDatos() || { usuarios: [], salas: [], inventario: [], reservas: [] };
}

function guardarDatos(datos) {
    localStorage.setItem("groovespace_datos", JSON.stringify(datos));
}

function obtenerUsuario() {
    try {
        return JSON.parse(localStorage.getItem("groovespace_usuario_activo"));
    } catch (error) {
        localStorage.removeItem("groovespace_usuario_activo");
        return null;
    }
}

function configurarLogin() {
    const modal = document.getElementById("modal-login");
    const abrir = document.getElementById("btn-login-nav");
    const cerrar = document.getElementById("btn-cerrar-modal");
    const formulario = document.getElementById("form-login");

    if (abrir && modal) abrir.onclick = function() { modal.classList.add("activo"); };
    if (cerrar && modal) cerrar.onclick = function() { modal.classList.remove("activo"); };
    if (!formulario) return;

    formulario.onsubmit = function(event) {
        event.preventDefault();
        const nombre = document.getElementById("login-user").value.trim().toLowerCase();
        const clave = document.getElementById("login-pass").value;
        const usuario = obtenerDatos().usuarios.find(item =>
            item.username.toLowerCase() === nombre && item.password === clave
        );

        if (!usuario) {
            alert("Usuario o contraseña incorrectos.");
            return;
        }

        localStorage.setItem("groovespace_usuario_activo", JSON.stringify(usuario));
        if (modal) modal.classList.remove("activo");
        actualizarUsuario();
        mostrarSalas();
        mostrarMisReservas();
    };
}

function actualizarUsuario() {
    const usuario = obtenerUsuario();
    const contenedor = document.getElementById("contenedor-usuario-nav");
    const titulo = document.getElementById("titulo-bienvenida");

    if (contenedor) {
        contenedor.innerHTML = "";
        if (usuario) {
            const nombre = document.createElement("span");
            nombre.textContent = usuario.nombre + " (" + usuario.rol + ")";
            const salir = document.createElement("button");
            salir.className = "btn-salir";
            salir.textContent = "Cerrar sesión";
            salir.onclick = function() {
                localStorage.removeItem("groovespace_usuario_activo");
                location.href = location.pathname.includes("/pages/") ? "../index.html" : "index.html";
            };
            contenedor.append(nombre, salir);
        } else {
            const entrar = document.createElement("button");
            entrar.id = "btn-login-nav";
            entrar.textContent = "Iniciar sesión";
            if (!document.getElementById("modal-login")) entrar.onclick = function() { location.href = "../index.html"; };
            contenedor.append(entrar);
        }
    }

    if (titulo) titulo.textContent = usuario ? "Bienvenido a GrooveSpace, " + usuario.nombre : "Bienvenido a GrooveSpace";
    if (usuario && usuario.rol !== "musico") mostrarPanel(usuario);
}

function mostrarSalas() {
    const lista = document.getElementById("lista-salas");
    if (!lista) return;

    const salas = obtenerDatos().salas;
    lista.innerHTML = salas.map(sala =>
        '<article class="tarjeta"><h3>' + sala.nombre + '</h3><p>Estado: ' + sala.estado +
        '</p><p>Desde $' + sala.precioFijo + ' por hora</p></article>'
    ).join("");

    if (!salas.length) lista.textContent = "No hay salas para mostrar.";
}

function crearTabla(titulos, filas) {
    const encabezado = titulos.map(titulo => "<th>" + titulo + "</th>").join("");
    const cuerpo = filas.map(fila =>
        "<tr>" + fila.map(valor => "<td>" + valor + "</td>").join("") + "</tr>"
    ).join("");

    return '<table class="tabla-panel"><thead><tr>' + encabezado +
        "</tr></thead><tbody>" + cuerpo + "</tbody></table>";
}

function mostrarPanel(usuario) {
    const principal = document.querySelector("main");
    const menu = document.querySelector("nav ul");
    const datos = obtenerDatos();
    if (!principal) return;
    if (menu) menu.style.display = "none";

    if (usuario.rol === "dueño") {
        const reservas = datos.reservas.map(reserva => {
            const cliente = datos.usuarios.find(item => item.id === reserva.usuarioId);
            const sala = datos.salas.find(item => item.id === reserva.salaId);
            return [
                cliente ? cliente.nombre : "Usuario",
                reserva.sala || (sala ? sala.nombre : "Sala"),
                reserva.fecha || "",
                "$" + (reserva.total || reserva.precio || 0),
                extrasComoTexto(reserva.extras || reserva.insExtra, datos)
            ];
        });
    if (!reservas.length) reservas.push(["No hay reservas.", "", "", "", ""]);

        const salas = datos.salas.map(sala => [sala.nombre, sala.estado, "$" + sala.precioFijo]);
        const inventario = datos.inventario.map(item => [item.tipo, item.cantidadTotal - item.enUso]);

        principal.innerHTML = "<section><h1>Panel gerencial</h1><h2>Reservas registradas</h2>" +
            crearTabla(["Usuario", "Sala", "Fecha", "Total", "Adicionales"], reservas) +
            "<h2>Salas</h2>" + crearTabla(["Sala", "Estado", "Precio por hora"], salas) +
            "<h2>Equipamiento</h2>" + crearTabla(["Artículo", "Disponible"], inventario) + "</section>";
    }

    if (usuario.rol === "encargado") {
        const salas = datos.salas.map(sala => [
            sala.nombre,
            sala.estado,
            '<select aria-label="Estado de ' + sala.nombre + '" onchange="cambiarEstadoSala(\'' + sala.id + '\', this.value)">' +
                '<option value="Disponible" ' + (sala.estado === "Disponible" ? "selected" : "") + '>Disponible</option>' +
                '<option value="Mantenimiento" ' + (sala.estado === "Mantenimiento" ? "selected" : "") + '>Mantenimiento</option>' +
            "</select>"
        ]);

        const inventario = datos.inventario.map(item => [
            item.tipo,
            item.cantidadTotal,
            item.enUso,
            '<button onclick="modificarInventario(\'' + item.id + '\', 1)">+ Uso</button> ' +
            '<button onclick="modificarInventario(\'' + item.id + '\', -1)">- Uso</button>'
        ]);

        principal.innerHTML = "<section><h1>Panel operativo</h1><h2>Estado de las salas</h2>" +
            crearTabla(["Sala", "Estado", "Actualizar"], salas) +
            "<h2>Inventario</h2>" +
            crearTabla(["Artículo", "Total", "En uso", "Acciones"], inventario) + "</section>";
    }
}

function extrasComoTexto(extras, datos) {
    if (!extras) return "Sin adicionales";
    return extras.map(extra => {
        const item = datos.inventario.find(inventario => inventario.id === extra);
        return item ? item.tipo : extra;
    }).join(", ") || "Sin adicionales";
}

window.cambiarEstadoSala = function(id, estado) {
    const datos = obtenerDatos();
    const sala = datos.salas.find(item => item.id === id);
    if (!sala) return;
    sala.estado = estado;
    guardarDatos(datos);
    mostrarPanel(obtenerUsuario());
    mostrarSalas();
};

window.modificarInventario = function(id, cambio) {
    const datos = obtenerDatos();
    const item = datos.inventario.find(inventario => inventario.id === id);
    if (!item) return;

    const uso = item.enUso + cambio;
    if (uso < 0 || uso > item.cantidadTotal) {
        alert("La cantidad debe estar entre cero y el total.");
        return;
    }

    item.enUso = uso;
    guardarDatos(datos);
    mostrarPanel(obtenerUsuario());
};

function cargarSalas() {
    const select = document.getElementById("sala");
    const extras = document.getElementById("lista-extras");
    if (!select) return;

    const datos = obtenerDatos();
    select.innerHTML = "<option value=''>Selecciona una sala...</option>";
    datos.salas.forEach(sala => {
        const opcion = document.createElement("option");
        opcion.value = sala.id;
        opcion.textContent = sala.nombre + " — $" + sala.precioFijo + "/hora";
        opcion.disabled = sala.estado !== "Disponible";
        select.append(opcion);
    });

    if (!extras) return;
    extras.innerHTML = "";
    datos.inventario.forEach(item => {
        const disponibles = item.cantidadTotal - item.enUso;
        const etiqueta = document.createElement("label");
        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.name = "extras";
        casilla.value = item.id;
        casilla.disabled = disponibles < 1;
        etiqueta.append(casilla, document.createTextNode(" " + item.tipo + " ($" +
            item.precioHora + "/hora, " + disponibles + " disponibles)"));
        extras.append(etiqueta);
    });
}

function configurarReserva() {
    const formulario = document.getElementById("form-reserva");
    const select = document.getElementById("sala");
    const duracion = document.getElementById("duracion");
    const total = document.getElementById("total-estimado");
    if (!formulario || !select || !duracion) return;

    function calcularTotal() {
        const datos = obtenerDatos();
        const sala = datos.salas.find(item => item.id === select.value);
        const extras = document.querySelectorAll("input[name='extras']:checked");
        let precioExtras = 0;
        extras.forEach(casilla => {
            const item = datos.inventario.find(inventario => inventario.id === casilla.value);
            if (item) precioExtras += item.precioHora;
        });

        const horas = Number(duracion.value) || 0;
        const importe = sala && sala.estado === "Disponible"
            ? (sala.precioFijo + precioExtras) * horas
            : 0;
        if (total) total.textContent = "$" + importe + " ARS";
        return importe;
    }

    formulario.addEventListener("input", calcularTotal);
    formulario.addEventListener("change", calcularTotal);
    formulario.onsubmit = function(event) {
        event.preventDefault();
        const usuario = obtenerUsuario();
        if (!usuario || usuario.rol !== "musico") {
            alert("Inicia sesión como músico desde la página de Inicio para solicitar una reserva.");
            location.href = "../index.html";
            return;
        }

        const datos = obtenerDatos();
        const sala = datos.salas.find(item => item.id === select.value);
        const importe = calcularTotal();
        if (!sala || sala.estado !== "Disponible" || !importe) {
            alert("Selecciona una sala disponible y una duración válida.");
            return;
        }

        const extras = [];
        document.querySelectorAll("input[name='extras']:checked").forEach(casilla => extras.push(casilla.value));
        const reserva = {
            id: Date.now(),
            usuarioId: usuario.id,
            salaId: sala.id,
            sala: sala.nombre,
            fecha: document.getElementById("fecha").value,
            hora: document.getElementById("hora").value,
            duracion: Number(duracion.value),
            extras: extras,
            estado: "Confirmada",
            total: importe
        };

        datos.reservas.push(reserva);
        guardarDatos(datos);
        location.href = "confirmacion.html?id=" + reserva.id;
    };
}

function mostrarMisReservas() {
    const lista = document.getElementById("lista-reservas");
    if (!lista) return;

    const resumen = document.getElementById("resumen-reservas");
    const usuario = obtenerUsuario();
    const datos = obtenerDatos();
    if (!usuario || usuario.rol !== "musico") {
        const mensaje = "Inicia sesión como músico para consultar tus reservas.";
        if (resumen) resumen.textContent = mensaje;
        lista.textContent = mensaje;
        return;
    }

    const reservas = datos.reservas.filter(reserva => reserva.usuarioId === usuario.id)
        .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
    const hoy = new Date();
    const fechaHoy = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") +
        "-" + String(hoy.getDate()).padStart(2, "0");
    const proximas = reservas.filter(reserva =>
        (reserva.estado || "Confirmada") === "Confirmada" && reserva.fecha >= fechaHoy
    );

    if (resumen) resumen.textContent = reservas.length + " reserva(s) en total · " + proximas.length + " próxima(s)";
    lista.innerHTML = "";

    if (!reservas.length) {
        lista.textContent = "Todavía no tienes reservas registradas.";
        return;
    }

    reservas.forEach(reserva => {
        const sala = datos.salas.find(item => item.id === reserva.salaId);
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";
        tarjeta.innerHTML = "<h2>" + (reserva.sala || (sala ? sala.nombre : "Sala")) + "</h2>" +
            "<p>" + formatearFecha(reserva.fecha) + " a las " + (reserva.hora || "18:00") +
            " hs, " + (reserva.duracion || 1) + " hora(s)</p>" +
            "<p>Equipamiento extra: " + extrasComoTexto(reserva.extras || reserva.insExtra, datos) + "</p>" +
            "<p>Total: $" + (reserva.total || reserva.precio || 0) + "</p>" +
            "<p>Estado: " + (reserva.estado || "Confirmada") + "</p>";

        if (!reserva.estado || reserva.estado === "Confirmada") {
            const cancelar = document.createElement("button");
            cancelar.textContent = "Cancelar turno";
            cancelar.onclick = function() { cancelarTurno(reserva.id); };
            tarjeta.append(cancelar);
        }
        lista.append(tarjeta);
    });
}

function cancelarTurno(id) {
    if (!confirm("¿Confirmas la cancelación de este ensayo?")) return;
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id);
    if (!reserva) return;
    reserva.estado = "Cancelada";
    guardarDatos(datos);
    mostrarMisReservas();
}

function mostrarConfirmacion() {
    const detalle = document.getElementById("detalle-reserva");
    if (!detalle) return;

    const usuario = obtenerUsuario();
    const datos = obtenerDatos();
    const id = Number(new URLSearchParams(location.search).get("id"));
    const reserva = datos.reservas.find(item => item.id === id && usuario && item.usuarioId === usuario.id);
    if (!reserva) {
        detalle.textContent = "No encontramos una reserva para mostrar.";
        return;
    }

    const sala = datos.salas.find(item => item.id === reserva.salaId);
    document.getElementById("detalle-sala").textContent = sala ? sala.nombre : reserva.sala;
    document.getElementById("detalle-fecha").textContent = formatearFecha(reserva.fecha);
    document.getElementById("detalle-horario").textContent =
        (reserva.hora || "18:00") + " hs, por " + (reserva.duracion || 1) + " hora(s)";
    document.getElementById("detalle-extras").textContent = extrasComoTexto(reserva.extras || reserva.insExtra, datos);
    document.getElementById("detalle-total").textContent = "$" + (reserva.total || reserva.precio || 0) + " ARS";
}

function formatearFecha(fecha) {
    if (!fecha) return "Fecha pendiente";
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date(fecha + "T12:00:00"));
}
