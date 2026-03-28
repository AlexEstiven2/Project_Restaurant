import { DataTypes } from 'sequelize';
import { sequelize } from '../Config/Database.js';

const Usuario = sequelize.define('Usuario', {
    ID_USUARIO: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, // <--- CORREGIDO: Debe ser primaryKey (todo junto)
        autoIncrement: true 
    },
    NOMBRE_USUARIO: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    CORREO: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    CONTRASENA: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ROL: { 
        type: DataTypes.ENUM('ADMIN', 'SUPERADMIN'), 
        defaultValue: 'ADMIN' 
    },
    ESTADO: { 
        type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), 
        defaultValue: 'ACTIVO' 
    }
}, {
    tableName: 'USUARIOS_ADMIN', // Asegura que use exactamente este nombre de tabla
    timestamps: false // Tu SQL no tiene columnas createdAt/updatedAt
});

export default Usuario;