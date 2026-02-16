import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";

export const guardarPedido = async (req, res) => {
    const { mesa, items } = req.body;

    if (!mesa || !items || items.length === 0) {
        return res.status(400).json({ message: "Datos incompletos" });
    }

    const t = await sequelize.transaction();

    try {
        const mesaRow = await sequelize.query(
            "SELECT ID_MESAS FROM MESAS WHERE NUMERO_MESA = ? LIMIT 1",
            { replacements: [mesa], type: QueryTypes.SELECT, transaction: t }
        );

        if (mesaRow.length === 0) throw new Error("La mesa no existe.");
        const idMesaDB = mesaRow[0].ID_MESAS;

        // Insertar Pedido
        const [pedidoId] = await sequelize.query(
            "INSERT INTO PEDIDOS (FECHA, ESTADO_PEDIDO, ID_MESA) VALUES (NOW(), 'PENDIENTE', ?)",
            { replacements: [idMesaDB], type: QueryTypes.INSERT, transaction: t }
        );

        for (const item of items) {
            // USAMOS LOS NOMBRES QUE ENVÍA EL JS CORREGIDO
            await sequelize.query(
                `INSERT INTO DETALLE_PEDIDO (CANTIDAD, PRECIO_UNITARIO, ID_PRODUCT, ID_PEDID, OBSERVACIONES) 
                 VALUES (?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        item.CANTIDAD,      
                        item.PRECIO_UNITARIO,  
                        item.ID_PRODUCT,       
                        pedidoId, 
                        item.OBSERVACIONES || '' 
                    ],
                    type: QueryTypes.INSERT,
                    transaction: t
                }
            );
        }

        await t.commit();
        res.status(201).json({ message: "Pedido enviado", pedidoId });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Error en guardarPedido:", error.message);
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
             AND pe.ESTADO_PEDIDO != 'CANCELADO'
             -- CLAVE: El pedido debe ser posterior al inicio de la sesión actual
             AND pe.FECHA >= m.ULTIMA_SESION 
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