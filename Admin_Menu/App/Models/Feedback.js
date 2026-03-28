import { DataTypes } from "sequelize";
import { sequelize } from "../Config/Database.js";

const Feedback = sequelize.define("Feedback", {
  ID_FEEDBACK: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ID_MESA_REF: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }, 
  ESTRELLAS: {
    type: DataTypes.INTEGER, 
    allowNull: false,
  },
  COMENTARIO: {
    type: DataTypes.TEXT,
  },
  FECHA: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "FEEDBACK",
  timestamps: false,
});

export default Feedback;