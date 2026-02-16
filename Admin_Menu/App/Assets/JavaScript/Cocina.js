/* ==========================================================================
   1. SEGURIDAD Y NAVEGACIÓN
   ========================================================================== */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

document.addEventListener('DOMContentLoaded', () => {
    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRol');

    if (!rol || !nombre) {
        window.location.href = "/Webcony/login";
        return;
    }

    const nombreDisplay = document.getElementById('nombre-usuario-display');
    const badgeRol = document.getElementById('badge-rol');

    if (nombreDisplay) nombreDisplay.textContent = nombre;

    if (badgeRol) {
        badgeRol.textContent = rol;
        badgeRol.classList.add(rol === 'SUPERADMIN' ? 'bg-danger' : 'bg-primary');
        if (rol === 'SUPERADMIN') document.getElementById('opciones-gerente')?.classList.remove('d-none');
    }

    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.getElementById('main-content').classList.toggle('expanded');
        });
    }

    marcarEnlaceActivo();
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    // Carga inicial y refresco automático cada 15 segundos
    cargarMonitor();
    setInterval(cargarMonitor, 15000);
});

function marcarEnlaceActivo() {
    const pathActual = window.location.pathname;
    const enlaces = document.querySelectorAll('#sidebar .nav-link');
    enlaces.forEach(enlace => {
        enlace.classList.remove('active');
        enlace.classList.add('text-white-50');
        if (enlace.getAttribute('href') === pathActual) {
            enlace.classList.add('active');
            enlace.classList.remove('text-white-50');
            enlace.classList.add('text-white');
        }
    });
}

/* ==========================================================================
   2. LÓGICA DEL MONITOR DE COCINA
   ========================================================================== */

function actualizarReloj() {
    const reloj = document.getElementById('reloj');
    if (reloj) reloj.textContent = new Date().toLocaleTimeString();
}

async function cargarMonitor() {
    const contenedor = document.getElementById('monitor-pedidos');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/cocina');
        if (!res.ok) throw new Error("Error al obtener pedidos");

        const pedidos = await res.json();

        if (pedidos.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center mt-5">
                    <h3 class="text-muted">No hay pedidos pendientes 🍕</h3>
                </div>`;
            return;
        }

        contenedor.innerHTML = pedidos.map(pedido => {
            const minutos = Math.floor((new Date() - new Date(pedido.fecha)) / 60000);

            let claseBorde = 'border-warning';
            if (minutos > 15) claseBorde = 'border-danger alerta-critica';

            return `
        <div class="col-12 col-md-6 col-lg-4 col-xl-3">
            <div class="card h-100 shadow-sm ${claseBorde} border-top border-4 card-comanda">
                <div class="card-header d-flex justify-content-between align-items-center bg-transparent">
                    <span class="fs-4 fw-bold">MESA #${pedido.mesa}</span>
                    <span class="badge ${pedido.estado === 'PENDIENTE' ? 'bg-danger' : 'bg-warning'} text-white">
                        ${pedido.estado}
                    </span>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush bg-transparent">
                        ${pedido.items.map(i => `
                            <li class="list-group-item bg-transparent fs-5 border-bottom-0 pb-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold">${i.nombre}</span>
                                    <span class="badge bg-dark rounded-pill">${i.cantidad}</span>
                                </div>
                                ${i.observaciones ? `
                                    <div class="nota-cliente mt-1">
                                        <i class="bi bi-info-circle-fill"></i> ${i.observaciones}
                                    </div>
                                ` : ''}
                            </li>
                        `).join('')}
                    </ul>
                    <hr>
                    <p class="mb-0 text-muted small">
                        <i class="bi bi-clock"></i> Recibido hace ${minutos} min
                    </p>
                </div>
                <div class="card-footer bg-transparent border-0">
                    ${pedido.estado === 'PENDIENTE'
                    ? `<button onclick="cambiarEstadoPedido(${pedido.id}, 'EN_PREPARACION', ${pedido.mesa})" class="btn btn-primary btn-lg w-100 fw-bold shadow-sm">EMPEZAR</button>`
                    : `<button onclick="cambiarEstadoPedido(${pedido.id}, 'ENTREGADO', ${pedido.mesa})" class="btn btn-success btn-lg w-100 fw-bold shadow-sm">LISTO / ENVIAR</button>`
                }
                </div>
            </div>
        </div>
    `;
        }).join('');
    } catch (e) {
        console.error("Error en monitor:", e);
    }
}

/* ==========================================================================
   3. ACCIONES DE PEDIDOS (CONEXIÓN CON ESTADOS DE MESA)
   ========================================================================== */

window.cambiarEstadoPedido = async function (id, nuevoEstado, numeroMesa) {
    try {
        // 1. Solo una petición: cambiar el estado del pedido
        const res = await fetch(`/api/pedidos/estado/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.ok) {
            if (nuevoEstado === 'ENTREGADO') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Pedido enviado a mesa`,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            await cargarMonitor();
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
        }
    } catch (error) {
        console.error("Error de red:", error);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
};