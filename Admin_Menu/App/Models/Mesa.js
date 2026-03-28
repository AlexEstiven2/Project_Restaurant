import { DataTypes } from 'sequelize';
import { sequelize } from '../Config/Database.js';

const Mesa = sequelize.define('Mesa', {
    ID_MESAS: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    NUMERO_MESA: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    ESTADO_MESA: {
        // Expandimos el ENUM para que acepte todos los estados que usas en tu lógica
        type: DataTypes.ENUM(
            'DISPONIBLE', 
            'OCUPADA', 
            'ESPERANDO PEDIDO', 
            'RECIBIDO', 
            'SOLICITO CUENTA', 
            'PAGANDO', 
            'PAGADO', 
            'LLAMANDO MESERO'
        ),
        defaultValue: 'DISPONIBLE'
    },
    // AGREGAMOS ESTA COLUMNA:
    ULTIMA_SESION: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Esto equivale a CURRENT_TIMESTAMP
        field: 'ULTIMA_SESION' // Asegura el nombre exacto de la DB
    }
}, {
    tableName: 'MESAS',
    timestamps: false 
});

export default Mesa;