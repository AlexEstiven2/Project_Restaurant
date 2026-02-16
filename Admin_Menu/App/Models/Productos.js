import { DataTypes } from 'sequelize';
import { sequelize } from '../Config/Database.js';
// Fíjate bien en la C mayúscula de SubCategoria.js
import Subcategoria from './SubCategoria.js'; 

const Producto = sequelize.define('Producto', {
    ID_PRODUCTOS: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: true 
    },
    IMAGEN: { type: DataTypes.STRING(1000) },
    NOMBRE_PRODUCTO: { type: DataTypes.STRING(300), allowNull: false },
    DESCRIPCION_PRO: { type: DataTypes.STRING(2000) },
    ESDADO_PRO: { type: DataTypes.ENUM('DISPONIBLE', 'NO DISPONIBLE'), defaultValue: 'DISPONIBLE' },
    PRECIO_PRO: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    ID_SUBCATE: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'PRODUCTOS',
    timestamps: false
});

// Definir la relación
Producto.belongsTo(Subcategoria, { foreignKey: 'ID_SUBCATE', as: 'detalles_sub' });

export default Producto;