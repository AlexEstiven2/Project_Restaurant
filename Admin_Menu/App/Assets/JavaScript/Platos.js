/* --- CONFIGURACIÓN DE SESIÓN Y SIDEBAR --- */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

let modalPlatoBS;
let todosLosPlatos = [];

document.addEventListener('DOMContentLoaded', () => {
    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRol');

    if (!rol || !nombre) {
        window.location.href = "/Webcony/login";
        return;
    }

    document.getElementById('nombre-usuario-display').textContent = nombre;
    const badgeRol = document.getElementById('badge-rol');
    if (badgeRol) {
        badgeRol.textContent = rol;
        badgeRol.classList.add(rol === 'SUPERADMIN' ? 'bg-danger' : 'bg-primary');
    }

    if (rol === 'SUPERADMIN') {
        document.getElementById('opciones-gerente')?.classList.remove('d-none');
    }

    const modalElem = document.getElementById('modalPlato');
    if (modalElem && typeof bootstrap !== 'undefined') {
        modalPlatoBS = new bootstrap.Modal(modalElem);
    }

    // --- NUEVAS FUNCIONES ---
    marcarEnlaceActivo();
    cargarSubcategoriasParaSelect();
    cargarPlatos();

    const form = document.getElementById('formPlato');
    if (form) form.addEventListener('submit', guardarPlato);

    document.getElementById('toggleSidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('main-content').classList.toggle('expanded');
    });
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

/* --- LÓGICA DE INTERFAZ Y DATOS --- */

async function cargarSubcategoriasParaSelect() {
    const select = document.getElementById('prodSubcate');
    if (!select) return;
    try {
        const res = await fetch('/api/categorias');
        const categorias = await res.json();

        select.innerHTML = '<option value="" selected disabled>Seleccione Subcategoría...</option>';
        categorias.forEach(cat => {
            const group = document.createElement('optgroup');
            group.label = cat.NOMBRE_CATE;
            cat.subcategorias.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub.ID_SUBCATEGORIA;
                opt.textContent = sub.NOMBRE_SUBCATE;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    } catch (e) { console.error(e); }
}

async function cargarPlatos() {
    const contenedor = document.getElementById('platos-container');
    if (!contenedor) return;
    try {
        const res = await fetch('/api/productos');
        if (!res.ok) {
            contenedor.innerHTML = '<p class="text-muted">No se pudieron cargar los platos.</p>';
            return;
        }
        todosLosPlatos = await res.json();
        mostrarPlatos(todosLosPlatos);
    } catch (e) { console.error(e); }
}

function mostrarPlatos(lista) {
    const contenedor = document.getElementById('platos-container');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12"><p class="text-muted text-center py-5">No se encontraron platos.</p></div>';
        return;
    }

    lista.forEach(p => {
        contenedor.innerHTML += `
            <div class="col-12 col-md-6 col-lg-3 mb-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                    <img src="${p.IMAGEN || 'https://via.placeholder.com/400x250'}" class="card-img-top" style="height: 160px; object-fit: cover;">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold mb-0">${p.NOMBRE_PRODUCTO}</h6>
                            <span class="badge bg-warning text-dark">$${p.PRECIO_PRO}</span>
                        </div>
                        <p class="text-muted small text-truncate">${p.DESCRIPCION_PRO || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="small fw-bold ${p.ESDADO_PRO === 'DISPONIBLE' ? 'text-success' : 'text-danger'}">
                                <i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>${p.ESDADO_PRO}
                            </span>
                            <div>
                                <button class="btn btn-sm text-primary me-2" onclick="prepararEdicion(${p.ID_PRODUCTOS})">
                                    <i class="bi bi-pencil-square fs-5"></i>
                                </button>
                                <button class="btn btn-sm text-danger" onclick="eliminarPlato(${p.ID_PRODUCTOS})">
                                    <i class="bi bi-trash fs-5"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// BUSCADOR EN TIEMPO REAL
document.getElementById('inputBuscador')?.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = todosLosPlatos.filter(p => {
        const nombre = p.NOMBRE_PRODUCTO.toLowerCase();
        const sub = p.detalles_sub?.NOMBRE_SUBCATE.toLowerCase() || "";
        return nombre.includes(termino) || sub.includes(termino);
    });
    mostrarPlatos(filtrados);
});

/* --- FUNCIONES CRUD CON SWEETALERT2 --- */

window.abrirModalPlato = () => {
    const form = document.getElementById('formPlato');
    if (form) form.reset();
    document.getElementById('prodId').value = ""; 
    document.querySelector('#modalPlato .modal-title').textContent = "Nuevo Plato";
    modalPlatoBS.show();
};

window.prepararEdicion = (id) => {
    const p = todosLosPlatos.find(item => item.ID_PRODUCTOS == id);
    if (p) {
        document.getElementById('prodId').value = p.ID_PRODUCTOS;
        document.getElementById('prodNombre').value = p.NOMBRE_PRODUCTO;
        document.getElementById('prodDescripcion').value = p.DESCRIPCION_PRO;
        document.getElementById('prodPrecio').value = p.PRECIO_PRO;
        document.getElementById('prodSubcate').value = p.ID_SUBCATE;
        document.getElementById('prodEstado').value = p.ESDADO_PRO;

        document.querySelector('#modalPlato .modal-title').textContent = "Editar Producto";
        modalPlatoBS.show();
    }
};

async function guardarPlato(e) {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const formData = new FormData();
    formData.append('nombre', document.getElementById('prodNombre').value);
    formData.append('descripcion', document.getElementById('prodDescripcion').value);
    formData.append('precio', document.getElementById('prodPrecio').value);
    formData.append('idSubcate', document.getElementById('prodSubcate').value);
    formData.append('estado', document.getElementById('prodEstado').value);

    const fileInput = document.getElementById('prodFile');
    if (fileInput.files[0]) {
        formData.append('platoFile', fileInput.files[0]);
    }

    const url = id ? `/api/productos/${id}` : '/api/productos';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method: method, body: formData });
        if (res.ok) {
            modalPlatoBS.hide();
            if (document.activeElement) document.activeElement.blur();

            Swal.fire({
                icon: 'success',
                title: id ? 'Plato actualizado' : 'Plato creado',
                showConfirmButton: false,
                timer: 1500
            });

            cargarPlatos();
        } else {
            Swal.fire('Error', 'No se pudo guardar la información', 'error');
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Ocurrió un fallo en el servidor', 'error');
    }
}

window.eliminarPlato = function(id) {
    Swal.fire({
        title: '¿Eliminar este plato?',
        text: "Esta acción quitará el plato del menú definitivamente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('Eliminado', 'El plato ha sido borrado.', 'success');
                cargarPlatos();
            }
        }
    });
};