/* ==========================================================================
   DICCIONARIO DE TRADUCCIONES
   ========================================================================== */
window.traducciones = {
    es: {
        titulo_bienvenida: "Bienvenido",
        titulo_categorias: "Categorías",
        pregunta_idioma: "Selecciona tu idioma preferido",
        btn_carrito: "Mi Carrito",
        btn_historial: "Mi Pedido",
        msg_mesa_no_asignada: "Mesa no asignada",
        msg_pedido_enviado: "¡Pedido enviado!",
        precios_iva: "Precios en Pesos Colombianos. IVA incluido.",
        btn_finalizar: "Solicitar Cuenta/Salir",
        bienvenida_footer: "Bienvenidos a Balcony",
        Detalles_Producto: "Detalle del Producto",
        Boton_Cerrar_Productos: "Cerrar",
        Boton_AgregarProducto: "Agregar al carrito",
        Modal_Carrito: "Carrito de Compras",
        Boton_CerrarCarrito: "Cerrar",
        Boton_RealizaPedidos: "Realizar pedido",
        Llamar_Mesero: "¿Deseas llamar al mesero?",
        MeseroMensa: "Un mesero será notificado y se acercará a tu mesa.",
        BotonCerrar_Mesero: "Cerrar",
        Boton_LlamarMesero: "Sí,llamar",
        Modal_Pedido: "Mi Pedido - Mesa",
        Total_Pedido: "Total Acumulado:",
        Boton_SeguirPidiendo: "Seguir Pidiendo",
        MensajeFinal: "¡Gracias por tu visita!",
        Calificacion: "¿Cómo calificarías nuestro servicio hoy?",
        FinalizarVisita: "Enviar y Finalizar",
        confirmar_idioma: "Español 🇪🇸",
        cancelar_idioma: "English 🇺🇸",
        texto_idioma: "Selecciona tu idioma para continuar / Select your language"
    },
    en: {
        titulo_bienvenida: "Welcome",
        titulo_categorias: "Categories",
        pregunta_idioma: "Select your preferred language",
        btn_carrito: "My Cart",
        btn_historial: "My Order",
        msg_mesa_no_asignada: "Table not assigned",
        msg_pedido_enviado: "Order sent!",
        precios_iva: "Prices in Colombian pesos. VAT included.",
        btn_finalizar: "Request an Account/Finish Visit",
        bienvenida_footer: "Welcome to Balcony",
        Detalles_Producto: "Product Details",
        Boton_Cerrar_Productos: "Close",
        Boton_AgregarProducto: "Add to cart",
        Modal_Carrito: "Shopping Cart",
        Boton_CerrarCarrito: "Close",
        Boton_RealizaPedidos: "Place an order",
        Llamar_Mesero: "Would you like to call the waiter?",
        MeseroMensa: "A server will be notified and will come to your table.",
        BotonCerrar_Mesero: "Close",
        Boton_LlamarMesero: "Yes, call",
        Modal_Pedido: "My Order - Table",
        Total_Pedido: "Cumulative Total:",
        Boton_SeguirPidiendo: "Continue Ordering",
        MensajeFinal: "Thank you for visiting!",
        Calificacion: "How would you rate our service today?",
        FinalizarVisita: "Submit and Finish",
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
    },

    // NUEVA FUNCIÓN: Traducción automática para descripciones
    async traducirTexto(texto) {
        const idiomaDestino = localStorage.getItem('idioma_usuario') || 'es';
        if (idiomaDestino === 'es' || !texto) return texto;

        // 1. REVISAR CACHÉ: Si ya lo tradujimos antes, devolverlo de inmediato
        if (!window.traduccionesCache) window.traduccionesCache = {};
        if (window.traduccionesCache[texto]) return window.traduccionesCache[texto];

        try {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=es|${idiomaDestino}`);
            const data = await res.json();
            const resultado = data.responseData.translatedText;

            // 2. GUARDAR EN CACHÉ para la próxima vez
            window.traduccionesCache[texto] = resultado;
            return resultado;
        } catch (err) {
            return texto;
        }
    }
};