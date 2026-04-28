import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql', // <--- Revisa que diga esto exactamente
    port: process.env.DB_PORT || 3306,
    // ...
  }
);

const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida correctamente");
  } catch (error) {
    console.error("❌ Error en la conexión a la base de datos:", error);
  }
};

export { sequelize, conectarDB };