/* ==========================================================================
   1. CONFIGURACIÓN DE SESIÓN Y SIDEBAR
   ========================================================================== */
window.cerrarSesion = function () {
    localStorage.clear();
    window.location.replace("/Webcony/login");
};

document.addEventListener('DOMContentLoaded', () => {
    const nombre = localStorage.getItem('userName');
    const rol = localStorage.getItem('userRol');

    // Protección de ruta
    if (!rol || !nombre) {
        window.location.href = "/Webcony/login";
        return;
    }

    // UI de Usuario
    const nombreDisplay = document.getElementById('nombre-usuario-display');
    if (nombreDisplay) nombreDisplay.textContent = nombre;

    const badgeRol = document.getElementById('badge-rol');
    if (badgeRol) {
        badgeRol.textContent = rol;
        badgeRol.classList.add(rol === 'SUPERADMIN' ? 'bg-danger' : 'bg-primary');
    }

    if (rol === 'SUPERADMIN') {
        document.getElementById('opciones-gerente')?.classList.remove('d-none');
    }

    // Sidebar Toggle
    document.getElementById('toggleSidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('main-content').classList.toggle('expanded');
    });

    marcarEnlaceActivo();
    
    // CARGA DE DATOS INICIAL
    cargarEstadisticasRealtime();

    // AUTO-REFRESCO CADA 30 SEGUNDOS (TIEMPO REAL)
    setInterval(() => {
        const filtroInicio = document.getElementById('filtroInicio').value;
        // Solo refresca automáticamente si no hay un filtro de fecha manual activado
        if (!filtroInicio) {
            cargarEstadisticasRealtime();
        }
    }, 30000);

    // Listeners para filtros manuales
    document.getElementById('filtroInicio')?.addEventListener('change', cargarEstadisticasRealtime);
    document.getElementById('filtroFin')?.addEventListener('change', cargarEstadisticasRealtime);
});

function marcarEnlaceActivo() {
    const pathActual = window.location.pathname;
    const enlaces = document.querySelectorAll('#sidebar .nav-link');
    enlaces.forEach(enlace => {
        enlace.classList.remove('active', 'text-white');
        enlace.classList.add('text-white-50');
        if (enlace.getAttribute('href') === pathActual) {
            enlace.classList.add('active', 'text-white');
            enlace.classList.remove('text-white-50');
        }
    }); 
}

/* ==========================================================================
   2. LÓGICA DE GRÁFICOS (VENTAS Y TOP PLATOS)
   ========================================================================== */
let chartVentas = null;
let chartPlatos = null;

async function cargarEstadisticasRealtime() {
    try {
        const inicio = document.getElementById('filtroInicio').value;
        const fin = document.getElementById('filtroFin').value;
        
        let url = '/api/estadisticas';
        if (inicio && fin) {
            url += `?inicio=${inicio}&fin=${fin}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        const data = await response.json();

        // Formateador de moneda (COP)
        const money = new Intl.NumberFormat('es-CO', {
            style: 'currency', 
            currency: 'COP', 
            maximumFractionDigits: 0
        });

        // Actualizar Tarjetas de Resumen
        document.getElementById('ventas-hoy').textContent = money.format(data.resumen.ventas_totales || 0);
        document.getElementById('total-pedidos').textContent = data.resumen.total_pedidos || 0;
        document.getElementById('ticket-promedio').textContent = money.format(data.resumen.ticket_promedio || 0);

        // Renderizar Gráficos Principales
        renderizarGraficoVentas(data.semana.labels, data.semana.valores);
        renderizarGraficoPlatos(data.top.labels, data.top.valores);

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}

function renderizarGraficoVentas(labels, valores) {
    const canvas = document.getElementById('graficoVentas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartVentas) chartVentas.destroy();

    chartVentas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas por Día',
                data: valores,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#ffc107'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Ventas: $' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderizarGraficoPlatos(labels, valores) {
    const canvas = document.getElementById('graficoPlatos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartPlatos) chartPlatos.destroy();

    chartPlatos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#ffc107', '#212529', '#0d6efd', '#dc3545', '#198754'],
                hoverOffset: 15,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } } 
            },
            cutout: '70%'
        }
    });
}

/* ==========================================================================
   3. GESTIÓN DE FEEDBACK (MODAL Y SATISFACCIÓN)
   ========================================================================== */
let chartSatisfaccion = null;
let todosLosFeedbacks = [];

window.abrirModalFeedback = async function() {
    const modalElement = document.getElementById('modalFeedback');
    let modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);

    try {
        const res = await fetch('/api/feedback');
        todosLosFeedbacks = await res.json();
        
        actualizarGraficoSatisfaccion();
        renderizarListaFeedbacks();
        
        modalInstance.show();
    } catch (error) {
        console.error("Error al cargar feedback:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No pudimos cargar las opiniones.',
            confirmButtonColor: '#ffc107'
        });
    }
};

function actualizarGraficoSatisfaccion() {
    const canvas = document.getElementById('graficoSatisfaccion');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const conteo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    todosLosFeedbacks.forEach(f => {
        if (conteo[f.ESTRELLAS] !== undefined) conteo[f.ESTRELLAS]++;
    });

    if (chartSatisfaccion) chartSatisfaccion.destroy();

    chartSatisfaccion = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['1★', '2★', '3★', '4★', '5★'],
            datasets: [{
                data: Object.values(conteo),
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#0dcaf0', '#198754']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Distribución de Calificaciones' }
            }
        }
    });
}

window.renderizarListaFeedbacks = function() {
    const filtro = document.getElementById('filtroEstrellas').value;
    const contenedor = document.getElementById('lista-comentarios');
    
    const filtrados = filtro === 'todas' 
        ? todosLosFeedbacks 
        : todosLosFeedbacks.filter(f => f.ESTRELLAS == filtro);

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="text-center py-5 text-muted"><p>No hay comentarios.</p></div>`;
        return;
    }

    contenedor.innerHTML = filtrados.map(f => `
        <div class="card mb-3 border-0 bg-light shadow-sm rounded-4">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="text-warning">
                        ${'<i class="bi bi-star-fill"></i>'.repeat(f.ESTRELLAS)}
                        ${'<i class="bi bi-star"></i>'.repeat(5 - f.ESTRELLAS)}
                    </div>
                    <span class="badge bg-white text-dark border rounded-pill small">
                        ${new Date(f.FECHA).toLocaleDateString('es-CO')}
                    </span>
                </div>
                <p class="mb-1 fw-medium text-dark italic">"${f.COMENTARIO || 'Sin comentarios.'}"</p>
                <div class="d-flex align-items-center mt-2">
                    <span class="badge bg-warning text-black">Mesa ${f.ID_MESA}</span>
                </div>
            </div>
        </div>
    `).join('');
};