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
conectarDB();

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

// 1. Assets locales (CSS, JS)
app.use(express.static(path.join(__dirname, "Assets"), { maxAge: '1h' })); 

// ⚠️ NOTA: baseAdminPath fallará en Vercel si Admin_Menu no está dentro de Menu_Digital.
// Por ahora lo dejamos, pero si las imágenes no cargan, deberás moverlas a Menu_Digital.
app.use('/Image', express.static(path.join(__dirname, "Assets/Image"), cacheOptions));

app.use('/Image/Categoria', express.static(path.join(baseAdminPath, 'Categoria'), cacheOptions));
app.use('/Image/Productos', express.static(path.join(baseAdminPath, 'Productos'), cacheOptions));
app.use('/Image/SubCategoria', express.static(path.join(baseAdminPath, 'SubCategoria'), cacheOptions));
app.use('/Image/Logos', express.static(path.join(__dirname, "Assets/Image/Logos")));

/* --- NAVEGACIÓN --- */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Pages", "Menu_D.html"));
});

/* --- API --- */
app.use("/api", routes);

/* --- GESTIÓN DE ERRORES 404 --- */
// (Colocado al final para que no bloquee las rutas anteriores)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: "Ruta de API no encontrada" });
    } else {
        next();
    }
});

/* --- INICIO DEL SERVIDOR (Versión Indestructible) --- */
const startServer = async () => {
    try {
        await sequelize.authenticate();
        app.listen(PORT, () => {
            console.log(`🚀 Servidor Onix listo en el puerto: ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Error crítico en la conexión a la base de datos:", err);
    }
};

startServer();

export default app;