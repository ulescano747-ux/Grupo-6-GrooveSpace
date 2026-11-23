// Datos por defecto de respaldo (se usan si el fetch falla o se abre con file://)
const DATOS_POR_DEFECTO = {
    usuarios: [
        { id: 1, username: "musico1", nombre: "Lucas (Músico)", rol: "musico", password: "123" },
        { id: 2, username: "jefe", nombre: "Martín (Dueño)", rol: "dueño", password: "123" },
        { id: 3, username: "staff", nombre: "Sofía (Encargada)", rol: "encargado", password: "123" }
    ],
    salas: [
        { id: "standard", nombre: "Sala Standard", estado: "Disponible", precioFijo: 3500 },
        { id: "premium", nombre: "Sala Premium", estado: "Disponible", precioFijo: 5500 },
        { id: "bateria", nombre: "Sala de Batería", estado: "Mantenimiento", precioFijo: 4000 }
    ],
    inventario: [
        { id: "i1", tipo: "Guitarra Eléctrica", cantidadTotal: 3, enUso: 1 },
        { id: "i2", tipo: "Pedalera", cantidadTotal: 2, enUso: 0 },
        { id: "i3", tipo: "Platillos", cantidadTotal: 4, enUso: 2 }
    ],
    reservas: [
        { id: 101, usuarioId: 1, sala: "Sala Premium", fecha: "2026-08-14", hora: "18:00", duracion: 2, extras: ["Pedalera de efectos"], estado: "Confirmada", total: 11000 }
    ]
};

document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosIniciales();
    actualizarInterfazUsuario();
    configurarLoginModal();
    
    // Ejecutar lógica según la página actual
    if (document.getElementById("lista-reservas")) {
        cargarMisReservas();
    }

    if (document.getElementById("form-reserva")) {
        configurarFormularioReserva();
    }
});

// 1. Carga Asincrónica con Fallback Seguro
async function cargarDatosIniciales() {
    const datosExistentes = localStorage.getItem("groovespace_datos");
    
    if (datosExistentes) {
        try {
            const parsed = JSON.parse(datosExistentes);
            if (parsed.usuarios && parsed.salas && parsed.inventario && parsed.usuarios.length >= 3) {
                return;
            }
        } catch (e) {
            console.warn("Datos obsoletos en localStorage. Recargando...");
        }
    }

    try {
        const esPaginaInterna = window.location.pathname.includes("/pages/");
        const rutaJson = esPaginaInterna ? "../data/datos.json" : "data/datos.json";
        
        const respuesta = await fetch(rutaJson);
        if (!respuesta.ok) throw new Error("No se pudo obtener datos.json");
        
        const datos = await respuesta.json();
        localStorage.setItem("groovespace_datos", JSON.stringify(datos));
        console.log("Datos cargados correctamente desde JSON.");
    } catch (error) {
        console.warn("Servidor/CORS no disponible. Inicializando con datos de respaldo.", error);
        localStorage.setItem("groovespace_datos", JSON.stringify(DATOS_POR_DEFECTO));
    }
}

// Métodos de localStorage
function obtenerDatosApp() {
    try {
        const datos = JSON.parse(localStorage.getItem("groovespace_datos"));
        if (datos && datos.usuarios && datos.usuarios.length > 0) {
            return datos;
        }
    } catch (e) {
        console.error("Error al leer localStorage:", e);
    }
    return DATOS_POR_DEFECTO;
}

function guardarDatosApp(datos) {
    localStorage.setItem("groovespace_datos", JSON.stringify(datos));
}

function obtenerUsuarioSesion() {
    try {
        return JSON.parse(localStorage.getItem("groovespace_usuario_activo"));
    } catch (e) {
        return null;
    }
}

// 2. Control del Modal de Login (Sintaxis corregida)
function configurarLoginModal() {
    const btnOpen = document.getElementById("btn-login-nav");
    const modal = document.getElementById("modal-login");
    const btnClose = document.getElementById("btn-cerrar-modal");
    const formLogin = document.getElementById("form-login");

    if (btnOpen) {
        btnOpen.onclick = () => modal?.classList.add("activo");
    }
    if (btnClose) {
        btnClose.onclick = () => modal?.classList.remove("activo");
    }

    if (formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const userVal = document.getElementById("login-user").value.trim();
            const passVal = document.getElementById("login-pass").value.trim();

            const datos = obtenerDatosApp();
            const usuarioEncontrado = datos.usuarios.find(
                u => u.username.toLowerCase() === userVal.toLowerCase() && u.password === passVal
            );

            if (usuarioEncontrado) {
                localStorage.setItem("groovespace_usuario_activo", JSON.stringify(usuarioEncontrado));
                modal?.classList.remove("activo");
                actualizarInterfazUsuario();
                alert(`¡Bienvenido/a, ${usuarioEncontrado.nombre}!`);
                if (document.getElementById("lista-reservas")) cargarMisReservas();
            } else {
                alert("Credenciales incorrectas.\n\nPrueba con los siguientes usuarios:\n- musico1 / 123 (Músico)\n- jefe / 123 (Dueño)\n- staff / 123 (Encargado)");
            }
        };
    }
}

// Actualización del encabezado según estado de sesión
function actualizarInterfazUsuario() {
    const usuario = obtenerUsuarioSesion();
    const contenedorNav = document.getElementById("contenedor-usuario-nav");
    const tituloBienvenida = document.getElementById("titulo-bienvenida");

    if (contenedorNav) {
        if (usuario) {
            contenedorNav.innerHTML = `
                <span style="color: #39ff14; font-weight: bold; margin-right: 10px;">👤 ${usuario.nombre} (${usuario.rol})</span>
                <button id="btn-logout" class="btn-logout" style="background: transparent; border: 1px solid #ff3939; color: #ff3939; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Cerrar Sesión</button>
            `;
            document.getElementById("btn-logout")?.addEventListener("click", () => {
                localStorage.removeItem("groovespace_usuario_activo");
                window.location.reload();
            });
        } else {
            contenedorNav.innerHTML = `
                <button id="btn-login-nav" class="btn-neon" style="padding: 5px 15px; cursor: pointer;">Iniciar Sesión</button>
            `;
            configurarLoginModal();
        }
    }

    if (tituloBienvenida) {
        tituloBienvenida.textContent = usuario 
            ? `Bienvenido a GrooveSpace, ${usuario.nombre}` 
            : "Bienvenido a GrooveSpace";
    }

    if (usuario) {
        renderizarVistaPorRol(usuario);
    }
}

// 3. Vistas y Enrutamiento según Diagrama de Roles
function renderizarVistaPorRol(usuario) {
    const mainContenedor = document.querySelector("main");
    const navUl = document.querySelector("nav ul");
    const datos = obtenerDatosApp();

    if (!mainContenedor) return;

    if (usuario.rol !== "musico") {
        if (navUl) navUl.style.display = "none"; 
    } else {
        if (navUl) navUl.style.display = "flex";
        return;
    }

    // Panel del DUEÑO (Solo lectura)
    if (usuario.rol === "dueño") {
        mainContenedor.innerHTML = `
            <section style="padding: 20px;">
                <h2>Panel Gerencial (Dueño)</h2>
                
                <h3>Historial de Solicitudes (Agenda)</h3>
                <table border="1" width="100%" style="margin-bottom: 20px; text-align: left; border-collapse: collapse;">
                    <tr style="background: #333;"><th>Sala</th><th>Fecha</th><th>Precio</th><th>Ins. Extra</th></tr>
                    ${(datos.reservas || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).map(r => `
                        <tr>
                            <td>${r.sala || '-'}</td>
                            <td>${r.fecha || '-'}</td>
                            <td>$${r.total || r.precio || 0}</td>
                            <td>${(r.extras || r.insExtra || []).join(", ") || "-"}</td>
                        </tr>
                    `).join("")}
                </table>

                <h3>Lista de Salas</h3>
                <table border="1" width="100%" style="margin-bottom: 20px; text-align: left; border-collapse: collapse;">
                    <tr style="background: #333;"><th>Sala</th><th>Estado</th><th>Precio Fijo</th></tr>
                    ${(datos.salas || []).map(s => `
                        <tr><td>${s.nombre}</td><td>${s.estado}</td><td>$${s.precioFijo}</td></tr>
                    `).join("")}
                </table>

                <h3>Historial de Instrumentos Extra Disponibles</h3>
                <table border="1" width="100%" style="text-align: left; border-collapse: collapse;">
                    <tr style="background: #333;"><th>Instrumento</th><th>Cantidad Disponible</th></tr>
                    ${(datos.inventario || []).map(i => `
                        <tr><td>${i.tipo}</td><td>${i.cantidadTotal - i.enUso}</td></tr>
                    `).join("")}
                </table>
            </section>
        `;
    }

    // Panel del ENCARGADO (Modificable)
    if (usuario.rol === "encargado") {
        mainContenedor.innerHTML = `
            <section style="padding: 20px;">
                <h2>Panel Operativo (Encargado)</h2>
                
                <h3>Lista de Salas (Modificable en estado)</h3>
                <table border="1" width="100%" style="margin-bottom: 20px; text-align: left; border-collapse: collapse;">
                    <tr style="background: #333;"><th>Sala</th><th>Estado actual</th><th>Acción</th></tr>
                    ${(datos.salas || []).map((s, index) => `
                        <tr>
                            <td>${s.nombre}</td>
                            <td>${s.estado}</td>
                            <td>
                                <select onchange="cambiarEstadoSala(${index}, this.value)" style="background: #222; color: #fff; padding: 5px;">
                                    <option value="Disponible" ${s.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
                                    <option value="Mantenimiento" ${s.estado === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                                </select>
                            </td>
                        </tr>
                    `).join("")}
                </table>

                <h3>Historial de Inventario (Modificable)</h3>
                <table border="1" width="100%" style="text-align: left; border-collapse: collapse;">
                    <tr style="background: #333;"><th>Tipo Ins.</th><th>Cantidad Total</th><th>En Uso</th><th>Acción (En Uso)</th></tr>
                    ${(datos.inventario || []).map((i, index) => `
                        <tr>
                            <td>${i.tipo}</td>
                            <td>${i.cantidadTotal}</td>
                            <td>${i.enUso}</td>
                            <td>
                                <button onclick="modificarInventario(${index}, 1)" style="background: #39ff14; color: #000; cursor: pointer; padding: 2px 8px;">+ Uso</button>
                                <button onclick="modificarInventario(${index}, -1)" style="background: #ff3939; color: #fff; cursor: pointer; padding: 2px 8px;">- Uso</button>
                            </td>
                        </tr>
                    `).join("")}
                </table>
            </section>
        `;
    }
}

// Funciones globales para el Encargado
window.cambiarEstadoSala = function(indexSala, nuevoEstado) {
    const datos = obtenerDatosApp();
    datos.salas[indexSala].estado = nuevoEstado;
    guardarDatosApp(datos);
    renderizarVistaPorRol(obtenerUsuarioSesion());
};

window.modificarInventario = function(indexInv, modificador) {
    const datos = obtenerDatosApp();
    const item = datos.inventario[indexInv];
    
    let nuevoUso = item.enUso + modificador;
    if (nuevoUso >= 0 && nuevoUso <= item.cantidadTotal) {
        item.enUso = nuevoUso;
        guardarDatosApp(datos);
        renderizarVistaPorRol(obtenerUsuarioSesion());
    } else {
        alert("Operación inválida: excede la cantidad disponible.");
    }
};

// 4. Renderizado de "Mis Reservas"
function cargarMisReservas() {
    const contenedor = document.getElementById("lista-reservas");
    if (!contenedor) return;

    const usuario = obtenerUsuarioSesion();
    const datos = obtenerDatosApp();

    if (!usuario || usuario.rol !== "musico") {
        contenedor.innerHTML = `
            <div style="border: 1px dashed #ff3939; padding: 20px; border-radius: 5px; text-align: center;">
                <p>Inicia sesión como Músico para visualizar y gestionar tus turnos de ensayo.</p>
            </div>
        `;
        return;
    }

    const misReservas = datos.reservas.filter(r => r.usuarioId === usuario.id);

    if (misReservas.length === 0) {
        contenedor.innerHTML = "<p>No posees reservas registradas en el sistema.</p>";
        return;
    }

    contenedor.innerHTML = misReservas.map(reserva => `
        <article style="border: 1px solid ${reserva.estado === 'Confirmada' ? '#39ff14' : '#555'}; padding: 15px; margin-bottom: 15px; border-radius: 5px; background: #1e1e1e;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="color: ${reserva.estado === 'Confirmada' ? '#39ff14' : '#fff'}; margin: 0;">${reserva.sala}</h3>
                <span style="padding: 3px 8px; border-radius: 3px; font-size: 0.8rem; background-color: ${reserva.estado === 'Confirmada' ? '#1b4311' : '#333'}; color: ${reserva.estado === 'Confirmada' ? '#39ff14' : '#aaa'};">${reserva.estado}</span>
            </div>
            <p style="margin: 8px 0;"><strong>Fecha y Hora:</strong> ${reserva.fecha} - ${reserva.hora} hs (${reserva.duracion} hs)</p>
            <p style="margin: 8px 0; color: #aaa;"><strong>Equipamiento extra:</strong> ${reserva.extras && reserva.extras.length > 0 ? reserva.extras.join(", ") : "Sin adicionales"}</p>
            <p style="margin: 8px 0; color: #39ff14;"><strong>Total:</strong> $${reserva.total || 0}</p>
            ${reserva.estado === "Confirmada" ? `
                <button onclick="cancelarTurno(${reserva.id})" style="background-color: transparent; border: 1px solid #ff3939; color: #ff3939; padding: 6px 12px; cursor: pointer; border-radius: 4px; margin-top: 5px;">Cancelar Turno</button>
            ` : ""}
        </article>
    `).join("");
}

window.cancelarTurno = function(idReserva) {
    if (confirm("¿Confirmas la cancelación de este ensayo?")) {
        const datos = obtenerDatosApp();
        const index = datos.reservas.findIndex(r => r.id === idReserva);
        if (index !== -1) {
            datos.reservas[index].estado = "Cancelada";
            guardarDatosApp(datos);
            cargarMisReservas();
        }
    }
};

// 5. Formulario de Reserva
function configurarFormularioReserva() {
    const form = document.getElementById("form-reserva");
    const selectSala = document.getElementById("sala");
    const inputDuracion = document.getElementById("duracion");
    const visorTotal = document.getElementById("total-estimado");

    const precios = { standard: 3500, premium: 5500, bateria: 4000 };

    function recalcularPrecio() {
        const salaKey = selectSala.value;
        const hs = parseInt(inputDuracion.value) || 1;
        let total = (precios[salaKey] || 0) * hs;

        const extrasCount = document.querySelectorAll('input[name="extras"]:checked').length;
        total += extrasCount * 500 * hs;

        if (visorTotal) visorTotal.textContent = total > 0 ? `$${total} ARS` : "$0 ARS";
        return total;
    }

    selectSala?.addEventListener("change", recalcularPrecio);
    inputDuracion?.addEventListener("input", recalcularPrecio);
    document.querySelectorAll('input[name="extras"]').forEach(c => c.addEventListener("change", recalcularPrecio));

    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const usuario = obtenerUsuarioSesion();

        if (!usuario || usuario.rol !== "musico") {
            alert("Debes iniciar sesión como Músico para realizar una reserva.");
            document.getElementById("modal-login")?.classList.add("activo");
            return;
        }

        const salaTexto = selectSala.options[selectSala.selectedIndex].text;
        const extrasSeleccionados = [];
        document.querySelectorAll('input[name="extras"]:checked').forEach(cb => {
            const label = document.querySelector(`label[for="${cb.id}"]`);
            if (label) extrasSeleccionados.push(label.textContent);
        });

        const nuevaReserva = {
            id: Date.now(),
            usuarioId: usuario.id,
            sala: salaTexto,
            fecha: document.getElementById("fecha").value,
            hora: document.getElementById("hora").value,
            duracion: parseInt(inputDuracion.value),
            extras: extrasSeleccionados,
            estado: "Confirmada",
            total: recalcularPrecio()
        };

        const datos = obtenerDatosApp();
        datos.reservas.push(nuevaReserva);
        guardarDatosApp(datos);

        alert("¡Turno registrado exitosamente!");
        window.location.href = "mis-reservas.html";
    });
}