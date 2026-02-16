/* ==========================================================================
   SECURITY.JS - EL GUARDIÁN DEL FRONTEND (VERSIÓN FINAL BLINDADA)
   ========================================================================== */

(function () {
    const rol = localStorage.getItem('userRol');
    const nombre = localStorage.getItem('userName');
    const pathActual = window.location.pathname.toLowerCase();

    // 1. VERIFICACIÓN DE EXISTENCIA DE SESIÓN
    if (!pathActual.includes('login') && (!rol || !nombre)) {
        console.warn("Acceso no autorizado: No se detectó sesión.");
        window.location.href = "/Webcony/login";
        return;
    }

    // 2. DEFINICIÓN DE PERMISOS (RBAC - Client Side)
    const rutasPrivadasAdmin = [
        '/webcony/usuarios',
        '/webcony/qr',
        '/webcony/categorias',
        '/webcony/platos',
        '/webcony/estadisticas'
    ];

    // 3. PROTECCIÓN DE RUTAS SEGÚN ROL
    if (rol !== 'SUPERADMIN') {
        const esRutaProhibida = rutasPrivadasAdmin.some(ruta => pathActual.includes(ruta));
        
        if (esRutaProhibida) {
            console.error("Permisos insuficientes para esta ruta.");
            window.location.href = "/Webcony/dashboard";
            return;
        }
    }

    // 4. LIMPIEZA DE FLUJO DE VENTAS (Mesa seleccionada)
    // Si el usuario sale del flujo de toma de pedidos, limpiamos la mesa activa
    const paginasVenta = ['dashboard', 'carrito', 'homeadmin', 'mesas'];
    const esPaginaVenta = paginasVenta.some(p => pathActual.includes(p));

    if (!esPaginaVenta) {
        if (localStorage.getItem('mesa_actual')) {
            console.log("Limpiando mesa seleccionada por cambio de sección.");
            localStorage.removeItem('mesa_actual');
        }
    }

    // 5. LIMPIEZA DINÁMICA DE LA INTERFAZ (DOM)
    document.addEventListener('DOMContentLoaded', () => {
        aplicarRestriccionesUI(rol);
    });

})();

/**
 * Elimina físicamente del DOM los elementos que el usuario no debe ver.
 */
function aplicarRestriccionesUI(rol) {
    if (rol !== 'SUPERADMIN') {
        // Eliminar opciones de gerente del Sidebar
        const opcionesGerente = document.getElementById('opciones-gerente');
        if (opcionesGerente) opcionesGerente.remove();

        // Eliminar elementos genéricos marcados para Admin
        const elementosProhibidos = document.querySelectorAll('.solo-admin');
        elementosProhibidos.forEach(el => el.remove());

        // Eliminar herramientas de edición en el mapa de mesas
        const toolsAdmin = document.querySelectorAll('.mesa-admin-tools');
        toolsAdmin.forEach(el => el.remove());
    }
}

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);

        if (response.status === 401) {
            console.error("Sesión expirada detectada por el servidor.");
            localStorage.clear();
            // Evitar bucle si ya estamos en el login
            if (!window.location.pathname.toLowerCase().includes('login')) {
                window.location.href = "/Webcony/login?error=sesion_expirada";
            }
        }
        return response;
    } catch (error) {
        // En caso de error de red grave
        console.error("Error de red interceptado:", error);
        throw error;
    }
};