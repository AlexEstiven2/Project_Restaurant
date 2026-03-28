/* ==========================================================================
   DICCIONARIO DE TRADUCCIONES
   ========================================================================== */
const traducciones = {
    es: {
        titulo_bienvenida: "Bienvenido",
        pregunta_idioma: "Selecciona tu idioma preferido",
        btn_carrito: "Mi Carrito",
        btn_historial: "Mi Pedido",
        msg_mesa_no_asignada: "Mesa no asignada",
        msg_pedido_enviado: "¡Pedido enviado!",
        btn_finalizar: "Finalizar Visita",
        confirmar_idioma: "Español 🇪🇸",
        cancelar_idioma: "English 🇺🇸",
        texto_idioma: "Selecciona tu idioma para continuar / Select your language"
    },
    en: {
        titulo_bienvenida: "Welcome",
        pregunta_idioma: "Select your preferred language",
        btn_carrito: "My Cart",
        btn_historial: "My Order",
        msg_mesa_no_asignada: "Table not assigned",
        msg_pedido_enviado: "Order sent!",
        btn_finalizar: "Finish Visit",
        confirmar_idioma: "Español 🇪🇸",
        cancelar_idioma: "English 🇺🇸",
        texto_idioma: "Selecciona tu idioma para continuar / Select your language"
    }
};

// Función global para manejar el cambio
window.IdiomaManager = {
    actual: 'es', // Por defecto español si cancelan de forma extraña

    async preguntar() {
        // Eliminamos la validación de "if (localStorage.getItem...)" 
        // para que la función siempre ejecute el Swal.fire

        const result = await Swal.fire({
            title: 'Language / Idioma',
            text: "Selecciona tu idioma para continuar / Select your language",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#000000',
            confirmButtonText: 'Español 🇪🇸',
            cancelButtonText: 'English 🇺🇸',
            allowOutsideClick: false,
            heightAuto: false
        });

        // result.isConfirmed es el botón Amarillo (Español)
        // result.isDismissed es el botón Negro (Inglés)
        const seleccion = result.isConfirmed ? 'es' : 'en';
        this.aplicar(seleccion);
    },

    aplicar(idioma) {
        this.actual = idioma;
        localStorage.setItem('idioma_usuario', idioma);
        
        // Ejecuta la traducción en el HTML
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const clave = el.getAttribute('data-i18n');
            if (traducciones[idioma][clave]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = traducciones[idioma][clave];
                } else {
                    el.innerText = traducciones[idioma][clave];
                }
            }
        });
    }
};