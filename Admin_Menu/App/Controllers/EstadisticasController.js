import { sequelize } from "../Config/Database.js";
import { QueryTypes } from "sequelize";

export const obtenerEstadisticas = async (req, res) => {
  try {
    const { inicio, fin } = req.query;

    // 1. Localización a Español para los nombres de los días
    await sequelize.query("SET lc_time_names = 'es_ES'");

    const filtroFecha = (inicio && fin) 
      ? `p.FECHA BETWEEN :inicio AND :fin` 
      : `DATE(p.FECHA) = CURDATE()`;

    const replacements = { inicio: `${inicio} 00:00:00`, fin: `${fin} 23:59:59` };

    // 2. Resumen (Corregido para evitar duplicados en el COUNT DISTINCT)
    const resumen = await sequelize.query(`
      SELECT 
        IFNULL(SUM(dp.CANTIDAD * dp.PRECIO_UNITARIO), 0) AS ventas_totales,
        COUNT(DISTINCT p.ID_PEDIDOS) AS total_pedidos,
        IFNULL(SUM(dp.CANTIDAD * dp.PRECIO_UNITARIO) / NULLIF(COUNT(DISTINCT p.ID_PEDIDOS), 0), 0) AS ticket_promedio
      FROM PEDIDOS p
      LEFT JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDOS = dp.ID_PEDID
      WHERE ${filtroFecha} AND p.ESTADO_PEDIDO = 'ENTREGADO' 
    `, { replacements, type: QueryTypes.SELECT });

    // 3. Ventas de la última semana (Garantiza orden cronológico)
    const semanal = await sequelize.query(`
      SELECT 
        DAYNAME(p.FECHA) as dia, 
        SUM(dp.CANTIDAD * dp.PRECIO_UNITARIO) as total
      FROM PEDIDOS p
      JOIN DETALLE_PEDIDO dp ON p.ID_PEDIDOS = dp.ID_PEDID
      WHERE p.FECHA >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND p.ESTADO_PEDIDO = 'ENTREGADO'
      GROUP BY DATE(p.FECHA), dia
      ORDER BY DATE(p.FECHA) ASC
    `, { type: QueryTypes.SELECT });

    // 4. Top 5 Platos (Veracidad: Solo platos entregados y cobrados)
    const topPlatos = await sequelize.query(`
      SELECT 
        pr.NOMBRE_PRODUCTO as label, 
        SUM(dp.CANTIDAD) as valor
      FROM DETALLE_PEDIDO dp
      JOIN PRODUCTOS pr ON dp.ID_PRODUCT = pr.ID_PRODUCTOS
      JOIN PEDIDOS p ON dp.ID_PEDID = p.ID_PEDIDOS
      WHERE ${filtroFecha} AND p.ESTADO_PEDIDO = 'ENTREGADO'
      GROUP BY pr.ID_PRODUCTOS, pr.NOMBRE_PRODUCTO
      ORDER BY valor DESC
      LIMIT 5
    `, { replacements, type: QueryTypes.SELECT });

    res.json({
      resumen: resumen[0],
      semana: {
        labels: semanal.map(s => s.dia.toUpperCase()),
        valores: semanal.map(s => s.total)
      },
      top: {
        labels: topPlatos.map(t => t.label),
        valores: topPlatos.map(t => t.valor)
      }
    });

  } catch (error) {
    console.error("Error en estadísticas:", error);
    res.status(500).json({ message: "Error interno" });
  }
};