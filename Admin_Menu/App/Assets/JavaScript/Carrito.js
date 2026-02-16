/* ==========================================================================
   1. SEGURIDAD Y SIDEBAR
   ========================================================================== */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
}; 

let mesaSeleccionada = null; // Variable global para el pedido actual
 
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
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }

    // --- NUEVA FUNCIÓN: MARCAR ENLACE ACTIVO ---
    marcarEnlaceActivo();

    // Cargar mesa si ya venía seleccionada desde el mapa de mesas
    const mesaPrevia = JSON.parse(localStorage.getItem('mesa_actual'));
    if (mesaPrevia) {
        seleccionarMesa(mesaPrevia.id || mesaPrevia.ID_MESAS, mesaPrevia.numero || mesaPrevia.NUMERO_MESA);
    }

    // Escuchar cuando el modal de mesas se abre para cargar los datos
    const modalMapa = document.getElementById('modalMapaMesas');
    if (modalMapa) {
        modalMapa.addEventListener('show.bs.modal', cargarMapaMesas);
    }

    renderizarCarrito();
});

// Función para resaltar la página actual en el sidebar
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
   2. LÓGICA DEL CARRITO
   ========================================================================== */

function renderizarCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contenedor = document.getElementById('contenedor-items');
    const totalTxt = document.getElementById('resumen-total');
    const subtotalTxt = document.getElementById('resumen-subtotal');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-cart-x display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">Tu carrito está vacío</h4>
                <a href="/Webcony/HomeAdmin" class="btn btn-warning rounded-pill px-4 mt-2 fw-bold">Ver Menú</a>
            </div>`;
        totalTxt.textContent = "$0.00";
        subtotalTxt.textContent = "$0.00";
        return;
    }

    let total = 0;
    contenedor.innerHTML = carrito.map((prod, index) => {
        const subtotal = prod.PRECIO_PRO * prod.cantidad;
        total += subtotal;
        return `
            <div class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                <div class="row g-0 align-items-center">
                    <div class="col-3 col-md-2">
                        <img src="${prod.IMAGEN}" class="img-fluid h-100" style="object-fit: cover; min-height: 100px;">
                    </div>
                    <div class="col-6 col-md-7 px-3">
                        <h6 class="fw-bold mb-1">${prod.NOMBRE_PRODUCTO}</h6>
                        <p class="text-warning fw-bold mb-2 small">$${prod.PRECIO_PRO}</p>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-light rounded-circle shadow-sm" onclick="cambiarCantidad(${index}, -1)">-</button>
                            <span class="mx-3 fw-bold">${prod.cantidad}</span>
                            <button class="btn btn-sm btn-light rounded-circle shadow-sm" onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="col-3 text-end pe-4">
                        <p class="fw-bold mb-0">$${subtotal.toFixed(2)}</p>
                        <button class="btn btn-sm text-danger mt-2 border-0" onclick="eliminarItem(${index})">
                            <i class="bi bi-trash fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');

    totalTxt.textContent = `$${total.toFixed(2)}`;
    subtotalTxt.textContent = `$${total.toFixed(2)}`;
}

window.cambiarCantidad = function(index, valor) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    if (carrito[index].cantidad + valor >= 1) {
        carrito[index].cantidad += valor;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        renderizarCarrito();
    }
};

window.eliminarItem = function(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito'));
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
};

window.vaciarTodo = function() {
    Swal.fire({
        title: '¿Vaciar carrito?',
        text: "Se eliminarán todos los productos seleccionados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('carrito');
            localStorage.removeItem('mesa_actual');
            mesaSeleccionada = null; 
            renderizarCarrito();
            location.reload();
        }
    });
};

/* ==========================================================================
   3. LÓGICA DE MESAS INTERACTIVAS
   ========================================================================== */

async function cargarMapaMesas() {
    const grid = document.getElementById('mapa-mesas-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="spinner-border text-warning" role="status"></div>';

    try {
        const res = await fetch('/api/mesas'); 
        const mesas = await res.json();
        
        grid.innerHTML = mesas.map(mesa => {
            const esLibre = mesa.ESTADO_MESA === 'DISPONIBLE'; 
            return `
                <div class="mesa-item ${esLibre ? 'libre' : 'ocupada'}" 
                     onclick="${esLibre ? `seleccionarMesa(${mesa.ID_MESAS}, '${mesa.NUMERO_MESA}')` : `mesaOcupadaAlert()`}">
                    <i class="bi ${esLibre ? 'bi-unlock' : 'bi-lock-fill'} mesa-icon"></i>
                    <span class="mesa-numero">#${mesa.NUMERO_MESA}</span>
                    <small>${mesa.ESTADO_MESA}</small>
                </div>
            `;
        }).join('');
    } catch (e) { 
        grid.innerHTML = '<p class="text-danger">Error al cargar el mapa de mesas.</p>';
        console.error("Error al cargar mesas", e); 
    }
}

window.mesaOcupadaAlert = function() {
    Swal.fire({
        icon: 'error',
        title: 'Mesa Ocupada',
        text: 'Esta mesa ya tiene un pedido activo.',
        timer: 2000,
        showConfirmButton: false
    });
};

window.seleccionarMesa = function(id, numero) {
    mesaSeleccionada = { id, numero };
    localStorage.setItem('mesa_actual', JSON.stringify(mesaSeleccionada));
    
    const display = document.getElementById('mesa-seleccionada-display');
    if(display) {
        display.classList.remove('alert-light');
        display.classList.add('alert-warning');
        display.innerHTML = `
            <span class="fw-bold text-dark"><i class="bi bi-check-circle-fill me-2"></i>MESA ${numero}</span>
            <button class="btn btn-sm btn-dark rounded-circle" data-bs-toggle="modal" data-bs-target="#modalMapaMesas">
                <i class="bi bi-pencil"></i>
            </button>
        `;
    }
    
    const modalElement = document.getElementById('modalMapaMesas');
    if(modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modalInstance.hide();
        
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, 100);
    }
};

window.confirmarPedido = async function() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0 || !mesaSeleccionada) {
        Swal.fire('Atención', 'Asegúrate de tener productos y una mesa asignada.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_mesa: mesaSeleccionada.id,
                productos: carrito 
            })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire('¡Confirmado!', data.message, 'success').then(() => {
                localStorage.removeItem('carrito');
                localStorage.removeItem('mesa_actual');
                window.location.href = "/Webcony/Mesas";
            });
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
};