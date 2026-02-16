/* ==========================================================================
   1. SEGURIDAD Y SIDEBAR
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
    cargarMesas();

    // Polling cada 5 segundos para actualizar estados en tiempo real
    setInterval(() => {
        cargarMesas();
    }, 5000);
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
   2. LÓGICA DEL MAPA DE MESAS (CRUD Y RENDERIZADO)
   ========================================================================== */
let mesasConCuentaAnterior = 0;

async function cargarMesas() {
    const render = document.getElementById('mapa-mesas-render');
    const rol = localStorage.getItem('userRol');
    if (!render) return;

    try {
        const res = await fetch('/api/mesas');
        const mesas = await res.json();

        // --- LÓGICA DE NOTIFICACIÓN SONORA ---
        const mesasSolicitando = mesas.filter(m => m.ESTADO_MESA === 'SOLICITO CUENTA').length;
        if (mesasSolicitando > mesasConCuentaAnterior) {
            reproducirAlerta();
        }
        mesasConCuentaAnterior = mesasSolicitando;

        // --- RENDERIZADO DEL MAPA ---
        render.innerHTML = mesas.map(mesa => {
            const estado = mesa.ESTADO_MESA;
            let colorClass = '';
            let iconoClase = 'bi-lock-fill';

            // DETERMINACIÓN DINÁMICA DE CLASE Y ICONO
            if (estado === 'DISPONIBLE') {
                colorClass = 'mesa-disponible';
                iconoClase = 'bi-unlock';
            } else if (estado === 'RECIBIDO') {
                colorClass = 'mesa-recibido';
                iconoClase = 'bi-check-all';
            } else if (estado === 'SOLICITO CUENTA') {
                colorClass = 'mesa-solicitando-cuenta';
                iconoClase = 'bi-receipt';
            } else if (estado === 'LLAMANDO MESERO') {
                colorClass = 'mesa-llamando-mesero';
                iconoClase = 'bi-person-raised-hand';
            } else if (estado === 'ESPERANDO PEDIDO') {
                colorClass = 'mesa-esperando-pedido';
                iconoClase = 'bi-hourglass-split';
            } else if (estado === 'PAGANDO') {
                colorClass = 'mesa-pagando';
                iconoClase = 'bi-cash-coin';
            } else if (estado === 'PAGADO') {
                colorClass = 'mesa-pagado';
                iconoClase = 'bi-flag-fill';
            } else {
                colorClass = 'mesa-ocupada';
                iconoClase = 'bi-lock-fill';
            }

            return `
                <div class="col-6 col-sm-4 col-md-3 col-xl-2">
                    <div class="mesa-card ${colorClass}">
                        <div class="mesa-badge">${estado}</div>
                        
                        ${rol === 'SUPERADMIN' ? `
                            <div class="mesa-admin-tools">
                                <button onclick="prepararEdicion(${mesa.ID_MESAS}, ${mesa.NUMERO_MESA})" class="btn-tool edit"><i class="bi bi-pencil"></i></button>
                                <button onclick="eliminarMesa(${mesa.ID_MESAS})" class="btn-tool delete"><i class="bi bi-trash"></i></button>
                            </div>
                        ` : ''}

                        <div class="mesa-content text-center" onclick='gestionarFlujoMesa(${JSON.stringify(mesa)})'>
                            <i class="bi ${iconoClase} mesa-main-icon"></i>
                            <span class="mesa-number">#${mesa.NUMERO_MESA}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Error en polling de mesas:", e);
    }
}

function reproducirAlerta() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => {
        console.log("Audio bloqueado por el navegador.");
    });
}

/* ==========================================================================
   3. GESTIÓN DE FLUJO Y PEDIDOS
   ========================================================================== */

window.gestionarFlujoMesa = async function (mesa) {
    if (mesa.ESTADO_MESA === 'DISPONIBLE') {
        localStorage.setItem('mesa_actual', JSON.stringify({
            id: mesa.ID_MESAS,
            numero: mesa.NUMERO_MESA
        }));
        window.location.href = "/Webcony/dashboard";
    } else {
        let productosData = [];
        let htmlTabla = '';
        let totalMesa = 0;

        try {
            const res = await fetch(`/api/pedidos/mesa/${mesa.ID_MESAS}`);
            productosData = await res.json();

            if (productosData.length > 0) {
                htmlTabla = `
                    <table class="table table-sm mt-3 border">
                        <thead class="table-light">
                            <tr><th>Cant</th><th>Plato</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>
                            ${productosData.map(p => {
                                const sub = p.CANTIDAD * p.PRECIO_UNITARIO;
                                totalMesa += sub;
                                return `<tr><td>${p.CANTIDAD}</td><td>${p.NOMBRE_PRODUCTO}</td><td>$${sub.toLocaleString()}</td></tr>`;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-warning"><th colspan="2" class="text-end">TOTAL:</th><th>$${totalMesa.toLocaleString()}</th></tr>
                        </tfoot>
                    </table>`;
            } else {
                htmlTabla = '<p class="text-warning text-center my-3">Sin productos activos.</p>';
            }
        } catch (e) {
            htmlTabla = '<p class="text-danger text-center">Error al cargar datos.</p>';
        }

        // --- LÓGICA DE CAMBIO MANUAL DE ESTADO (NUEVO) ---
        // Creamos una botonera para que el Admin fuerce estados si el cliente no usa el QR
        const botonesManuales = `
            <div class="d-flex flex-wrap gap-2 justify-content-center mt-3 p-2 bg-light rounded-3 border">
                <small class="w-100 text-muted text-center mb-1">Cambio de Estado Manual:</small>
                <button onclick="fuerzaEstado(${mesa.ID_MESAS}, 'SOLICITO CUENTA')" class="btn btn-sm btn-outline-warning shadow-sm">
                    <i class="bi bi-receipt"></i> Pedir Cuenta
                </button>
                <button onclick="fuerzaEstado(${mesa.ID_MESAS}, 'PAGANDO')" class="btn btn-sm btn-outline-info shadow-sm">
                    <i class="bi bi-cash-coin"></i> Marcando Pago
                </button>
                 <button onclick="fuerzaEstado(${mesa.ID_MESAS}, 'ESPERANDO PEDIDO')" class="btn btn-sm btn-outline-dark shadow-sm">
                    <i class="bi bi-hourglass-split"></i> En Cocina
                </button>
            </div>
        `;

        // Configuración de botones principales de SweetAlert
        let confirmButtonText = 'Liberar Mesa';
        let denyButtonText = '';
        let denyButtonColor = '#0d6efd';

        if (mesa.ESTADO_MESA === 'ESPERANDO PEDIDO') {
            denyButtonText = '<i class="bi bi-check-circle"></i> Comida Entregada';
            denyButtonColor = '#0dcaf0';
        } else if (['SOLICITO CUENTA', 'PAGANDO', 'PAGADO'].includes(mesa.ESTADO_MESA)) {
            denyButtonText = '<i class="bi bi-file-pdf"></i> Factura';
            denyButtonColor = '#0d6efd';
        }

        Swal.fire({
            title: `Gestión Mesa #${mesa.NUMERO_MESA}`,
            html: `
                <div class="text-start">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong>Estado:</strong> 
                        <span class="badge bg-dark px-3 py-2 text-warning">${mesa.ESTADO_MESA}</span>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${htmlTabla}
                    </div>
                    ${botonesManuales}
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            showDenyButton: denyButtonText !== '',
            confirmButtonText: confirmButtonText,
            denyButtonText: denyButtonText,
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#28a745',
            denyButtonColor: denyButtonColor,
            width: '500px'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Confirmación extra para no liberar por error
                const confirm = await Swal.fire({
                    title: '¿Liberar mesa?',
                    text: "Se borrarán los pedidos actuales del monitor.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, liberar'
                });
                if(confirm.isConfirmed){
                    await actualizarEstadoMesa(mesa.ID_MESAS, 'DISPONIBLE');
                    Swal.fire({ icon: 'success', title: 'Mesa Disponible', showConfirmButton: false, timer: 1000 });
                }
            } else if (result.isDenied) {
                if (mesa.ESTADO_MESA === 'ESPERANDO PEDIDO') {
                    await actualizarEstadoMesa(mesa.ID_MESAS, 'RECIBIDO');
                    Swal.fire({ icon: 'success', title: 'Pedido Entregado', timer: 1500 });
                } else {
                    generarFacturaPDF(mesa, productosData);
                }
            }
        });
    }
};

// FUNCIÓN AUXILIAR PARA EL CAMBIO MANUAL
window.fuerzaEstado = async function(id, estado) {
    Swal.close(); // Cerramos el modal actual
    await actualizarEstadoMesa(id, estado);
    Swal.fire({
        icon: 'success',
        title: `Estado: ${estado}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
};

async function actualizarEstadoMesa(id, nuevoEstado) {
    try {
        // Esta petición ahora activará el "if (estado === 'DISPONIBLE')" del controlador
        const res = await fetch(`/api/mesas/estado/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.ok) {
            cargarMesas();
        }
    } catch (e) {
        console.error("Error al actualizar estado:", e);
    }
}

window.generarFacturaPDF = function (mesa, productos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("BALCONY RESTAURANTE", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 105, 27, { align: "center" });
    doc.text(`Mesa: #${mesa.NUMERO_MESA}`, 20, 40);

    const body = productos.map(p => [
        p.CANTIDAD,
        p.NOMBRE_PRODUCTO,
        `$${p.PRECIO_UNITARIO}`,
        `$${(p.CANTIDAD * p.PRECIO_UNITARIO).toFixed(2)}`
    ]);

    const total = productos.reduce((acc, p) => acc + (p.CANTIDAD * p.PRECIO_UNITARIO), 0);

    doc.autoTable({
        startY: 45,
        head: [['Cant', 'Producto', 'Precio Unit.', 'Subtotal']],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [255, 193, 7] }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: $${total.toFixed(2)}`, 140, finalY + 10);
    doc.save(`Factura_Mesa_${mesa.NUMERO_MESA}.pdf`);
};

/* ==========================================================================
   4. CRUD: ACCIONES ADMINISTRATIVAS
   ========================================================================== */

window.agregarMesa = async function () {
    const { value: numero } = await Swal.fire({
        title: 'Nueva Mesa',
        input: 'number',
        inputLabel: 'Número de la mesa',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        inputValidator: (value) => {
            if (!value) return '¡Debes ingresar un número!';
        }
    });

    if (numero) {
        const res = await fetch('/api/mesas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero_mesa: numero })
        });
        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Mesa creada', showConfirmButton: false, timer: 1500 });
            cargarMesas();
        }
    }
};

window.prepararEdicion = async function (id, numeroActual) {
    const { value: nuevoNumero } = await Swal.fire({
        title: 'Editar Mesa',
        input: 'number',
        inputValue: numeroActual,
        showCancelButton: true,
        confirmButtonColor: '#ffc107'
    });

    if (nuevoNumero) {
        const res = await fetch(`/api/mesas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero_mesa: nuevoNumero })
        });
        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Actualizado', showConfirmButton: false, timer: 1500 });
            cargarMesas();
        }
    }
};

window.eliminarMesa = function (id) {
    Swal.fire({
        title: '¿Eliminar mesa?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await fetch(`/api/mesas/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('Eliminado', 'La mesa ha sido borrada.', 'success');
                cargarMesas();
            }
        }
    });
};