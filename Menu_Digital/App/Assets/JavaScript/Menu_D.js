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
    producto: `${URL_ADMIN_PRODUCCION}/Image/Productos/`
};

// CAMBIO 1: Cargar carrito guardado al iniciar para que no se borre al refrescar
let carrito = JSON.parse(localStorage.getItem('carrito_temporal')) || [];
let numeroMesaActual = null;
let estadoAnterior = null;

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

    //funcion de Multilenguaje
    localStorage.removeItem('idioma_usuario');

    if (window.IdiomaManager) {
        await window.IdiomaManager.preguntar();

        window.IdiomaManager.aplicar(localStorage.getItem('idioma_usuario') || 'es');
    }

    // Guardamos la mesa en sesión
    localStorage.setItem('mesa_sesion', numeroMesaActual);

    // Si hay mesa, marcarla como ocupada
    fetch(`${BASE_URL_API}/mesas/ocupar/${numeroMesaActual}`, { method: 'POST' })
        .catch(e => console.error("Error al ocupar mesa:", e));

    cargarCategorias();
    actualizarBadge();

    // IMPORTANTE: Esperamos a que el historial cargue para mostrar el botón
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
        const modalFeedback = new bootstrap.Modal(document.getElementById('modalFeedback'));
        modalFeedback.show();
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
});

/* ==========================================================================
   FUNCIONALIDADES DE LA API
   ========================================================================== */

// CAMBIO 3: Función para manejar el Badge y el LocalStorage del carrito
function actualizarBadge() {
    const b = document.getElementById('carrito-count');
    if (b) {
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        b.textContent = totalItems;
        b.classList.toggle('d-none', totalItems === 0);
    }
    localStorage.setItem('carrito_temporal', JSON.stringify(carrito));
}

// CAMBIO 4: Función para verificar si el cliente ya tiene pedidos en la DB
async function verificarConsumoActivo() {
    if (!numeroMesaActual) return;
    await verHistorial(false);
}

async function llamarMesero() {
    try {
        const res = await fetch(`${BASE_URL_API}/mesas/llamar-mesero/${numeroMesaActual}`, { method: 'POST' });
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
        const res = await fetch(`/api/pedidos/enviar`, {
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
            await fetch(`${BASE_URL_API}/mesas/estado/esperando/${numeroMesaActual}`, { method: 'POST' });

            // LIMPIEZA DE CARRITO POST-ENVÍO
            carrito = [];
            localStorage.removeItem('carrito_temporal');
            actualizarBadge();

            // Cerramos modal carrito
            bootstrap.Modal.getInstance(document.getElementById('modalCarrito')).hide();

            // ACTUALIZACIÓN EN TIEMPO REAL: Refrescamos historial para que aparezca el botón
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
        const res = await fetch(`/api/pedidos/mesa/${numeroMesaActual}?_=${Date.now()}`);
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
            // El mensaje de "vacío" también lo pasamos por el i18n o traductor
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
    e.preventDefault(); // Evita cualquier recarga accidental en móviles

    const estrellas = document.querySelectorAll('.bi-star-fill').length;
    const comentario = document.getElementById('comentarioFeedback').value;

    if (estrellas === 0) {
        return await alertTraducida('Atención', 'Por favor selecciona una calificación', 'warning');
    }

    try {
        // USAMOS LA RUTA QUE DEFINIMOS EN EL ROUTER: /guardar
        const url = `${BASE_URL_API}/feedback/guardar`;
        console.log("Enviando a:", url); // Para debug en PC

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesa: numeroMesaActual,
                estrellas: estrellas,
                comentario: comentario
            })
        });

        if (response.ok) {
            await fetch(`${BASE_URL_API}/mesas/solicitar-cuenta/${numeroMesaActual}`, { method: 'POST' });
            await alertTraducida({ title: '¡Gracias!', icon: 'success' }).then(() => {
                window.location.href = "/";
            });
        } else {
            throw new Error("Error en el servidor");
        }
    } catch (e) {
        console.error(e);
        // Esto te dirá en el celular qué está pasando
        await alertTraducida('Error', 'No se pudo enviar: ' + e.message, 'error');
    }
});

/* ==========================================================================
   RASTREO DE ESTADOS (NOTIFICACIONES EN TIEMPO REAL)
   ========================================================================== */
async function rastrearEstadoPedido() {
    if (!numeroMesaActual) return;
    try {
        const res = await fetch(`${BASE_URL_API}/pedidos/estado-ultimo/${numeroMesaActual}?t=${new Date().getTime()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.ESTADO_PEDIDO) return;

        const nuevoEstado = data.ESTADO_PEDIDO;

        if (estadoAnterior === null) { estadoAnterior = nuevoEstado; return; }
        if (nuevoEstado === estadoAnterior) return;

        if (nuevoEstado === 'EN_PREPARACION' && estadoAnterior === 'PENDIENTE') {
            await alertTraducida({
                title: '¡Pedido en cocina!',
                text: 'El chef está preparando tus platos.',
                icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true
            });
        }

        if (nuevoEstado === 'ENTREGADO' && estadoAnterior !== 'ENTREGADO') {
            await alertTraducida({
                title: '¡Pedido en camino!',
                text: 'Tu comida va directo a tu mesa.',
                icon: 'success', timer: 5000, timerProgressBar: true,
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
        const res = await fetch(`${BASE_URL_API}/menu/categorias`);
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
        const res = await fetch(`${BASE_URL_API}/menu/subcategorias/${idCat}`);
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
        const res = await fetch(`${BASE_URL_API}/menu/productos/${idSub}`);
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
    // 1. Buscamos la descripción en cualquier variante posible
    const descOriginal = prod.DESCRIPCION_PRO || prod.descripcion_pro || prod.Descripcion_Pro || "";

    // 2. Limpieza inmediata del modal para quitar el mensaje de error previo
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