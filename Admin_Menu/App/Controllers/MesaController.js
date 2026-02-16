import Mesa from '../Models/Mesa.js';
import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";

/* ==========================================================================
   1. GESTIÓN ADMINISTRATIVA (CRUD)
   ========================================================================== */

// Obtener todas las mesas ordenadas
export const getMesas = async (req, res) => {
    try {
        const mesas = await Mesa.findAll({
            order: [['NUMERO_MESA', 'ASC']]
        });
        res.json(mesas);
    } catch (error) {
        console.error("Error al obtener mesas:", error);
        res.status(500).json({ error: error.message });
    }
};

// Crear una nueva mesa
export const createMesa = async (req, res) => {
    try {
        const { numero_mesa } = req.body;
        const nuevaMesa = await Mesa.create({
            NUMERO_MESA: numero_mesa,
            ESTADO_MESA: 'DISPONIBLE'
        });
        res.status(201).json(nuevaMesa);
    } catch (error) {
        console.error("Error al crear mesa:", error);
        res.status(500).json({ error: error.message });
    }
};

// Actualizar el número de una mesa (desde edición admin)
export const updateMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero_mesa } = req.body;
        await Mesa.update(
            { NUMERO_MESA: numero_mesa },
            { where: { ID_MESAS: id } }
        );
        res.json({ message: "Mesa actualizada con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar una mesa
export const deleteMesa = async (req, res) => {
    try {
        const { id } = req.params;
        
        await Mesa.destroy({
            where: { ID_MESAS: id }
        });

        res.json({ message: "Mesa eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar mesa:", error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ 
                error: "No se puede eliminar la mesa porque tiene pedidos vinculados. Configura ON DELETE CASCADE en la DB." 
            });
        }
        
        res.status(500).json({ error: error.message }); 
    }
};

/* ==========================================================================
   2. CAMBIOS DE ESTADO (FLUJO OPERATIVO)
   ========================================================================== */

// Actualizar estado por ID (Generalmente usado por el Admin)
export const updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // CASO ESPECIAL: SI SE LIBERA LA MESA
        if (estado === 'DISPONIBLE') {
            await sequelize.query(
                `UPDATE MESAS 
         SET ESTADO_MESA = 'DISPONIBLE', 
             ULTIMA_SESION = CURRENT_TIMESTAMP -- Usa CURRENT_TIMESTAMP de SQL
         WHERE ID_MESAS = :id`,
                {
                    replacements: { id },
                    type: QueryTypes.UPDATE
                }
            );
            return res.json({ message: "Mesa liberada" });
        }

        // CASO NORMAL (Cualquier otro estado)
        await Mesa.update(
            { ESTADO_MESA: estado },
            { where: { ID_MESAS: id } }
        );

        res.json({ message: "Estado actualizado" });
    } catch (error) {
        console.error("Error en updateEstado:", error);
        res.status(500).json({ error: error.message });
    }
};

// Marcar como OCUPADA (Usado por cliente al entrar o cocina al entregar)
export const ocuparMesa = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'OCUPADA' WHERE NUMERO_MESA = ?",
            {
                replacements: [numeroMesa],
                type: QueryTypes.UPDATE
            }
        );
        console.log(`✅ Mesa ${numeroMesa} marcada como OCUPADA`);
        res.json({ message: "Estado de mesa actualizado correctamente" });
    } catch (error) {
        console.error("❌ Error en ocuparMesa:", error.message);
        res.status(500).json({ message: "Error al actualizar estado de la mesa" });
    }
};

// Marcar como ESPERANDO PEDIDO (Usado cuando el cliente confirma el carrito)
export const setEsperandoPedido = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'ESPERANDO PEDIDO' WHERE NUMERO_MESA = ?",
            {
                replacements: [numeroMesa],
                type: QueryTypes.UPDATE
            }
        );
        console.log(`🟣 Mesa ${numeroMesa} en estado ESPERANDO PEDIDO`);
        res.json({ message: "Cocinando pedido..." });
    } catch (error) {
        console.error("❌ Error en setEsperandoPedido:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Marcar como SOLICITO CUENTA (Usado por cliente al finalizar visita)
export const solicitarCuenta = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'SOLICITO CUENTA' WHERE NUMERO_MESA = ?",
            {
                replacements: [numeroMesa],
                type: QueryTypes.UPDATE
            }
        );
        console.log(`🔔 Mesa ${numeroMesa} solicitó la cuenta.`);
        res.json({ message: "Solicitud de cuenta enviada" });
    } catch (error) {
        console.error("❌ Error en solicitarCuenta:", error);
        res.status(500).json({ error: error.message });
    }
};

// Marcar como LLAMANDO MESERO
export const llamarMesero = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'LLAMANDO MESERO' WHERE NUMERO_MESA = ?",
            {
                replacements: [numeroMesa],
                type: QueryTypes.UPDATE
            }
        );

        // Auto-revertir a OCUPADA después de 2 minutos
        setTimeout(async () => {
            await sequelize.query(
                "UPDATE MESAS SET ESTADO_MESA = 'OCUPADA' WHERE NUMERO_MESA = ? AND ESTADO_MESA = 'LLAMANDO MESERO'",
                {
                    replacements: [numeroMesa],
                    type: QueryTypes.UPDATE
                }
            );
        }, 120000);

        res.json({ message: "Notificación de mesero enviada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};