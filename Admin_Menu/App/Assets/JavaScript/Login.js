/* ==========================================================================
   LOGIN.JS - GESTIÓN DE ACCESO Y NOTIFICACIONES DE SEGURIDAD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DETECTAR ERRORES DE SEGURIDAD (Redirecciones de Security.js o Middleware)
    const urlParams = new URLSearchParams(window.location.search);
    const errorType = urlParams.get('error');
    const errorMsgDiv = document.getElementById('error-message');

    if (errorType === 'sesion_expirada') {
        if (errorMsgDiv) {
            errorMsgDiv.textContent = "Su sesión ha expirado por seguridad. Ingrese de nuevo.";
            errorMsgDiv.classList.remove('d-none');
        }
        
        // Notificación visual elegante con SweetAlert
        Swal.fire({
            icon: 'warning',
            title: 'Sesión Finalizada',
            text: 'Por tu seguridad, la sesión se cierra automáticamente tras un periodo de inactividad.',
            confirmButtonColor: '#ffc107',
            timer: 4000
        });
    }

    // 2. GESTIÓN DEL FORMULARIO DE LOGUEO
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Elementos de la UI
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-message');
            const btn = document.getElementById('btnLogin');
            const spinner = document.getElementById('btnSpinner');
            const btnText = document.getElementById('btnText');

            // Reset de UI antes de la petición
            errorMsg.classList.add('d-none');
            btn.disabled = true;
            spinner.classList.remove('d-none');
            btnText.classList.add('d-none');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // --- SEGURIDAD: Limpiar cualquier residuo de sesiones anteriores ---
                    localStorage.clear();

                    // Guardar datos de sesión actual
                    localStorage.setItem('userRol', data.rol);
                    localStorage.setItem('userName', data.nombre);
                    
                    // Redirigir al dashboard según lo que envíe el servidor
                    window.location.href = data.redirect;
                } else {
                    // Mostrar error del servidor (Usuario/Contraseña incorrectos, etc.)
                    errorMsg.textContent = data.message || "Credenciales incorrectas.";
                    errorMsg.classList.remove('d-none');
                }
            } catch (error) {
                console.error("Error en login:", error);
                errorMsg.textContent = "Error de conexión con el servidor.";
                errorMsg.classList.remove('d-none');
            } finally {
                // Restaurar estado del botón
                btn.disabled = false;
                spinner.classList.add('d-none');
                btnText.classList.remove('d-none');
            }
        });
    }
});