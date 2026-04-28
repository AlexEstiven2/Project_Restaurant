import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression"; 
import routes from "./Config/routes.js";
import { sequelize, conectarDB } from "./Config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Solo carga dotenv si NO estás en Vercel (Producción)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const app = express();
// Vercel asigna el puerto automáticamente, pero mantenemos el 9090 para local
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

// Assets locales
app.use(express.static(path.join(__dirname, "Assets"), { maxAge: '1h' })); 

// Rutas de imágenes
app.use('/Image', express.static(path.join(__dirname, "Assets/Image"), cacheOptions));
app.use('/Image/Logos', express.static(path.join(__dirname, "Assets/Image/Logos")));

/* --- NAVEGACIÓN --- */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Pages", "Menu_D.html"));
});

/* --- API --- */
app.use("/api", routes);

/* --- GESTIÓN DE ERRORES 404 --- */
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: "Ruta de API no encontrada" });
    } else {
        next();
    }
});

/* --- INICIO DEL SERVIDOR --- */
const startServer = async () => {
    try {
        // En Vercel (Serverless), no bloqueamos el arranque por la DB
        // Solo intentamos conectar. Si falla, el servidor seguirá vivo para dar errores claros.
        app.listen(PORT, () => {
            console.log(`🚀 Onix Soft desplegado con éxito`);
        });

        // Conexión asíncrona a Clever Cloud
        conectarDB().then(() => {
            console.log("✅ Conexión a DB Onix establecida");
        }).catch(err => {
            console.error("❌ Error de conexión DB en Onix:", err.message);
        });

    } catch (err) {
        console.error("❌ Error crítico en el arranque de Onix:", err);
    }
};

startServer();

export default app;