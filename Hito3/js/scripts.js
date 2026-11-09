const CLAVE_DATOS = "groovespace_datos";
const CLAVE_USUARIO = "groovespace_usuario_activo";

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
    await cargarDatos();
    configurarLogin();
    ponerFechaMinima();
    actualizarPantalla();

    window.addEventListener("storage", function(event) {
        if (event.key === CLAVE_DATOS) actualizarPantalla();
    });
}

async function cargarDatos() {
    const ruta = location.pathname.includes("/pages/") ? "../data/datos.json" : "data/datos.json";

    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los datos.");

        const datos = await respuesta.json();
        const guardados = leerDatos();

        if (guardados) {
            (guardados.salas || []).forEach(salaVieja => {
                const sala = datos.salas.find(item => item.id === salaVieja.id);
                if (sala) {
                    if (salaVieja.estado === "Disponible") sala.estado = "Liberada";
                    else if (salaVieja.estado === "Mantenimiento") sala.estado = "En mantenimiento";
                    else sala.estado = salaVieja.estado;
                }
            });

            (guardados.inventario || []).forEach(itemViejo => {
                const item = datos.inventario.find(actual => actual.id === itemViejo.id);
                if (item) item.enUso = itemViejo.enUso;
            });

            (guardados.reservas || []).forEach(reservaVieja => {
                const indice = datos.reservas.findIndex(item => item.id === reservaVieja.id);
                if (indice === -1) datos.reservas.push(reservaVieja);
                else datos.reservas[indice] = reservaVieja;
            });
        }

        datos.reservas.forEach(reserva => normalizarReserva(reserva, datos));
        guardarDatos(datos);
    } catch (error) {
        if (!leerDatos()) {
            console.error(error);
            guardarDatos({ politicaCancelacion: { horasAnticipacion: 24 }, usuarios: [], salas: [], inventario: [], reservas: [] });
        }
    }
}

function normalizarReserva(reserva, datos) {
    const sala = datos.salas.find(item => item.id === reserva.salaId || item.nombre === reserva.sala);
    if (sala) {
        reserva.salaId = sala.id;
        reserva.sala = sala.nombre;
    }
    if (!reserva.hora) reserva.hora = "18:00";
    if (!reserva.duracion) reserva.duracion = 1;
    if (!reserva.estado) reserva.estado = "Confirmada";
    if (reserva.demora === undefined) reserva.demora = false;
    if (!reserva.total) reserva.total = reserva.precio || 0;
    if (!reserva.extras) reserva.extras = reserva.insExtra || [];

    reserva.extras = reserva.extras.map(extra => {
        const item = datos.inventario.find(equipo =>
            equipo.id === extra || equipo.tipo.toLowerCase() === String(extra).toLowerCase()
        );
        return item ? item.id : extra;
    });
}

function leerDatos() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_DATOS));
        return datos && Array.isArray(datos.usuarios) ? datos : null;
    } catch (error) {
        return null;
    }
}

function obtenerDatos() {
    return leerDatos() || { politicaCancelacion: { horasAnticipacion: 24 }, usuarios: [], salas: [], inventario: [], reservas: [] };
}

function guardarDatos(datos) {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
}

function obtenerUsuario() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_USUARIO));
    } catch (error) {
        localStorage.removeItem(CLAVE_USUARIO);
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

        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
        if (modal) modal.classList.remove("activo");
        actualizarPantalla();
    };
}

function actualizarPantalla() {
    actualizarMenu();
    const usuario = obtenerUsuario();

    if (usuario && usuario.rol === "encargado") {
        mostrarPanelEncargado();
        return;
    }
    if (usuario && usuario.rol === "dueño") {
        mostrarPanelDueno();
        return;
    }

    mostrarSalas();
    cargarSalas();
    mostrarMisReservas();
    mostrarConfirmacion();
}

function actualizarMenu() {
    const usuario = obtenerUsuario();
    const contenedor = document.getElementById("contenedor-usuario-nav");
    const titulo = document.getElementById("titulo-bienvenida");
    if (titulo) titulo.textContent = usuario ? "Bienvenido a GrooveSpace, " + usuario.nombre : "Bienvenido a GrooveSpace";
    if (!contenedor) return;

    contenedor.innerHTML = "";
    if (!usuario) {
        const entrar = document.createElement("button");
        entrar.id = "btn-login-nav";
        entrar.textContent = "Iniciar sesión";
        if (!document.getElementById("modal-login")) entrar.onclick = function() { location.href = "../index.html"; };
        contenedor.append(entrar);
        configurarLogin();
        return;
    }

    const nombre = document.createElement("span");
    nombre.textContent = usuario.nombre + " (" + usuario.rol + ")";
    nombre.style.marginRight = "10px";
    const salir = document.createElement("button");
    salir.className = "btn-salir";
    salir.textContent = "Cerrar sesión";
    salir.onclick = function() {
        localStorage.removeItem(CLAVE_USUARIO);
        location.href = location.pathname.includes("/pages/") ? "../index.html" : "index.html";
    };
    contenedor.append(nombre, salir);
}

function mostrarSalas() {
    const lista = document.getElementById("lista-salas");
    if (!lista) return;

    lista.innerHTML = "";
    obtenerDatos().salas.forEach(sala => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";
        tarjeta.innerHTML = "<h3>" + sala.nombre + "</h3><p>Estado: " + sala.estado +
            "</p><p>Desde $" + sala.precioFijo + " por hora</p>";
        lista.append(tarjeta);
    });
}

function ponerFechaMinima() {
    const fecha = document.getElementById("fecha");
    if (!fecha) return;

    const hoy = new Date();
    fecha.min = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") +
        "-" + String(hoy.getDate()).padStart(2, "0");
}

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
        opcion.disabled = sala.estado === "En mantenimiento";
        select.append(opcion);
    });

    if (!extras) return;
    extras.innerHTML = "";
    datos.inventario.forEach(item => {
        const label = document.createElement("label");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.name = "extras";
        check.value = item.id;
        check.disabled = item.cantidadTotal < 1;
        label.append(check, document.createTextNode(" " + item.tipo + " ($" +
            item.precioHora + "/hora, " + item.cantidadTotal + " en el inventario)"));
        extras.append(label);
    });
}

function fechaHora(fecha, hora) {
    return new Date(fecha + "T" + hora + ":00");
}

function hayCruce(salaId, fecha, hora, duracion, datos) {
    const inicioNuevo = fechaHora(fecha, hora).getTime();
    const finNuevo = inicioNuevo + duracion * 60 * 60 * 1000;

    return datos.reservas.some(reserva => {
        if (reserva.salaId !== salaId || reserva.estado === "Cancelada" || reserva.estado === "Finalizada") return false;
        const inicio = fechaHora(reserva.fecha, reserva.hora).getTime();
        const fin = inicio + reserva.duracion * 60 * 60 * 1000;
        return inicioNuevo < fin && inicio < finNuevo;
    });
}

function extrasDisponibles(extras, fecha, hora, duracion, datos) {
    const inicioNuevo = fechaHora(fecha, hora).getTime();
    const finNuevo = inicioNuevo + duracion * 60 * 60 * 1000;

    for (let i = 0; i < extras.length; i++) {
        const item = datos.inventario.find(inventario => inventario.id === extras[i]);
        if (!item) return false;

        let ocupados = 0;
        datos.reservas.forEach(reserva => {
            if (reserva.estado === "Cancelada" || reserva.estado === "Finalizada") return;
            const inicioReserva = fechaHora(reserva.fecha, reserva.hora).getTime();
            const finReserva = inicioReserva + reserva.duracion * 60 * 60 * 1000;
            const cruce = inicioNuevo < finReserva && inicioReserva < finNuevo;
            if (cruce && (reserva.extras || []).includes(item.id)) ocupados++;
        });

        const usoActual = fecha === fechaLocal() ? item.enUso : 0;
        if (item.cantidadTotal - usoActual - ocupados < 1) return false;
    }
    return true;
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
        let precioExtras = 0;
        document.querySelectorAll("input[name='extras']:checked").forEach(check => {
            const item = datos.inventario.find(extra => extra.id === check.value);
            if (item) precioExtras += item.precioHora;
        });

        const importe = sala && sala.estado !== "En mantenimiento"
            ? (sala.precioFijo + precioExtras) * (Number(duracion.value) || 0)
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
            alert("Inicia sesión como músico para solicitar una reserva.");
            location.href = "../index.html";
            return;
        }

        const datos = obtenerDatos();
        const sala = datos.salas.find(item => item.id === select.value);
        const fecha = document.getElementById("fecha").value;
        const hora = document.getElementById("hora").value;
        const horas = Number(duracion.value);
        const extras = [];
        document.querySelectorAll("input[name='extras']:checked").forEach(check => extras.push(check.value));
        const importe = calcularTotal();

        if (!sala || sala.estado === "En mantenimiento" || !importe) {
            alert("Selecciona una sala habilitada y una duración válida.");
            return;
        }
        if (fechaHora(fecha, hora) <= new Date()) {
            alert("El horario debe ser posterior al momento actual.");
            return;
        }
        if (hayCruce(sala.id, fecha, hora, horas, datos)) {
            alert("La sala ya tiene una reserva en ese horario.");
            return;
        }
        if (!extrasDisponibles(extras, fecha, hora, horas, datos)) {
            alert("No hay suficiente equipamiento disponible para ese horario.");
            return;
        }

        const reserva = {
            id: Date.now(),
            usuarioId: usuario.id,
            salaId: sala.id,
            sala: sala.nombre,
            fecha: fecha,
            hora: hora,
            duracion: horas,
            extras: extras,
            estado: "Confirmada",
            demora: false,
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
    const horasElemento = document.getElementById("horas-consumidas");
    const usuario = obtenerUsuario();
    const datos = obtenerDatos();

    if (!usuario || usuario.rol !== "musico") {
        lista.textContent = "Inicia sesión como músico para consultar tus reservas.";
        if (resumen) resumen.textContent = "Inicia sesión para ver el resumen.";
        if (horasElemento) horasElemento.textContent = "";
        return;
    }

    const reservas = datos.reservas.filter(reserva => reserva.usuarioId === usuario.id)
        .sort((a, b) => fechaHora(a.fecha, a.hora) - fechaHora(b.fecha, b.hora));
    const horasUsadas = reservas.reduce((total, reserva) =>
        total + (reserva.estado === "Finalizada" ? reserva.duracion : 0), 0
    );
    const proximas = reservas.filter(reserva => reserva.estado === "Confirmada");

    if (resumen) resumen.textContent = reservas.length + " reservas · " + proximas.length + " próximas";
    if (horasElemento) horasElemento.textContent = "Horas consumidas: " + horasUsadas;
    lista.innerHTML = "";

    if (!reservas.length) {
        lista.textContent = "Todavía no tienes reservas registradas.";
        return;
    }

    reservas.forEach(reserva => {
        const extras = nombresExtras(reserva.extras, datos);
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";
        tarjeta.innerHTML = "<h2>" + reserva.sala + "</h2><p>" +
            formatearFecha(reserva.fecha) + " a las " + reserva.hora + " hs · " +
            reserva.duracion + " hora(s)</p><p>Equipamiento: " +
            (extras.join(", ") || "Sin adicionales") + "</p><p>Total: $" + reserva.total +
            "</p><p>Estado: " + reserva.estado + "</p>";

        if (reserva.demora) {
            const aviso = document.createElement("p");
            aviso.className = "aviso-demora";
            aviso.textContent = reserva.mensajeDemora || "El ensayo anterior tuvo una demora.";
            tarjeta.append(aviso);
        }

        if (reserva.estado === "Confirmada") {
            if (sePuedeCancelar(reserva, datos)) {
                const cancelar = document.createElement("button");
                cancelar.textContent = "Cancelar turno";
                cancelar.onclick = function() { cancelarReserva(reserva.id); };
                tarjeta.append(cancelar);
            } else {
                const aviso = document.createElement("p");
                aviso.textContent = "Para conservar la seña, la cancelación debe hacerse con " +
                    datos.politicaCancelacion.horasAnticipacion + " horas de anticipación.";
                tarjeta.append(aviso);
            }
        }
        lista.append(tarjeta);
    });
}

function sePuedeCancelar(reserva, datos) {
    const inicio = fechaHora(reserva.fecha, reserva.hora).getTime();
    const horas = datos.politicaCancelacion.horasAnticipacion || 24;
    return inicio - Date.now() >= horas * 60 * 60 * 1000;
}

function cancelarReserva(id) {
    if (!confirm("¿Quieres cancelar esta reserva?")) return;
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id);
    if (!reserva || !sePuedeCancelar(reserva, datos)) {
        alert("Ya no se puede cancelar con la anticipación requerida.");
        return;
    }

    reserva.estado = "Cancelada";
    guardarDatos(datos);
    mostrarMisReservas();
}

function mostrarConfirmacion() {
    const detalle = document.getElementById("detalle-reserva");
    if (!detalle) return;

    const id = Number(new URLSearchParams(location.search).get("id"));
    const usuario = obtenerUsuario();
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id && usuario && item.usuarioId === usuario.id);

    if (!reserva) {
        detalle.textContent = "No encontramos una reserva para mostrar.";
        return;
    }

    const sala = datos.salas.find(item => item.id === reserva.salaId);
    document.getElementById("detalle-sala").textContent = sala ? sala.nombre : reserva.sala;
    document.getElementById("detalle-fecha").textContent = formatearFecha(reserva.fecha);
    document.getElementById("detalle-horario").textContent = reserva.hora + " hs por " + reserva.duracion + " hora(s)";
    document.getElementById("detalle-extras").textContent = nombresExtras(reserva.extras, datos).join(", ") || "Sin adicionales";
    document.getElementById("detalle-total").textContent = "$" + reserva.total + " ARS";
}

function mostrarPanelEncargado() {
    const principal = document.querySelector("main");
    const datos = obtenerDatos();
    const reservas = datos.reservas.filter(reserva =>
        reserva.estado === "Confirmada" || reserva.estado === "En curso"
    )
        .sort((a, b) => fechaHora(a.fecha, a.hora) - fechaHora(b.fecha, b.hora));

    let filas = "";
    reservas.forEach(reserva => {
        const usuario = datos.usuarios.find(item => item.id === reserva.usuarioId);
        filas += "<tr><td>" + formatearFecha(reserva.fecha) + " " + reserva.hora +
            "</td><td>" + (usuario ? usuario.nombre : "Usuario") + "</td><td>" +
            reserva.sala + "</td><td>" + reserva.estado + "</td><td>" +
            (reserva.demora ? '<span class="aviso-demora">Demora avisada</span>' : "") +
            "</td><td>" + botonesReserva(reserva) + "</td></tr>";
    });

    const salas = datos.salas.map(sala =>
        '<tr><td>' + sala.nombre + '</td><td><select onchange="cambiarEstadoSala(\'' +
        sala.id + '\', this.value)"><option ' + (sala.estado === "Liberada" ? "selected" : "") +
        '>Liberada</option><option ' + (sala.estado === "En uso" ? "selected" : "") +
        '>En uso</option><option ' + (sala.estado === "En mantenimiento" ? "selected" : "") +
        '>En mantenimiento</option></select></td></tr>'
    ).join("");

    const inventario = datos.inventario.map(item =>
        "<tr><td>" + item.tipo + "</td><td>" + (item.cantidadTotal - item.enUso) +
        " de " + item.cantidadTotal + "</td></tr>"
    ).join("");

    principal.innerHTML = "<section><h1>Panel del encargado</h1>" +
        "<h2>Reservas por horario</h2><div class='tabla-contenedor'><table class='tabla-panel'>" +
        "<thead><tr><th>Fecha y hora</th><th>Banda</th><th>Sala</th><th>Estado</th><th>Aviso</th><th>Acciones</th></tr></thead>" +
        "<tbody>" + (filas || "<tr><td colspan='6'>No hay reservas.</td></tr>") + "</tbody></table></div>" +
        "<h2>Estado de las salas</h2><table class='tabla-panel'><thead><tr><th>Sala</th><th>Estado</th></tr></thead>" +
        "<tbody>" + salas + "</tbody></table><h2>Equipamiento disponible</h2>" +
        "<table class='tabla-panel'><thead><tr><th>Artículo</th><th>Disponibilidad</th></tr></thead>" +
        "<tbody>" + inventario + "</tbody></table></section>";
}

function botonesReserva(reserva) {
    if (reserva.estado === "Confirmada") {
        return '<button onclick="iniciarEnsayo(' + reserva.id + ')">Iniciar</button> ' +
            '<button onclick="avisarDemora(' + reserva.id + ')">Marcar demora</button>';
    }
    if (reserva.estado === "En curso") {
        return '<button onclick="finalizarEnsayo(' + reserva.id + ')">Finalizar</button> ' +
            '<button onclick="avisarDemora(' + reserva.id + ')">Marcar demora</button>';
    }
    return "";
}

window.cambiarEstadoSala = function(id, estado) {
    const datos = obtenerDatos();
    const sala = datos.salas.find(item => item.id === id);
    if (!sala) return;
    sala.estado = estado;
    guardarDatos(datos);
    mostrarPanelEncargado();
};

window.iniciarEnsayo = function(id) {
    cambiarEstadoReserva(id, "En curso");
};

window.finalizarEnsayo = function(id) {
    cambiarEstadoReserva(id, "Finalizada");
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id);
    if (reserva) {
        const sala = datos.salas.find(item => item.id === reserva.salaId);
        if (sala) sala.estado = "Liberada";
        guardarDatos(datos);
    }
    mostrarPanelEncargado();
};

function cambiarEstadoReserva(id, estado) {
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id);
    if (!reserva) return;
    reserva.estado = estado;

    if (estado === "En curso") {
        const sala = datos.salas.find(item => item.id === reserva.salaId);
        if (sala) sala.estado = "En uso";
    }

    guardarDatos(datos);
    mostrarPanelEncargado();
};

window.avisarDemora = function(id) {
    const datos = obtenerDatos();
    const reserva = datos.reservas.find(item => item.id === id);
    if (!reserva) return;
    reserva.demora = true;
    reserva.mensajeDemora = "El ensayo anterior tuvo una demora. Consulta al encargado para más información.";
    guardarDatos(datos);
    mostrarPanelEncargado();
};

function mostrarPanelDueno() {
    const principal = document.querySelector("main");
    const datos = obtenerDatos();
    const fechaAnterior = document.getElementById("fecha-reporte");
    const fecha = fechaAnterior ? fechaAnterior.value : fechaLocal();
    const activas = datos.reservas.filter(reserva =>
        reserva.estado === "Confirmada" || reserva.estado === "En curso"
    );
    const enCurso = activas.filter(reserva => reserva.estado === "En curso").length;
    const liberadas = datos.salas.filter(sala => sala.estado === "Liberada").length;
    const salasEnUso = datos.salas.filter(sala => sala.estado === "En uso").length;
    const horasTotales = activas.reduce((total, reserva) => total + reserva.duracion, 0);

    const ocupacionSalas = datos.salas.map(sala => {
        const reservas = activas.filter(reserva => reserva.salaId === sala.id);
        const horas = reservas.reduce((total, reserva) => total + reserva.duracion, 0);
        return [sala.nombre, reservas.length, horas + " h", sala.estado];
    });

    const demanda = datos.salas.slice().sort((a, b) =>
        datos.reservas.filter(reserva => reserva.salaId === b.id && reserva.estado !== "Cancelada").length -
        datos.reservas.filter(reserva => reserva.salaId === a.id && reserva.estado !== "Cancelada").length
    );

    const equiposOciosos = datos.inventario.filter(item => item.enUso === 0);
    const filasEquipos = datos.inventario.map(item => [
        item.tipo,
        item.enUso + " en uso",
        (item.cantidadTotal - item.enUso) + " disponibles",
        item.enUso === 0 ? "Ocioso" : "En uso"
    ]);

    principal.innerHTML = "<section><h1>Tablero del dueño</h1>" +
        "<div class='panel-metricas'><article class='tarjeta'><h2>Reservas activas</h2><p>" +
        activas.length + "</p></article><article class='tarjeta'><h2>Ensayos en curso</h2><p>" +
        enCurso + "</p></article><article class='tarjeta'><h2>Salas en uso</h2><p>" +
        salasEnUso + "</p></article><article class='tarjeta'><h2>Salas liberadas</h2><p>" +
        liberadas + " de " + datos.salas.length + "</p></article><article class='tarjeta'><h2>Horas reservadas</h2><p>" +
        horasTotales + " h</p></article><article class='tarjeta'><h2>Equipos ociosos</h2><p>" +
        equiposOciosos.length + " tipos</p></article></div>" +
        "<h2>Ocupación por sala</h2>" + crearTabla(["Sala", "Reservas activas", "Horas reservadas", "Estado"], ocupacionSalas) +
        "<h2>Espacios más solicitados</h2><ol>" +
        demanda.map(sala => "<li>" + sala.nombre + " (" +
            datos.reservas.filter(reserva => reserva.salaId === sala.id && reserva.estado !== "Cancelada").length +
            " reserva(s))</li>").join("") + "</ol>" +
        "<h2>Inventario</h2>" + crearTabla(["Equipo", "Uso actual", "Disponible", "Estado"], filasEquipos) +
        "<h2>Reporte diario</h2><label for='fecha-reporte'>Fecha</label> " +
        "<input type='date' id='fecha-reporte' value='" + fecha + "'> " +
        "<button type='button' onclick='generarReporteDiario()'>Ver reporte</button>" +
        "<div id='resultado-reporte'>" + reporteDiario(fecha, datos) + "</div></section>";
}

function crearTabla(titulos, filas) {
    const encabezado = titulos.map(titulo => "<th>" + titulo + "</th>").join("");
    const cuerpo = filas.map(fila =>
        "<tr>" + fila.map(valor => "<td>" + valor + "</td>").join("") + "</tr>"
    ).join("");
    return "<div class='tabla-contenedor'><table class='tabla-panel'><thead><tr>" +
        encabezado + "</tr></thead><tbody>" + cuerpo + "</tbody></table></div>";
}

function generarReporteDiario() {
    const fecha = document.getElementById("fecha-reporte").value;
    const resultado = document.getElementById("resultado-reporte");
    if (resultado) resultado.innerHTML = reporteDiario(fecha, obtenerDatos());
}

function reporteDiario(fecha, datos) {
    const reservas = datos.reservas.filter(reserva =>
        reserva.fecha === fecha && reserva.estado !== "Cancelada"
    );
    const horas = reservas.reduce((total, reserva) => total + reserva.duracion, 0);
    const filas = datos.salas.map(sala => {
        const delDia = reservas.filter(reserva => reserva.salaId === sala.id);
        const horasSala = delDia.reduce((total, reserva) => total + reserva.duracion, 0);
        return [sala.nombre, delDia.length, horasSala + " h"];
    });

    return "<p>" + formatearFecha(fecha) + ": " + reservas.length +
        " reserva(s), " + horas + " hora(s) reservadas.</p>" +
        crearTabla(["Sala", "Reservas", "Horas"], filas);
}

window.generarReporteDiario = generarReporteDiario;

function nombresExtras(ids, datos) {
    return (ids || []).map(id => {
        const item = datos.inventario.find(extra => extra.id === id);
        return item ? item.tipo : id;
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "Fecha pendiente";
    return new Intl.DateTimeFormat("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date(fecha + "T12:00:00"));
}

function fechaLocal() {
    const hoy = new Date();
    return hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") +
        "-" + String(hoy.getDate()).padStart(2, "0");
}
