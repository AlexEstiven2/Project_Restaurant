//Importaciones/cerebro del sistema
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./Config/Routes.js";
import { sequelize, conectarDB } from "./Config/Database.js";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
conectarDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básicos
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Archivos estáticos
app.use(express.static(path.join(__dirname, "Assets")));
app.use('/Image', express.static(path.join(__dirname, 'Assets/Image')));

// LiveReload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "../App"));
app.use(connectLivereload());

// ÚNICO PUNTO DE ENTRADA PARA RUTAS
app.use("/", routes); 

app.listen(PORT, () => {
  console.log(`🚀 Servidor administrativo corriendo en http://localhost:${PORT}`);
});