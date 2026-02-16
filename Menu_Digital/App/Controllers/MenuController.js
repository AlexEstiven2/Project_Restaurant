import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";

/* --- HELPER PARA LOGS --- */
const logError = (metodo, error) => console.error(`Error en ${metodo}:`, error.message);

/* --- CATEGORÍAS --- */
export const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await sequelize.query(
            "SELECT ID_CATEGORIA, IMAGEN, NOMBRE_CATE FROM CATEGORIAS WHERE ESTADO_CATE = 'DISPONIBLE' ORDER BY NOMBRE_CATE ASC",
            { type: QueryTypes.SELECT }
        );
        res.json(categorias);
    } catch (error) {
        logError("obtenerCategorias", error);
        res.status(500).json({ message: "Error al obtener categorías" });
    }
};

/* --- SUBCATEGORÍAS --- */
export const obtenerSubcategorias = async (req, res) => {
    const { idCategoria } = req.params;
    try {
        const subs = await sequelize.query(
            "SELECT ID_SUBCATEGORIA, IMAGEN, NOMBRE_SUBCATE FROM SUBCATEGORIAS WHERE ID_CATEGO = ? AND ESTADO_SUBCATE = 'DISPONIBLE' ORDER BY NOMBRE_SUBCATE ASC",
            { replacements: [idCategoria], type: QueryTypes.SELECT }
        );
        res.json(subs);
    } catch (error) {
        logError("obtenerSubcategorias", error);
        res.status(500).json({ message: "Error al obtener subcategorías" });
    }
};

/* --- PRODUCTOS (Optimizado) --- */
export const obtenerProductosPorSub = async (req, res) => {
    const { idSub } = req.params;
    try {
        // Seleccionamos solo lo que la App necesita para mostrar en la Card
        const productos = await sequelize.query(
            `SELECT ID_PRODUCTOS, NOMBRE_PRODUCTO, PRECIO_PRO, IMAGEN, DESCRIPCION_PRO, ESDADO_PRO 
             FROM PRODUCTOS 
             WHERE ID_SUBCATE = ? AND ESDADO_PRO = 'DISPONIBLE' 
             ORDER BY NOMBRE_PRODUCTO ASC`, 
            { replacements: [idSub], type: QueryTypes.SELECT }
        );

        // Ya no formateamos aquí la ruta de la imagen, el Frontend ya se encarga de eso.
        // Esto hace la respuesta del servidor mucho más ligera.
        res.json(productos || []);
    } catch (error) {
        logError("obtenerProductosPorSub", error);
        res.status(500).json({ message: "Error al cargar productos" });
    }
};

/* --- ESTADOS DE MESA --- */

export const ocuparMesa = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'OCUPADA', ULTIMA_SESION = NOW() WHERE NUMERO_MESA = ?",
            { replacements: [numeroMesa] }
        );
        res.json({ message: "Mesa ocupada y sesión iniciada" });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión de mesa" });
    }
};

export const solicitarCuenta = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'SOLICITO CUENTA' WHERE NUMERO_MESA = ?",
            { replacements: [numeroMesa] }
        );
        res.json({ message: "Solicitud de cuenta enviada" });
    } catch (error) {
        logError("solicitarCuenta", error);
        res.status(500).json({ error: "Error al procesar solicitud" });
    }
};

export const llamarMesero = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'LLAMANDO MESERO' WHERE NUMERO_MESA = ?",
            { replacements: [numeroMesa] }
        );
        res.json({ message: "Mesero notificado" });
    } catch (error) {
        logError("llamarMesero", error);
        res.status(500).json({ error: "Error al llamar al mesero" });
    }
};

export const setEsperandoPedido = async (req, res) => {
    const { numeroMesa } = req.params;
    try {
        await sequelize.query(
            "UPDATE MESAS SET ESTADO_MESA = 'ESPERANDO PEDIDO' WHERE NUMERO_MESA = ?",
            { replacements: [numeroMesa], type: QueryTypes.UPDATE }
        );
        console.log(`🟣 Mesa ${numeroMesa} en estado ESPERANDO PEDIDO`);
        res.json({ message: "Cocinando pedido..." });
    } catch (error) {
        logError("setEsperandoPedido", error);
        res.status(500).json({ error: "Error al actualizar estado a esperando" });
    }
};