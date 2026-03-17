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
app.use("/Assets", express.static(path.join(__dirname, "App", "Assets")));
app.use('/Image/Logos', express.static(path.join(__dirname, "App", "Assets", "Image", "Logos")));


/* --- NAVEGACIÓN --- */

app.get("/", (req, res) => {
    // Agregamos "App" para encontrar la carpeta Pages
    res.sendFile(path.join(__dirname, "App", "Pages", "Menu_D.html"));
});

/* --- API --- */
app.use("/api", routes);

/* --- GESTIÓN DE ERRORES 404 --- */
app.use((req, res) => {
    res.status(404).send("Lo sentimos, esta página no existe.");
});

/* --- INICIO DEL SERVIDOR --- */
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conexión a Railway establecida");
        
        // IMPORTANTE: En Vercel no es necesario app.listen, 
        // pero para que funcione en ambos lados:
        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`🚀 Servidor en http://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error("❌ Error crítico:", error);
    }
};

startServer();

export default app;