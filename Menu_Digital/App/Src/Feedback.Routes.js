import { Router } from "express";
import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";

const router = Router();

router.post("/guardar", async (req, res) => {
    const { mesa, estrellas, comentario } = req.body;
    
    if (!mesa || !estrellas) {
        return res.status(400).json({ message: "Mesa y calificación son obligatorias" });
    }

    const t = await sequelize.transaction();

    try {
        // 1. Insertar en FEEDBACK (usando los nombres de tu SQL real)
        await sequelize.query(
            "INSERT INTO FEEDBACK (ID_MESA, ESTRELLAS, COMENTARIO, FECHA) VALUES (?, ?, ?, NOW())",
            {
                replacements: [mesa, estrellas, comentario || null],
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        // 2. Actualizar la mesa a 'PAGANDO' (usando el número de mesa)
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'PAGANDO' WHERE NUMERO_MESA = ?",
            { 
                replacements: [mesa],
                type: QueryTypes.UPDATE,
                transaction: t 
            }
        );

        await t.commit();
        res.status(201).json({ message: "Feedback guardado correctamente" });

    } catch (error) {
        if (t) await t.rollback();
        console.error("Error en feedback:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;