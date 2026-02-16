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

let carrito = [];
let numeroMesaActual = null;
let estadoAnterior = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    numeroMesaActual = params.get('mesa');

    /* --- 1. GUARDIA DE SEGURIDAD: VALIDACIÓN DE MESA --- */
    if (!numeroMesaActual) {
        Swal.fire({
            title: 'Mesa no asignada',
            text: 'Para realizar un pedido, debes escanear el código QR de tu mesa.',
            icon: 'warning',
            allowOutsideClick: false,
            confirmButtonColor: '#ffc107',
            confirmButtonText: 'Entendido'
        }).then(() => {
            window.location.href = "/"; // Redirigir al inicio o landing page
        });
        return; 
    }

    // Si hay mesa, marcarla como ocupada
    fetch(`${BASE_URL_API}/mesas/ocupar/${numeroMesaActual}`, { method: 'POST' })
        .catch(e => console.error("Error al ocupar mesa:", e));

    cargarCategorias();

    /* --- LISTENERS DE INTERFAZ --- */
    document.getElementById('btn-carrito')?.addEventListener('click', () => {
        mostrarCarrito();
        const modalEl = document.getElementById('modalCarrito');
        new bootstrap.Modal(modalEl).show();
    });

    document.getElementById('btn-mi-pedido')?.addEventListener('click', verHistorial);
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

    /* --- INICIAR RASTREO INMEDIATO (Cada 2 segundos) --- */
    setInterval(rastrearEstadoPedido, 2000);
});

/* ==========================================================================
   FUNCIONALIDADES DE LA API
   ========================================================================== */

async function llamarMesero() {
    try {
        const res = await fetch(`${BASE_URL_API}/mesas/llamar-mesero/${numeroMesaActual}`, { method: 'POST' });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('callWaiterModal'))?.hide();
            Swal.fire({ title: 'Mesero avisado', icon: 'info', confirmButtonColor: '#ffc107' });
        }
    } catch (e) { console.error("Error:", e); }
}

document.getElementById('btnRealizarPedido')?.addEventListener('click', async () => {
    if (carrito.length === 0) return;
    if (!numeroMesaActual) return Swal.fire('Error', 'Mesa no válida', 'error');

    try {
        const res = await fetch(`${BASE_URL_API}/pedidos/enviar`, {
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
            carrito = [];
            actualizarBadge();
            bootstrap.Modal.getInstance(document.getElementById('modalCarrito')).hide();
            Swal.fire({ title: '¡Pedido enviado!', text: 'Preparando tu orden.', icon: 'success' });
        }
    } catch (e) {
        Swal.fire({ title: 'Error', text: 'No se pudo conectar', icon: 'error' });
    }
});

async function verHistorial() {
    try {
        const res = await fetch(`${BASE_URL_API}/pedidos/mesa/${numeroMesaActual}`);
        const data = await res.json();
        const cont = document.getElementById('historial-contenido');
        let total = 0;

        document.getElementById('mesa-historial-title').innerText = numeroMesaActual;
        cont.innerHTML = data.length ? data.map(p => {
            total += parseFloat(p.SUBTOTAL);
            return `<div class="d-flex justify-content-between border-bottom py-2">
                <span>${p.CANTIDAD}x ${p.NOMBRE_PRODUCTO}</span>
                <span class="fw-bold">$${parseFloat(p.SUBTOTAL).toLocaleString()}</span>
            </div>`;
        }).join('') : '<p class="text-center">No hay pedidos registrados.</p>';

        document.getElementById('total-historial').innerText = `$${total.toLocaleString()}`;
        new bootstrap.Modal(document.getElementById('modalHistorial')).show();
    } catch (e) { console.error("Error historial:", e); }
}

document.getElementById('btnEnviarFeedback')?.addEventListener('click', async (e) => {
    e.preventDefault(); // Evita cualquier recarga accidental en móviles
    
    const estrellas = document.querySelectorAll('.bi-star-fill').length;
    const comentario = document.getElementById('comentarioFeedback').value;

    if (estrellas === 0) {
        return Swal.fire('Atención', 'Por favor selecciona una calificación', 'warning');
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
            Swal.fire({ title: '¡Gracias!', icon: 'success' }).then(() => {
                window.location.href = "/";
            });
        } else {
            throw new Error("Error en el servidor");
        }
    } catch (e) {
        console.error(e);
        // Esto te dirá en el celular qué está pasando
        Swal.fire('Error', 'No se pudo enviar: ' + e.message, 'error');
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
            Swal.fire({
                title: '¡Pedido en cocina!',
                text: 'El chef está preparando tus platos. 👨‍🍳',
                icon: 'info', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true
            });
        }

        if (nuevoEstado === 'ENTREGADO' && estadoAnterior !== 'ENTREGADO') {
            Swal.fire({
                title: '¡Pedido en camino! 🚀',
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
        document.getElementById('subcategorias').classList.remove('d-none');
        document.getElementById('subcategoria-lista').innerHTML = data.map(sub => `
            <button class="subcategoria-item me-3" onclick="cargarProductos(${sub.ID_SUBCATEGORIA})">
                <div class="subcategoria-img-container">
                    <img src="${sub.IMAGEN}">
                    <div class="subcategoria-label">${sub.NOMBRE_SUBCATE}</div>
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
        contenedor.innerHTML = data.map(prod => `
            <div class="col-12 mb-2">
                <div class="producto-item" onclick='abrirDetalle(${JSON.stringify(prod)})'>
                    <img src="${prod.IMAGEN}" class="producto-img me-3">
                    <div class="flex-grow-1">
                        <h6 class="fw-bold mb-1">${prod.NOMBRE_PRODUCTO}</h6>
                        <span class="text-success fw-bold">$${parseFloat(prod.PRECIO_PRO).toLocaleString()}</span>
                    </div>
                    <i class="bi bi-plus-circle fs-4 text-warning"></i>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

function abrirDetalle(prod) {
    document.getElementById('modalDetalleContenido').innerHTML = `
        <div class="text-center">
            <img src="${prod.IMAGEN}" class="img-fluid rounded-3 mb-3" style="max-height: 200px;">
            <h4 class="fw-bold">${prod.NOMBRE_PRODUCTO}</h4>
            <input type="number" id="cantDet" class="form-control text-center mx-auto w-25" value="1" min="1">
            <textarea id="notasDet" class="form-control mt-2" placeholder="Ej: Sin cebolla..."></textarea>
        </div>`;

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