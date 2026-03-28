/* ==========================================================================
   1. VARIABLES GLOBALES Y CONFIGURACIÓN
   ========================================================================== */
let modalDetalle;
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

/* ==========================================================================
   2. INICIALIZACIÓN (DOMContentLoaded)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando sistema...");

    // --- A. SEGURIDAD Y DATOS DE USUARIO ---
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

    // --- B. LÓGICA DEL SIDEBAR ---
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

    // --- C. INICIALIZAR MODAL CON REINTENTO (SOLUCIÓN AL ERROR) ---
    const inicializarModal = () => {
        if (typeof bootstrap !== 'undefined') {
            const modalElem = document.getElementById('modalDetalleProducto');
            if (modalElem) {
                modalDetalle = new bootstrap.Modal(modalElem);
                console.log("Bootstrap cargado: Modal listo.");
            }
        } else {
            console.warn("Bootstrap no detectado, reintentando en 500ms...");
            setTimeout(inicializarModal, 500);
        }
    };

    inicializarModal();

    // --- D. CARGA INICIAL DE DATOS ---
    cargarCategorias();
});

/* ==========================================================================
   3. FUNCIONES DE SESIÓN
   ========================================================================== */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

/* ==========================================================================
   4. LÓGICA DEL CATÁLOGO (API)
   ========================================================================== */

async function cargarCategorias() {
    try {
        const res = await fetch('/api/categorias');
        const data = await res.json();
        const render = document.getElementById('categorias-render');
        if (!render) return;

        render.innerHTML = data.map(cat => `
            <button class="categoria-item me-3" onclick="seleccionarCategoria(${cat.ID_CATEGORIA}, this)">
                <img src="${cat.IMAGEN || '/Image/default.jpg'}" class="categoria-img">
                <p class="small fw-bold mt-2 mb-0 text-dark">${cat.NOMBRE_CATE}</p>
            </button>
        `).join('');
    } catch (e) { console.error("Error al cargar categorías:", e); }
}

async function seleccionarCategoria(id, elemento) {
    document.querySelectorAll('.categoria-item').forEach(i => i.classList.remove('active'));
    elemento.classList.add('active');

    try {
        const res = await fetch('/api/categorias'); 
        const categorias = await res.json();
        const catSel = categorias.find(c => c.ID_CATEGORIA == id);

        const subContainer = document.getElementById('subcategorias-container');
        const lista = document.getElementById('subcategoria-lista');
        
        lista.innerHTML = '';
        if (catSel && catSel.subcategorias?.length > 0) {
            subContainer.classList.remove('d-none');
            // Usamos las nuevas clases CSS para las burbujas
            lista.innerHTML = catSel.subcategorias.map(sub => `
                <div class="subcategoria-item me-4" onclick="cargarProductosPorSub(${sub.ID_SUBCATEGORIA}, this)">
                    <div class="subcategoria-img-wrapper">
                        <img src="${sub.IMAGEN || '/Image/default-sub.jpg'}" class="subcategoria-img">
                    </div>
                    <span class="subcategoria-text">${sub.NOMBRE_SUBCATE}</span>
                </div>
            `).join('');
        } else {
            subContainer.classList.add('d-none');
        }
    } catch (e) { console.error("Error al cargar subcategorías:", e); }
}

async function cargarProductosPorSub(idSub, elemento) {
    document.querySelectorAll('.subcategoria-item').forEach(i => i.classList.remove('active'));
    elemento.classList.add('active');

    try {
        const res = await fetch('/api/productos');
        const todos = await res.json();
        const filtrados = todos.filter(p => p.ID_SUBCATE == idSub);
        
        const container = document.getElementById('productos-home');
        document.getElementById('titulo-productos').textContent = "Menú Disponible";
        
        container.innerHTML = filtrados.length > 0 ? filtrados.map(p => `
            <div class="col-12 col-sm-6 col-md-4 col-xl-3">
                <div class="card h-100 border-0 shadow-sm rounded-4 producto-card-admin" onclick='abrirDetalle(${JSON.stringify(p)})'>
                    <img src="${p.IMAGEN || '/Image/default-prod.jpg'}" class="card-img-top" style="height: 160px; object-fit: cover;">
                    <div class="card-body p-3 text-center">
                        <h6 class="fw-bold mb-1">${p.NOMBRE_PRODUCTO}</h6>
                        <span class="text-warning fw-bold">$${p.PRECIO_PRO}</span>
                    </div>
                </div>
            </div>
        `).join('') : '<p class="text-muted text-center w-100 py-5">No hay productos disponibles.</p>';
    } catch (e) { console.error("Error al cargar productos:", e); }
}

/* ==========================================================================
   5. MODAL DE DETALLE Y CARRITO
   ========================================================================== */

function abrirDetalle(producto) {
    const contenido = document.getElementById("modalDetalleContenido");
    contenido.innerHTML = `
        <div class="row g-4 align-items-center">
            <div class="col-md-5 text-center">
                <img src="${producto.IMAGEN}" class="img-fluid rounded-4 shadow" style="max-height: 250px; object-fit: cover;">
            </div>
            <div class="col-md-7">
                <h3 class="fw-bold mb-1">${producto.NOMBRE_PRODUCTO}</h3>
                <h4 class="text-warning fw-bold mb-3">$${producto.PRECIO_PRO}</h4>
                <p class="text-muted mb-4">${producto.DESCRIPCION_PRO || 'Sin descripción disponible.'}</p>
                
                <div class="mb-3">
                    <label for="notasModal" class="form-label small fw-bold text-muted">Instrucciones Especiales</label>
                    <textarea id="notasModal" class="form-control bg-light border-0" rows="2" placeholder="Ej: Sin cebolla, término medio..."></textarea>
                </div>

                <div class="d-flex align-items-center gap-3">
                    <div class="input-group" style="width: 140px;">
                        <button class="btn btn-dark" onclick="cambiarCantidadModal(-1)">-</button>
                        <input type="number" id="cantModal" class="form-control text-center" value="1" readonly>
                        <button class="btn btn-dark" onclick="cambiarCantidadModal(1)">+</button>
                    </div>
                    <span class="text-muted small">Cantidad</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btnAgregarDesdeModal').onclick = () => {
        const cantidad = parseInt(document.getElementById('cantModal').value);
        const notas = document.getElementById('notasModal').value; // Capturamos el comentario
        agregarAlCarrito(producto, cantidad, notas);
    };

    if (modalDetalle) modalDetalle.show();
}

window.cambiarCantidadModal = function(valor) {
    const input = document.getElementById('cantModal');
    let actual = parseInt(input.value);
    if (actual + valor >= 1) input.value = actual + valor;
};

function agregarAlCarrito(producto, cantidad, notas) {
    // Buscamos si ya existe el mismo producto con las MISMAS notas
    const index = carrito.findIndex(item => 
        item.ID_PRODUCTOS === producto.ID_PRODUCTOS && item.notas === notas
    );

    if (index !== -1) {
        carrito[index].cantidad += cantidad;
    } else {
        carrito.push({ ...producto, cantidad: cantidad, notas: notas });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    if (modalDetalle) modalDetalle.hide();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: '¡Añadido!',
            text: `Pedido configurado correctamente.`,
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }
}
