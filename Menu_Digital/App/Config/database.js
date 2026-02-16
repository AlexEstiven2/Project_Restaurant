import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Agregamos esta línea para leer el puerto 47223
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: 60000 // Útil para evitar desconexiones por latencia en la nube
    }
  }
);

const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a Railway establecida correctamente");
  } catch (error) {
    console.error("❌ Error en la conexión a la base de datos:", error);
  }
};

export { sequelize, conectarDB };