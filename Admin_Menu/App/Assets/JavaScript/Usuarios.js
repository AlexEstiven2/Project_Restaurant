/* --- FUNCIONES GLOBALES Y SEGURIDAD --- */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seguridad y UI básica
    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRol');
    if (!rol || !nombre) { window.location.href = "/Webcony/login"; return; }

    document.getElementById('nombre-usuario-display').textContent = nombre;
    const badgeRol = document.getElementById('badge-rol');
    if (badgeRol) {
        badgeRol.textContent = rol;
        badgeRol.classList.add(rol === 'SUPERADMIN' ? 'bg-danger' : 'bg-primary');
    }
    
    if (rol === 'SUPERADMIN') {
        document.getElementById('opciones-gerente')?.classList.remove('d-none');
    }

    // 2. Navegación Inteligente y Sidebar
    marcarEnlaceActivo();
    
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.getElementById('main-content').classList.toggle('expanded');
        });
    }

    cargarUsuarios();
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

/* --- LÓGICA DE USUARIOS (CRUD) --- */

async function cargarUsuarios() {
    const contenedor = document.getElementById('usuarios-cards-container');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/usuarios');
        const usuarios = await res.json();
        
        contenedor.innerHTML = '';
        usuarios.forEach(user => {
            const esAdmin = user.ROL === 'SUPERADMIN';
            contenedor.innerHTML += `
                <div class="col-12 col-md-6 col-lg-4 mb-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 transition-hover">
                        <div class="card-body p-4 text-center">
                            <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 70px; height: 70px;">
                                <i class="bi bi-person-badge fs-1 ${esAdmin ? 'text-danger' : 'text-primary'}"></i>
                            </div>
                            <h5 class="fw-bold mb-1">${user.NOMBRE_USUARIO}</h5>
                            <p class="text-muted small mb-3">${user.CORREO}</p>
                            <span class="badge ${esAdmin ? 'bg-danger' : 'bg-primary'} rounded-pill px-3 py-2 mb-3">
                                ${user.ROL}
                            </span>
                            <div class="d-flex justify-content-center gap-2 border-top pt-3">
                                <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick="prepararEdicion(${user.ID_USUARIO})">
                                    <i class="bi bi-pencil me-1"></i>Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="eliminarUsuario(${user.ID_USUARIO})">
                                    <i class="bi bi-trash me-1"></i>Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) { console.error("Error cargando cards", e); }
}

window.abrirModalCrear = function() {
    const form = document.getElementById('userForm');
    if (form) form.reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalLabel').textContent = 'Nuevo Usuario';
};

window.prepararEdicion = async function(id) {
    try {
        const respuesta = await fetch('/api/usuarios');
        const usuarios = await respuesta.json();
        const user = usuarios.find(u => u.ID_USUARIO === id);

        if (user) {
            document.getElementById('userId').value = user.ID_USUARIO;
            document.getElementById('userName').value = user.NOMBRE_USUARIO;
            document.getElementById('userEmail').value = user.CORREO;
            document.getElementById('userRole').value = user.ROL;
            document.getElementById('userPass').value = ""; // Seguridad: contraseña vacía
            
            document.getElementById('userModalLabel').textContent = "Editar Usuario";
            
            const modalElem = document.getElementById('userModal');
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElem);
            modalInstance.show();
        }
    } catch (error) { console.error(error); }
};

// EVENTO SUBMIT CON SWEETALERT
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const datos = {
            nombre: document.getElementById('userName').value,
            correo: document.getElementById('userEmail').value,
            rol: document.getElementById('userRole').value,
            contrasena: document.getElementById('userPass').value
        };

        const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            if (res.ok) {
                const modalElem = document.getElementById('userModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElem);
                if (modalInstance) modalInstance.hide();
                
                Swal.fire({
                    icon: 'success',
                    title: id ? 'Usuario actualizado' : 'Usuario creado',
                    showConfirmButton: false,
                    timer: 1500
                });
                cargarUsuarios();
            } else {
                const err = await res.json();
                Swal.fire('Error', err.mensaje || 'No se pudo procesar la solicitud', 'error');
            }
        } catch (e) { console.error(e); }
    });
}

window.eliminarUsuario = function(id) {
    Swal.fire({
        title: '¿Eliminar usuario?',
        text: "Este usuario perderá acceso al sistema inmediatamente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire('Eliminado', 'El usuario ha sido removido.', 'success');
                    cargarUsuarios();
                } else {
                    Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
                }
            } catch (error) { console.error(error); }
        }
    });
};