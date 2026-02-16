import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // Cargar variables de entorno

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  logging: false, // Desactiva logs en consola
});

// Función para probar la conexión
const conectarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida correctamente");
  } catch (error) {
    console.error("❌ Error en la conexión a la base de datos:", error);
  }
};

// Exportar la conexión y la función de conexión
export { sequelize, conectarDB };