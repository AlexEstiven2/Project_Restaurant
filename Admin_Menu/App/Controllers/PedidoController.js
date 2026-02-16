import Pedido from '../Models/Pedido.js';
import DetallePedido from '../Models/DetallePedido.js';
import Mesa from '../Models/Mesa.js';
import { sequelize } from '../config/Database.js';
import { QueryTypes } from 'sequelize';

/* ==========================================================================
   1. PROCESAR PEDIDO COMPLETO (CLIENTE)
   ========================================================================== */
export const procesarPedidoCompleto = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_mesa, productos } = req.body;

        const nuevoPedido = await Pedido.create({
            ID_MESA: id_mesa,
            ESTADO_PEDIDO: 'PENDIENTE',
            FECHA: sequelize.literal('CURRENT_TIMESTAMP')
        }, { transaction: t });

        const detalles = productos.map(prod => ({
            CANTIDAD: prod.cantidad,
            PRECIO_UNITARIO: prod.PRECIO_PRO,
            ID_PRODUCT: prod.ID_PRODUCTOS,
            ID_PEDID: nuevoPedido.ID_PEDIDOS,
            // AJUSTE: Mapeamos 'notas' del frontend a 'OBSERVACIONES' de la DB
            OBSERVACIONES: prod.notas || null 
        }));

        await DetallePedido.bulkCreate(detalles, { transaction: t });

        await Mesa.update(
            { ESTADO_MESA: 'OCUPADA' },
            { where: { ID_MESAS: id_mesa }, transaction: t }
        );

        await t.commit();
        res.status(201).json({ success: true, message: "¡Orden enviada a cocina!" });
    } catch (error) {
        await t.rollback();
        console.error("Error en pedido:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/* ==========================================================================
   2. OBTENER DETALLE POR MESA (DASHBOARD/ADMIN)
   ========================================================================== */
export const getDetallePorMesa = async (req, res) => {
    try {
        const { idMesa } = req.params;

        const query = `
            SELECT p.ID_PEDIDOS, 
                   p.FECHA as FECHA_PEDIDO, 
                   dp.CANTIDAD, dp.PRECIO_UNITARIO, prod.NOMBRE_PRODUCTO, p.ESTADO_PEDIDO
            FROM PEDIDOS p
            JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDOS = dp.ID_PEDID
            JOIN PRODUCTOS prod ON dp.ID_PRODUCT = prod.ID_PRODUCTOS
            JOIN MESAS m ON p.ID_MESA = m.ID_MESAS
            WHERE p.ID_MESA = :idMesa 
              AND p.ESTADO_PEDIDO IN ('PENDIENTE', 'EN_PREPARACION', 'ENTREGADO')
              -- Solo pedidos creados DESPUÉS del último reset de la mesa
              AND p.FECHA >= m.ULTIMA_SESION
            ORDER BY p.FECHA DESC;
        `;

        const detalles = await sequelize.query(query, {
            replacements: { idMesa },
            type: QueryTypes.SELECT
        });

        res.json(detalles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* ==========================================================================
   3. MONITOR DE COCINA
   ========================================================================== */
export const getPedidosCocina = async (req, res) => {
    try {
        const query = `
            SELECT p.ID_PEDIDOS, p.ID_MESA, p.FECHA, p.ESTADO_PEDIDO, m.NUMERO_MESA,
                   dp.CANTIDAD, prod.NOMBRE_PRODUCTO, dp.OBSERVACIONES
            FROM PEDIDOS p
            JOIN MESAS m ON p.ID_MESA = m.ID_MESAS
            JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDOS = dp.ID_PEDID
            JOIN PRODUCTOS prod ON dp.ID_PRODUCT = prod.ID_PRODUCTOS
            WHERE p.ESTADO_PEDIDO IN ('PENDIENTE', 'EN_PREPARACION')
            ORDER BY p.FECHA ASC;
        `;
        const pedidos = await sequelize.query(query, { type: QueryTypes.SELECT });

        const agrupados = pedidos.reduce((acc, item) => {
            if (!acc[item.ID_PEDIDOS]) {
                acc[item.ID_PEDIDOS] = {
                    id: item.ID_PEDIDOS,
                    mesa: item.NUMERO_MESA,
                    id_mesa_db: item.ID_MESA,
                    fecha: item.FECHA,
                    estado: item.ESTADO_PEDIDO,
                    items: []
                };
            }
            acc[item.ID_PEDIDOS].items.push({
                nombre: item.NOMBRE_PRODUCTO,
                cantidad: item.CANTIDAD,
                observaciones: item.OBSERVACIONES 
            });
            return acc;
        }, {});

        res.json(Object.values(agrupados));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/* ==========================================================================
   4. CAMBIAR ESTADO (COCINA A MESA)
   ========================================================================== */
export const cambiarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        await Pedido.update(
            { ESTADO_PEDIDO: estado },
            { where: { ID_PEDIDOS: id } }
        );

        if (estado === 'ENTREGADO') {
            const pedido = await Pedido.findByPk(id);

            if (pedido && pedido.ID_MESA) {
                const idMesa = pedido.ID_MESA;

                await Mesa.update(
                    { ESTADO_MESA: 'RECIBIDO' },
                    { where: { ID_MESAS: idMesa } }
                );

                setTimeout(async () => {
                    try {
                        const mesaActual = await Mesa.findByPk(idMesa);
                        if (mesaActual && mesaActual.ESTADO_MESA === 'RECIBIDO') {
                            await Mesa.update(
                                { ESTADO_MESA: 'OCUPADA' },
                                { where: { ID_MESAS: idMesa } }
                            );
                        }
                    } catch (err) {
                        console.error("Error en timer de mesa:", err);
                    }
                }, 30000);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        res.status(500).json({ error: error.message });
    }
};

/* ==========================================================================
   5. LIMPIAR CUENTA (MANUAL)
   ========================================================================== */
export const limpiarCuentaMesa = async (req, res) => {
    try {
        const { idMesa } = req.params;

        // Al actualizar ULTIMA_SESION, los pedidos anteriores "desaparecen" de la vista
        await Mesa.update({
            ESTADO_MESA: 'DISPONIBLE',
            ULTIMA_SESION: sequelize.literal('CURRENT_TIMESTAMP')
        }, {
            where: { ID_MESAS: idMesa }
        });

        res.json({ success: true, message: "Mesa liberada correctamente." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};