/* ==========================================================================
   MENU_DIGITAL.JS - VERSIÓN FINAL CORREGIDA SEGÚN SQL RECIBIDO
   ========================================================================== */
//Johan const MI_IP = "192.168.1.33";
//Casa const MI_IP = "192.168.1.21";
//const BASE_URL_API = `http://${MI_IP}:${PUERTO}/api`;
const MI_IP = "192.168.1.21";
const PUERTO = "9090";
const BASE_URL_API = window.location.origin + "/api";

const URL_ADMIN_PRODUCCION = "https://tu-admin-menu.vercel.app";

const BASE_URLS = {
    categoria: `${URL_ADMIN_PRODUCCION}/Image/Categoria/`,
    subcategoria: `${URL_ADMIN_PRODUCCION}/Image/SubCategoria/`,
    producto: `${URL_ADMIN_PRODUCCION}/Image/Productos/`,
};

let carrito = JSON.parse(localStorage.getItem('carrito_temporal')) || [];
let numeroMesaActual = null;
let estadoAnterior = null;


//Seguridas para el Uso de Ngrok - pruebas con pasarela de pago, Se añade en todo el código
async function fetchConSeguridad(url, opciones = {}) {
    if (window.location.hostname.includes('ngrok')) {
        opciones.headers = {
            ...opciones.headers,
            'ngrok-skip-browser-warning': 'true'
        };
    }

    return fetch(url, opciones);
}


document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    numeroMesaActual = params.get('mesa') || localStorage.getItem('mesa_sesion');


    /* --- 1. GUARDIA DE SEGURIDAD: VALIDACIÓN DE MESA --- */
    if (!numeroMesaActual) {
        await alertTraducida({
            title: 'Mesa no asignada',
            text: 'Para realizar un pedido, debes escanear el código QR de tu mesa.',
            icon: 'warning',
            allowOutsideClick: false,
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'Entendido'
        }).then(() => {
            window.location.href = "/";
        });
        return;
    }

// --- LÓGICA DE MULTILENGUAJE INTELIGENTE ---
    
    let idiomaGuardado = localStorage.getItem('idioma_usuario');

    if (window.IdiomaManager) {
        if (!idiomaGuardado) {
            await window.IdiomaManager.preguntar();
            // Actualizamos la variable después de la pregunta
            idiomaGuardado = localStorage.getItem('idioma_usuario');
        }
        window.IdiomaManager.aplicar(idiomaGuardado || 'es');
    }

    // Guardamos la mesa en sesión
    localStorage.setItem('mesa_sesion', numeroMesaActual);

    // Si hay mesa, marcarla como ocupada
    fetchConSeguridad(`${BASE_URL_API}/mesas/ocupar/${numeroMesaActual}`, { method: 'POST' })
        .catch(e => console.error("Error al ocupar mesa:", e));

    cargarCategorias();
    actualizarBadge();

    await verificarConsumoActivo();

    /* --- LISTENERS DE INTERFAZ --- */
    document.getElementById('btn-carrito')?.addEventListener('click', () => {
        mostrarCarrito();
        const modalEl = document.getElementById('modalCarrito');
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });

    document.getElementById('btn-mi-pedido')?.addEventListener('click', () => verHistorial(true));
    document.getElementById("confirmCallWaiter")?.addEventListener("click", llamarMesero);

    document.getElementById('btnFinalizarVisita')?.addEventListener('click', () => {
        const modalPago = new bootstrap.Modal(document.getElementById('modalMetodoPago'));
        modalPago.show();
    });

    // Estrellas de Feedback
    document.querySelectorAll('.star-item').forEach(star => {
        star.addEventListener('click', (e) => {
            const val = e.target.getAttribute('data-value');
            document.getElementById('mensaje-estrellas').innerText = `Calificación: ${val} estrellas`;
            document.querySelectorAll('.star-item').forEach(s => {
                s.classList.toggle('bi-star-fill', s.getAttribute('data-value') <= val);
                s.classList.toggle('bi-star', s.getAttribute('data-value') > val);
            });
        });
    });

    setInterval(rastrearEstadoPedido, 2000);


    //Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('pago') === 'exitoso') {
        carrito = [];
        localStorage.removeItem('carrito_temporal');
        actualizarBadge();

        await fetchConSeguridad(`${BASE_URL_API}/mesas/estado-por-numero/${numeroMesaActual}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'PAGO CONFIRMADO' })
        });

        await alertTraducida({
            title: '¡Pago Confirmado!',
            text: 'Tu cuenta ha sido cancelada con éxito.',
            icon: 'success',
            confirmButtonText: 'Calificar servicio',
            confirmButtonColor: '#ffc107'
        }).then(() => {
            const modalFeedback = new bootstrap.Modal(document.getElementById('modalFeedback'));
            modalFeedback.show();
        });
    }
});

/* ==========================================================================
   FUNCIONALIDADES DE LA API
   ========================================================================== */

function actualizarBadge() {
    const b = document.getElementById('carrito-count');
    if (b) {
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        b.textContent = totalItems;
        b.classList.toggle('d-none', totalItems === 0);
    }
    localStorage.setItem('carrito_temporal', JSON.stringify(carrito));
}

async function verificarConsumoActivo() {
    if (!numeroMesaActual) return;
    await verHistorial(false);
}

async function llamarMesero() {
    try {
        const res = await fetchConSeguridad(`${BASE_URL_API}/mesas/llamar-mesero/${numeroMesaActual}`, { method: 'POST' });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('callWaiterModal'))?.hide();
            await alertTraducida({ title: 'Mesero avisado', icon: 'info', confirmButtonColor: '#ffc107' });
        }
    } catch (e) { console.error("Error:", e); }
}

document.getElementById('btnRealizarPedido')?.addEventListener('click', async () => {
    if (carrito.length === 0) return;
    if (!numeroMesaActual) return Swal.fire('Error', 'Mesa no válida', 'error');

    try {
        const res = await fetchConSeguridad(`/api/pedidos/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesa: numeroMesaActual,
                items: carrito.map(item => ({
                    ID_PRODUCT: item.ID_PRODUCTOS,
                    CANTIDAD: item.cantidad,
                    PRECIO_UNITARIO: item.PRECIO_PRO,
                    OBSERVACIONES: item.notas
                }))
            })
        });

        if (res.ok) {
            await fetchConSeguridad(`${BASE_URL_API}/mesas/estado/esperando/${numeroMesaActual}`, { method: 'POST' });

            carrito = [];
            localStorage.removeItem('carrito_temporal');
            actualizarBadge();


            bootstrap.Modal.getInstance(document.getElementById('modalCarrito')).hide();

            setTimeout(() => {
                verHistorial(false);
            }, 500);

            await alertTraducida({ title: '¡Pedido enviado!', text: 'Preparando tu orden.', icon: 'success' });
        }
    } catch (e) {
        await alertTraducida({ title: 'Error', text: 'No se pudo conectar', icon: 'error' });
    }
});

async function verHistorial(mostrarModal = true) {
    if (!numeroMesaActual) return;

    try {
        const res = await fetchConSeguridad(`/api/pedidos/mesa/${numeroMesaActual}?_=${Date.now()}`);
        const data = await res.json();
        const cont = document.getElementById('historial-contenido');
        const btnMiPedido = document.getElementById('btn-mi-pedido');
        let total = 0;

        if (data && data.length > 0) {
            if (btnMiPedido) btnMiPedido.classList.remove('d-none');

            const itemsTraducidos = await Promise.all(data.map(async (p) => {
                total += parseFloat(p.SUBTOTAL);
                return `<div class="d-flex justify-content-between border-bottom py-2">
                    <span>${p.CANTIDAD}x ${p.NOMBRE_PRODUCTO}</span>
                    <span class="fw-bold">$${parseFloat(p.SUBTOTAL).toLocaleString()}</span>
                </div>`;
            }));

            cont.innerHTML = itemsTraducidos.join('');
        } else {
            const msgVacio = await window.IdiomaManager.traducirTexto("Aún no tienes pedidos registrados.");
            cont.innerHTML = `<p class="text-center py-3">${msgVacio}</p>`;
        }

        const totalElement = document.getElementById('total-historial');
        if (totalElement) totalElement.innerText = `$${total.toLocaleString()}`;

        if (mostrarModal) {
            const modalH = document.getElementById('modalHistorial');
            bootstrap.Modal.getOrCreateInstance(modalH).show();
        }
    } catch (e) { console.error("Error historial:", e); }
}

document.getElementById('btnEnviarFeedback')?.addEventListener('click', async (e) => {
    e.preventDefault();

    const estrellas = document.querySelectorAll('.bi-star-fill').length;
    const comentario = document.getElementById('comentarioFeedback').value;

    if (estrellas === 0) {
        return await alertTraducida('Atención', 'Por favor selecciona una calificación', 'warning');
    }

    try {
        const responseFeedback = await fetchConSeguridad(`${BASE_URL_API}/feedback/guardar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesa: numeroMesaActual,
                estrellas: estrellas,
                comentario: comentario
            })
        });

        if (responseFeedback.ok) {
            await fetchConSeguridad(`${BASE_URL_API}/mesas/estado-por-numero/${numeroMesaActual}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'PAGO CONFIRMADO' }) // <--- ACTIVACIÓN GRIS
            });

            await alertTraducida({
                title: '¡Gracias por tu visita!',
                text: 'Tu opinión es muy valiosa. ¡Vuelve pronto!',
                icon: 'success'
            }).then(() => {
                localStorage.clear();
                window.location.href = "/";
            });
        }
    } catch (e) { console.error(e); }
});

/* ==========================================================================
   RASTREO DE ESTADOS (NOTIFICACIONES EN TIEMPO REAL)
   ========================================================================== */
async function rastrearEstadoPedido() {
    if (!numeroMesaActual) return;
    try {
        const res = await fetchConSeguridad(`${BASE_URL_API}/pedidos/estado-ultimo/${numeroMesaActual}?t=${new Date().getTime()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ESTADO_PEDIDO) return;

        const nuevoEstado = data.ESTADO_PEDIDO;

        if (estadoAnterior === null) { estadoAnterior = nuevoEstado; return; }
        if (nuevoEstado === estadoAnterior) return;

        if (nuevoEstado === 'EN_PREPARACION') {
            await alertTraducida({
                title: '¡Pedido en cocina!',
                text: 'El chef está preparando tus platos.',
                icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000
            });
        }

        if (nuevoEstado === 'ENTREGADO' && estadoAnterior !== 'ENTREGADO') {
            await alertTraducida({
                title: '¡Buen provecho!',
                text: 'Tu pedido ya ha sido servido en la mesa.',
                icon: 'success', timer: 5000,
                backdrop: `rgba(0,0,123,0.1) url("/Image/Animaciones/delivery.gif") center center no-repeat`
            });
        }

        estadoAnterior = nuevoEstado;
    } catch (e) { console.error("Error rastreo:", e); }
}

/* ==========================================================================
   RENDERIZADO DE MENÚ (AUXILIARES)
   ========================================================================== */
async function cargarCategorias() {
    try {
        const res = await fetchConSeguridad(`${BASE_URL_API}/menu/categorias`);
        const data = await res.json();
        const contenedor = document.querySelector('.scroll-categorias');
        contenedor.innerHTML = data.map(cat => `
            <button class="categoria-item me-3" onclick="cargarSubcategorias(${cat.ID_CATEGORIA})">
                <img src="${cat.IMAGEN}" class="categoria-img">
            </button>
        `).join('');
    } catch (e) { console.error(e); }
}

async function cargarSubcategorias(idCat) {
    try {
        const res = await fetchConSeguridad(`${BASE_URL_API}/menu/subcategorias/${idCat}`);
        const data = await res.json();
        const lista = document.getElementById('subcategoria-lista');
        document.getElementById('subcategorias').classList.remove('d-none');

        const promesasTraducion = data.map(sub => window.IdiomaManager.traducirTexto(sub.NOMBRE_SUBCATE));
        const nombresTraducidos = await Promise.all(promesasTraducion);

        lista.innerHTML = data.map((sub, index) => `
            <button class="subcategoria-item me-3" onclick="cargarProductos(${sub.ID_SUBCATEGORIA})">
                <div class="subcategoria-img-container">
                    <img src="${sub.IMAGEN}" onerror="this.src='/Image/placeholder.png'">
                    <div class="subcategoria-label">${nombresTraducidos[index]}</div>
                </div>
            </button>
        `).join('');
    } catch (e) { console.error(e); }
}

async function cargarProductos(idSub) {
    try {
        const res = await fetchConSeguridad(`${BASE_URL_API}/menu/productos/${idSub}`);
        const data = await res.json();
        const contenedor = document.getElementById('productos');
        contenedor.classList.remove('d-none');

        const descripcionesTraducidas = await Promise.all(
            data.map(prod => window.IdiomaManager.traducirTexto(prod.DESCRIPCION_PRO || ""))
        );

        contenedor.innerHTML = data.map((prod, index) => `
            <div class="col-12 mb-2">
                <div class="producto-item" onclick='abrirDetalle(${JSON.stringify(prod)})'>
                    <img src="${prod.IMAGEN}" class="producto-img me-3" onerror="this.src='/Image/placeholder.png'">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-1">${prod.NOMBRE_PRODUCTO}</h6>
                        <p class="text-muted small mb-0">${descripcionesTraducidas[index]}</p>
                        <span class="text-success fw-bold">$${parseFloat(prod.PRECIO_PRO).toLocaleString()}</span>
                    </div>
                    <i class="bi bi-plus-circle fs-4 text-warning"></i>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

function abrirDetalle(prod) {
    const descOriginal = prod.DESCRIPCION_PRO || prod.descripcion_pro || prod.Descripcion_Pro || "";

    const contenidoModal = document.getElementById('modalDetalleContenido');
    contenidoModal.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-warning"></div></div>`;

    window.IdiomaManager.traducirTexto(descOriginal).then(descTraducida => {
        // 3. Verificación de seguridad: Si la API devuelve su mensaje de error, usamos el original
        let textoFinal = descTraducida;
        if (descTraducida.includes("QUERY") || descTraducida.includes("EXAMPLE")) {
            textoFinal = descOriginal;
        }

        contenidoModal.innerHTML = `
            <div class="text-center">
                <img src="${prod.IMAGEN}" class="img-fluid rounded-3 mb-3" style="max-height: 200px;">
                <h4 class="fw-bold">${prod.NOMBRE_PRODUCTO}</h4>
                <p class="text-muted">${textoFinal || 'Delicious traditional dish'}</p>
                <input type="number" id="cantDet" class="form-control text-center mx-auto w-25" value="1" min="1">
                <textarea id="notasDet" class="form-control mt-2" placeholder="Ej: Sin cebolla..."></textarea>
            </div>`;
    });

    document.getElementById("btnAgregarDesdeModal").onclick = () => {
        const cant = parseInt(document.getElementById("cantDet").value);
        carrito.push({ ...prod, cantidad: cant, notas: document.getElementById("notasDet").value });
        actualizarBadge();
        bootstrap.Modal.getInstance(document.getElementById('modalDetalleProducto')).hide();
    };
    new bootstrap.Modal(document.getElementById('modalDetalleProducto')).show();
}

function mostrarCarrito() {
    const cont = document.getElementById('carritoContenido');
    let total = 0;
    cont.innerHTML = carrito.length ? carrito.map(item => {
        total += item.PRECIO_PRO * item.cantidad;
        return `<div class="d-flex justify-content-between mb-2">
            <span>${item.cantidad}x ${item.NOMBRE_PRODUCTO}</span>
            <span class="fw-bold">$${(item.PRECIO_PRO * item.cantidad).toLocaleString()}</span>
        </div>`;
    }).join('') : '<p class="text-center">Tu carrito está vacío</p>';
    document.getElementById('totalCarrito').textContent = total.toLocaleString();
}

function actualizarBadge() {
    const b = document.getElementById('carrito-count');
    if (b) {
        b.textContent = carrito.length;
        b.classList.toggle('d-none', carrito.length === 0);
    }
}

async function alertTraducida({ title, text, icon, confirmButtonText, ...props }) {
    const idioma = localStorage.getItem('idioma_usuario') || 'es';
    let tTit = title, tTxt = text, tBtn = confirmButtonText || 'Aceptar';

    if (idioma !== 'es') {
        tTit = await window.IdiomaManager.traducirTexto(title);
        tTxt = await window.IdiomaManager.traducirTexto(text);
        if (confirmButtonText) tBtn = await window.IdiomaManager.traducirTexto(confirmButtonText);
    }

    return Swal.fire({
        title: tTit,
        text: tTxt,
        icon: icon || 'info',
        confirmButtonColor: '#ffc107',
        confirmButtonText: tBtn,
        ...props
    });
}

/* ==========================================================================
   FUNCIÓN GLOBAL DE FEEDBACK
   ========================================================================== */
window.abrirModalFeedback = function () {
    console.log("Iniciando apertura de modal de calificación...");

    const modalFeedbackEl = document.getElementById('modalFeedback');

    if (modalFeedbackEl) {
        const modalFeedback = bootstrap.Modal.getOrCreateInstance(modalFeedbackEl);
        modalFeedback.show();
    } else {
        console.error("CRÍTICO: No se encontró el ID 'modalFeedback' en el HTML.");
        Swal.fire({
            title: '¡Gracias por visitarnos!',
            text: 'Tu opinión es muy importante para nosotros.',
            icon: 'success',
            confirmButtonColor: '#ffc107'
        });
    }
};

/* ==========================================================================
   LÓGICA DE PAGOS - MENU_DIGITAL 
   ========================================================================== */
async function elegirMercadoPago() {
    try {
        const totalTexto = document.getElementById('total-historial')?.innerText || "0";
        const totalLimpio = parseFloat(totalTexto.replace(/[^0-9.-]+/g, ""));

        if (!totalLimpio || totalLimpio <= 0) {
            return alertTraducida({ title: 'Atención', text: 'No hay un monto para pagar', icon: 'warning' });
        }

        Swal.fire({ title: 'Generando pago...', didOpen: () => Swal.showLoading() });

        const response = await fetchConSeguridad('/api/pagos/mercadopago/preferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa: numeroMesaActual, total: totalLimpio })
        });

        const data = await response.json();

        if (data.init_point) {
            // 1. Cambiamos estado a 'PAGANDO' (Rosado/ Admin)
            await fetchConSeguridad(`${BASE_URL_API}/mesas/estado-por-numero/${numeroMesaActual}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'PAGANDO' })
            });

            // 2. Abrir pasarela
            window.open(data.init_point, '_blank');

            bootstrap.Modal.getInstance(document.getElementById('modalMetodoPago'))?.hide();

            await alertTraducida({
                title: 'Pago iniciado',
                text: 'Completa el pago en la otra pestaña. Al terminar, vuelve aquí para calificar.',
                icon: 'info',
                confirmButtonText: 'Entendido'
            }).then(() => {
                abrirModalFeedback();
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo conectar con Mercado Pago', 'error');
    }
}

async function elegirPagoEfectivo() {
    try {
        // 1. Notificar al Admin (Color Amarillo)
        await fetchConSeguridad(`${BASE_URL_API}/mesas/estado-por-numero/${numeroMesaActual}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'PIDIENDO FACTURA' })
        });

        const modalPagoEl = document.getElementById('modalMetodoPago');
        if (modalPagoEl) {
            bootstrap.Modal.getOrCreateInstance(modalPagoEl).hide();
        }

        await alertTraducida({
            title: 'Solicitud enviada',
            text: 'Un mesero se acercará a tu mesa para recibir el pago en efectivo.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#28a745'
        }).then(() => {
            abrirModalFeedback();
        });

    } catch (e) {
        console.error("Error al solicitar efectivo:", e);
    }
}