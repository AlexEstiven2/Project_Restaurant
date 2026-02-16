/* --- CONFIGURACIÓN INICIAL Y SEGURIDAD --- */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

let modalCateBS;
let modalSubBS;
    
document.addEventListener('DOMContentLoaded', () => {
    const modalCateElem = document.getElementById('modalCategoria');
    const modalSubElem = document.getElementById('modalSubcategoria');
    
    if (modalCateElem) modalCateBS = new bootstrap.Modal(modalCateElem);
    if (modalSubElem) modalSubBS = new bootstrap.Modal(modalSubElem);

    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRol');
    
    if (!rol || !nombre) { 
        window.location.href = "/Webcony/login"; 
        return; 
    }

    document.getElementById('nombre-usuario-display').textContent = nombre;
    const badgeRol = document.getElementById('badge-rol');
    badgeRol.textContent = rol;
    
    badgeRol.classList.add(rol === 'SUPERADMIN' ? 'bg-danger' : 'bg-primary');
    
    if (rol === 'SUPERADMIN') {
        document.getElementById('opciones-gerente')?.classList.remove('d-none');
    }

    // Sidebar Toggle
    const btnToggle = document.getElementById('toggleSidebar');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.getElementById('main-content').classList.toggle('expanded');
        });
    }

    marcarEnlaceActivo();
    cargarCategorias();
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

/* --- LÓGICA DE CATEGORÍAS --- */

async function cargarCategorias() {
    const contenedor = document.getElementById('categorias-container');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/categorias');
        const categorias = await res.json();

        if (!Array.isArray(categorias)) {
            contenedor.innerHTML = `<div class="alert alert-warning">No hay categorías disponibles.</div>`;
            return;
        }

        contenedor.innerHTML = '';

        categorias.forEach(cat => {
            const subsHtml = (cat.subcategorias || []).map(sub => `
                <li class="list-group-item d-flex justify-content-between align-items-center bg-light border-0 mb-1 rounded-3">
                    <div class="d-flex align-items-center">
                        <img src="${sub.IMAGEN || ''}" style="width: 30px; height: 30px; object-fit: cover;" 
                             class="rounded me-2" onerror="this.src='https://via.placeholder.com/30?text=S/I'">
                        <span class="small">${sub.NOMBRE_SUBCATE}</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm text-primary p-0" onclick="editarSub(${sub.ID_SUBCATEGORIA}, '${sub.NOMBRE_SUBCATE}', ${cat.ID_CATEGORIA}, '${cat.NOMBRE_CATE}')">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm text-danger p-0" onclick="eliminarSub(${sub.ID_SUBCATEGORIA})">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </li>
            `).join('');

            contenedor.innerHTML += `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                        <img src="${cat.IMAGEN || 'https://via.placeholder.com/400x200?text=Sin+Imagen'}" 
                             class="card-img-top" style="height: 160px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/400x200?text=Error+Imagen'">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="fw-bold mb-0">${cat.NOMBRE_CATE}</h5>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-outline-primary btn-sm border-0" onclick="editarCate(${cat.ID_CATEGORIA}, '${cat.NOMBRE_CATE}')">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm border-0" onclick="eliminarCate(${cat.ID_CATEGORIA})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="text-muted small fw-bold mb-2">Subcategorías:</p>
                            <ul class="list-group mb-3">${subsHtml || '<li class="list-group-item border-0 small text-muted">Sin subcategorías</li>'}</ul>
                            <button class="btn btn-warning btn-sm w-100 rounded-pill fw-bold" onclick="abrirModalSub(${cat.ID_CATEGORIA}, '${cat.NOMBRE_CATE}')">
                                <i class="bi bi-plus-lg me-1"></i> Agregar Subcategoría
                            </button>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) { 
        console.error("Error al cargar categorías:", e);
    }
}

/* --- ACCIONES CRUD (CREAR Y EDITAR) --- */

window.abrirModalCategoria = () => {
    document.getElementById('tituloModalCate').textContent = "Nueva Categoría";
    document.getElementById('formCategoria').reset();
    document.getElementById('cateId').value = "";
    if (modalCateBS) modalCateBS.show();
};

window.editarCate = (id, nombre) => {
    document.getElementById('tituloModalCate').textContent = "Editar Categoría";
    document.getElementById('cateId').value = id;
    document.getElementById('cateNombre').value = nombre;
    if (modalCateBS) modalCateBS.show();
};

window.abrirModalSub = (idPadre, nombrePadre) => {
    document.getElementById('formSubcategoria').reset();
    document.getElementById('subCateId').value = ""; // Limpiar id para creación
    document.getElementById('padreId').value = idPadre;
    document.getElementById('nombreCatePadre').textContent = nombrePadre;
    if (modalSubBS) modalSubBS.show();
};

window.editarSub = (id, nombre, idPadre, nombrePadre) => {
    document.getElementById('formSubcategoria').reset();
    document.getElementById('subCateId').value = id;
    document.getElementById('padreId').value = idPadre;
    document.getElementById('subNombre').value = nombre;
    document.getElementById('nombreCatePadre').textContent = nombrePadre;
    if (modalSubBS) modalSubBS.show();
};

// GUARDAR / ACTUALIZAR CATEGORÍA
document.getElementById('formCategoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cateId').value;
    const formData = new FormData();
    formData.append('nombre', document.getElementById('cateNombre').value);
    
    const fileInput = document.getElementById('cateFile');
    if (fileInput?.files[0]) formData.append('cateFile', fileInput.files[0]);

    const url = id ? `/api/categorias/${id}` : '/api/categorias';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method: method, body: formData });
        if (res.ok) { 
            modalCateBS.hide();
            Swal.fire({ icon: 'success', title: 'Operación exitosa', showConfirmButton: false, timer: 1500 });
            cargarCategorias(); 
        } else {
            Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
        }
    } catch (error) { console.error(error); }
});

// GUARDAR / ACTUALIZAR SUBCATEGORÍA
document.getElementById('formSubcategoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('subCateId').value;
    const formData = new FormData();
    formData.append('nombre', document.getElementById('subNombre').value);
    formData.append('idPadre', document.getElementById('padreId').value);
    
    const fileInput = document.getElementById('subFile');
    if (fileInput?.files[0]) formData.append('subFile', fileInput.files[0]);

    const url = id ? `/api/subcategorias/${id}` : '/api/subcategorias';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method: method, body: formData });
        if (res.ok) { 
            modalSubBS.hide(); 
            Swal.fire({ icon: 'success', title: 'Operación exitosa', showConfirmButton: false, timer: 1500 });
            cargarCategorias(); 
        }
    } catch (error) { console.error(error); }
});

/* --- ELIMINACIÓN --- */

window.eliminarCate = async (id) => {
    Swal.fire({
        title: '¿Eliminar categoría?',
        text: "Se borrará la imagen y todas sus subcategorías.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
            if(res.ok) {
                Swal.fire('Eliminado', 'La categoría y su imagen han sido borradas.', 'success');
                cargarCategorias();
            }
        }
    });
};

window.eliminarSub = async (id) => {
    Swal.fire({
        title: '¿Eliminar subcategoría?',
        text: "Se borrará la imagen asociada.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Eliminar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await fetch(`/api/subcategorias/${id}`, { method: 'DELETE' });
            if(res.ok) {
                Swal.fire('Eliminado', 'Subcategoría e imagen borradas.', 'success');
                cargarCategorias();
            }
        }
    });
};