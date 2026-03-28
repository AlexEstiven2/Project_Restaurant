import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";

export const guardarPedido = async (req, res) => {
    const { mesa, items } = req.body;

    if (!mesa || !items || items.length === 0) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    const t = await sequelize.transaction();

    try {
        // 1. Obtener ID de la mesa
        const mesaRow = await sequelize.query(
            "SELECT ID_MESAS FROM MESAS WHERE NUMERO_MESA = ? LIMIT 1",
            { replacements: [mesa], type: QueryTypes.SELECT, transaction: t }
        );
        if (mesaRow.length === 0) throw new Error("La mesa no existe.");
        const idMesaDB = mesaRow[0].ID_MESAS;

        // 2. BUSCAR SI YA TIENE UN PEDIDO ACTIVO (Clave de la persistencia)
        const pedidoActivo = await sequelize.query(
            `SELECT ID_PEDIDOS FROM PEDIDOS 
             WHERE ID_MESA = ? AND ESTADO_PEDIDO IN ('PENDIENTE', 'EN_PREPARACION') 
             LIMIT 1`,
            { replacements: [idMesaDB], type: QueryTypes.SELECT, transaction: t }
        );

        let pedidoId;
        if (pedidoActivo.length > 0) {
            // SI EXISTE, usamos ese ID
            pedidoId = pedidoActivo[0].ID_PEDIDOS;
        } else {
            // SI NO EXISTE, creamos uno nuevo
            const [newId] = await sequelize.query(
                "INSERT INTO PEDIDOS (FECHA, ESTADO_PEDIDO, ID_MESA) VALUES (NOW(), 'PENDIENTE', ?)",
                { replacements: [idMesaDB], type: QueryTypes.INSERT, transaction: t }
            );
            pedidoId = newId;
        }

        // 3. Insertar los nuevos items al pedido (ya sea el nuevo o el existente)
        for (const item of items) {
            await sequelize.query(
                `INSERT INTO DETALLE_PEDIDO (CANTIDAD, PRECIO_UNITARIO, ID_PRODUCT, ID_PEDID, OBSERVACIONES) 
                 VALUES (?, ?, ?, ?, ?)`,
                {
                    replacements: [item.CANTIDAD, item.PRECIO_UNITARIO, item.ID_PRODUCT, pedidoId, item.OBSERVACIONES || ''],
                    type: QueryTypes.INSERT,
                    transaction: t
                }
            );
        }

        await t.commit();
        res.status(201).json({ message: "Pedido actualizado", pedidoId });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

export const obtenerPedidosMesa = async (req, res) => {
    try {
        const { id } = req.params; 

        const consumos = await sequelize.query(
            `SELECT 
                dp.CANTIDAD, 
                dp.PRECIO_UNITARIO, 
                p.NOMBRE_PRODUCTO,
                pe.FECHA,
                (dp.CANTIDAD * dp.PRECIO_UNITARIO) AS SUBTOTAL
             FROM PEDIDOS pe
             INNER JOIN DETALLE_PEDIDO dp ON pe.ID_PEDIDOS = dp.ID_PEDID
             INNER JOIN PRODUCTOS p ON dp.ID_PRODUCT = p.ID_PRODUCTOS
             INNER JOIN MESAS m ON pe.ID_MESA = m.ID_MESAS
             WHERE m.NUMERO_MESA = ? 
             -- Solo mostrar pedidos que NO estén finalizados ni cancelados
             AND pe.ESTADO_PEDIDO NOT IN ('FINALIZADO', 'CANCELADO')
             -- Y solo si la mesa no está LIBRE
             AND m.ESTADO_MESA != 'LIBRE'
             ORDER BY pe.FECHA DESC`,
            {
                replacements: [id],
                type: QueryTypes.SELECT
            }
        );

        res.json(consumos || []);
    } catch (error) {
        console.error("Error al obtener historial:", error.message);
        res.status(500).json({ error: "Error al cargar historial" });
    }
};


export const obtenerEstadoUltimoPedido = async (req, res) => {
    try {
        const { numeroMesa } = req.params;
        const [ultimoPedido] = await sequelize.query(
            `SELECT pe.ESTADO_PEDIDO 
             FROM PEDIDOS pe
             INNER JOIN MESAS m ON pe.ID_MESA = m.ID_MESAS
             WHERE m.NUMERO_MESA = ? 
             ORDER BY pe.ID_PEDIDOS DESC LIMIT 1`,
            { replacements: [numeroMesa], type: QueryTypes.SELECT }
        );

        res.json(ultimoPedido || { ESTADO_PEDIDO: 'NINGUNO' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};