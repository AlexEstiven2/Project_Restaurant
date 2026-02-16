import { DataTypes } from "sequelize";
import { sequelize } from "../config/Database.js"; 

const DetallePedido = sequelize.define('DetallePedido', {
    ID_DETALLE_PEDIDO: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,           
        autoIncrement: true        
    },
    CANTIDAD: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        defaultValue: 1 
    },
    PRECIO_UNITARIO: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    ID_PRODUCT: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    ID_PEDID: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    // NUEVO: Campo para capturar las sugerencias del cliente
    OBSERVACIONES: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'DETALLE_PEDIDO',
    timestamps: false
});

export default DetallePedido;