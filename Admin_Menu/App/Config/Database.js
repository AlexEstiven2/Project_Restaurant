import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 47223, // Puerto específico de tu Railway
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: 60000 // Para evitar errores de tiempo de espera en la nube
    }
  }
);

const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos en Railway exitosa");
  } catch (error) {
    console.error("❌ Error en la conexión:", error);
  }
};

export { sequelize, conectarDB };