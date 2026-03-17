import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression"; 
import routes from "./Config/routes.js";
import { sequelize, conectarDB } from "./Config/database.js";

// Inicializar entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9090;

/* --- MIDDLEWARES --- */
app.use(compression()); 
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/* --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS --- */

const cacheOptions = {
    maxAge: '1d',
    etag: true
};

// 1. Assets locales (Ruta crucial para Vercel)
// Usamos path.resolve para garantizar la ruta absoluta correcta
app.use("/Assets", express.static(path.join(__dirname, "Assets")));

// 2. Imágenes (Si las tienes dentro de Assets/Image en este mismo proyecto)
app.use('/Image/Logos', express.static(path.resolve(__dirname, "Assets/Image/Logos")));

// Nota: Las rutas hacia "../../Admin_Menu" no funcionarán en Vercel 
// a menos que ese proyecto también esté en el mismo repositorio subido.

/* --- NAVEGACIÓN --- */

app.get("/", (req, res) => {
    res.send("<h1>El servidor está vivo</h1>");
});

/* --- API --- */
app.use("/api", routes);

/* --- GESTIÓN DE ERRORES 404 --- */
app.use((req, res) => {
    res.status(404).send("Lo sentimos, esta página no existe.");
});

/* --- INICIO DEL SERVIDOR --- */
// En Vercel, no llamamos a app.listen() de la misma forma que local, 
// pero dejamos esta estructura para que funcione en ambos entornos.
conectarDB().then(() => {
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
        });
    }
}).catch(err => {
    console.error("❌ Error al iniciar:", err);
});

export default app;