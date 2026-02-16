import { DataTypes } from 'sequelize';
import { sequelize } from '../Config/Database.js';
import Categoria from './Categoria.js';

const Subcategoria = sequelize.define('Subcategoria', {
    ID_SUBCATEGORIA: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, // <-- Asegúrate que sea primaryKey (K mayúscula)
        autoIncrement: true  
    },
    IMAGEN: { type: DataTypes.STRING(1000) },
    NOMBRE_SUBCATE: { type: DataTypes.STRING(300), allowNull: false },
    ESTADO_SUBCATE: { type: DataTypes.ENUM('DISPONIBLE', 'NO DISPONIBLE'), defaultValue: 'DISPONIBLE' },
    ID_CATEGO: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: Categoria, key: 'ID_CATEGORIA' }
    }
}, {
    tableName: 'SUBCATEGORIAS',
    timestamps: false
});

// Relaciones protegidas para evitar el error de alias duplicado
if (!Categoria.associations.subcategorias) {
    Categoria.hasMany(Subcategoria, { foreignKey: 'ID_CATEGO', as: 'subcategorias' });
    Subcategoria.belongsTo(Categoria, { foreignKey: 'ID_CATEGO' });
}

export default Subcategoria;