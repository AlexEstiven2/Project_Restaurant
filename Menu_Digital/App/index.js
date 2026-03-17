import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression"; // Nueva: Para comprimir respuestas
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
app.use(compression()); // Comprime los datos para que carguen más rápido en móviles
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/* --- CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS --- */

// Configuración de caché para imágenes (1 día)
const cacheOptions = {
    maxAge: '1d',
    etag: true
};

// 1. Assets locales (CSS, JS)
app.use("/Assets", express.static(path.join(__dirname, "Assets"), { maxAge: '1h' })); 

// 2. Imágenes compartidas desde el Administrador
const baseAdminPath = path.join(__dirname, "../../Admin_Menu/App/Assets/Image");

// Rutas estáticas con manejo de caché para mejorar velocidad
app.use('/Image/Categoria', express.static(path.join(baseAdminPath, 'Categoria'), cacheOptions));
app.use('/Image/Productos', express.static(path.join(baseAdminPath, 'Productos'), cacheOptions));
app.use('/Image/SubCategoria', express.static(path.join(baseAdminPath, 'SubCategoria'), cacheOptions));

// Carpeta de Logos propia (para el favicon y logo principal)
app.use('/Image/Logos', express.static(path.join(__dirname, "Assets/Image/Logos")));

/* --- NAVEGACIÓN --- */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Pages", "Menu_D.html"));
});

/* --- API --- */
app.use("/api", routes);

/* --- GESTIÓN DE ERRORES 404 --- */
app.use((req, res) => {
    res.status(404).send("Lo sentimos, esta página no existe.");
});

/* --- INICIO DEL SERVIDOR --- */
sequelize.authenticate()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => { // Escucha en toda la red local
            console.log(`🚀 Servidor listo en red local: http://192.168.1.21:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Error crítico en la conexión a la base de datos:", err);
        process.exit(1);
    });

export default app;