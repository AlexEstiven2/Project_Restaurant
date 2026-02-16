/* ==========================================================================
   1. SEGURIDAD Y SIDEBAR (ALINEADO CON SECURITY.JS)
   ========================================================================== */
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

    marcarEnlaceActivo();
    cargarQrMesas();
});



function marcarEnlaceActivo() {
    const pathActual = window.location.pathname;
    const enlaces = document.querySelectorAll('#sidebar .nav-link');
    enlaces.forEach(enlace => {
        if (enlace.getAttribute('href') === pathActual) {
            enlace.classList.add('active');
            enlace.classList.remove('text-white-50');
        }
    });
}

/* ==========================================================================
   2. LÓGICA DE GENERACIÓN DE QR DINÁMICO
   ========================================================================== */

async function cargarQrMesas() {
    const contenedor = document.getElementById('contenedor-qr-mesas');
    if (!contenedor) return;

    try {
        const res = await fetch('/api/mesas');
        const mesas = await res.json();

        contenedor.innerHTML = ''; 

        // CONFIGURACIÓN DE RED: 
        //Johan const baseIp = "192.168.1.33";
        //Casa const baseIp = "192.168.1.21";
        const baseIp = "192.168.1.21";
        const puertoMenu = "9090";
        const baseUrl = `http://${baseIp}:${puertoMenu}`;

        mesas.forEach(mesa => {
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 text-center mb-4';
            
            // La URL final será ej: http://192.168.1.21:9090/?mesa=1
            const urlMenuDigital = `${baseUrl}/?mesa=${mesa.ID_MESAS}`;

            col.innerHTML = `
                <div class="card border-0 shadow-sm rounded-4 p-3 h-100 qr-card transition-hover">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-light text-dark border">ID: ${mesa.ID_MESAS}</span>
                        <h5 class="fw-bold m-0">Mesa #${mesa.NUMERO_MESA}</h5>
                    </div>
                    
                    <a href="${urlMenuDigital}" target="_blank" title="Probar mesa ${mesa.NUMERO_MESA}" class="d-block my-3 qr-link">
                        <div id="qr-mesa-${mesa.ID_MESAS}" class="d-flex justify-content-center bg-white p-2 rounded-3 border"></div>
                        <small class="text-primary mt-2 d-block"><i class="bi bi-box-arrow-up-right"></i> Probar Menú</small>
                    </a>

                    <p class="text-muted x-small text-truncate mb-3" style="font-size: 0.75rem; color: #666;">
                        ${urlMenuDigital}
                    </p>
                    
                    <button onclick="descargarQrMesa('qr-mesa-${mesa.ID_MESAS}', ${mesa.NUMERO_MESA})" 
                            class="btn btn-warning btn-sm w-100 rounded-pill fw-bold shadow-sm">
                        <i class="bi bi-download me-1"></i> Descargar PNG
                    </button>
                </div>
            `;

            contenedor.appendChild(col);

            // Generar el código QR con la URL de la red local
            new QRCode(document.getElementById(`qr-mesa-${mesa.ID_MESAS}`), {
                text: urlMenuDigital,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H 
            });
        });

    } catch (e) {
        console.error("Error al cargar QR:", e);
        contenedor.innerHTML = '<div class="alert alert-danger">Error al conectar con la base de datos de mesas.</div>';
    }
}

window.descargarQrMesa = function(divId, numeroMesa) {
    const container = document.getElementById(divId);
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');

    // Soporte para múltiples navegadores
    const dataURL = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);

    if (dataURL) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `QR_MESA_${numeroMesa}_Balcony.png`;
        link.click();
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `QR Mesa ${numeroMesa} listo para impresión`,
            showConfirmButton: false,
            timer: 2000
        });
    } else {
        Swal.fire('Error', 'No se pudo generar la imagen para descarga', 'error');
    }
};