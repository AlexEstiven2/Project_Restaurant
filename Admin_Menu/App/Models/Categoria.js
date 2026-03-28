import { DataTypes } from 'sequelize';
import { sequelize } from '../Config/Database.js';

const Categoria = sequelize.define('Categoria', {
    ID_CATEGORIA: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    IMAGEN: { type: DataTypes.STRING(1000) },
    NOMBRE_CATE: { type: DataTypes.STRING(300), allowNull: false },
    ESTADO_CATE: { type: DataTypes.ENUM('DISPONIBLE', 'NO DISPONIBLE'), defaultValue: 'DISPONIBLE' }
}, {
    tableName: 'CATEGORIAS',
    timestamps: false
});

export default Categoria; 