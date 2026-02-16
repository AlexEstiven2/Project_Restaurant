import { DataTypes } from "sequelize";
import { sequelize } from "../config/Database.js"; // Ajusta la ruta según tu carpeta

const Pedido = sequelize.define('Pedido', {
    ID_PEDIDOS: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    FECHA: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ESTADO_PEDIDO: {
        type: DataTypes.ENUM('PENDIENTE', 'EN_PREPARACION', 'CANCELADO', 'ENTREGADO'),
        defaultValue: 'PENDIENTE'
    },
    ID_MESA: {
        type: DataTypes.INTEGER,
        references: {
            model: 'MESAS', // Nombre de la tabla en SQL
            key: 'ID_MESAS'
        }
    }
}, {
    tableName: 'PEDIDOS',
    timestamps: false
});

export default Pedido;