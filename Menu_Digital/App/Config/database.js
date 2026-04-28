import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql', // Asegúrate de que sea 'mysql' en minúsculas
  // ... resto de tu config
});

const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida correctamente");
  } catch (error) {
    console.error("❌ Error en la conexión a la base de datos:", error);
  }
};

export { sequelize, conectarDB };