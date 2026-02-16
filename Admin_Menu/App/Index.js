import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./Config/Routes.js";
import { sequelize, conectarDB } from "./Config/Database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
conectarDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Servir archivos estáticos (Assets e Imágenes)
app.use(express.static(path.join(__dirname, "Assets")));
app.use('/Image', express.static(path.join(__dirname, 'Assets/Image')));

// Rutas de la API y Vistas
app.use("/", routes); 

app.listen(PORT, () => {
  console.log(`🚀 Servidor administrativo corriendo en el puerto ${PORT}`);
});

export default app; // Importante para Vercel