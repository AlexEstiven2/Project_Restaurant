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

// 1. CARGA DE ENTORNO (Protegida)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

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

/* --- ARCHIVOS ESTÁTICOS --- */
app.use(express.static(path.join(__dirname, "Assets"), { maxAge: '1h' })); 
app.use('/Image', express.static(path.join(__dirname, "Assets/Image")));

/* --- NAVEGACIÓN --- */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Pages", "Menu_D.html"));
});

/* --- API --- */
app.use("/api", routes);

/* --- INICIO DEL SERVIDOR (No bloqueante) --- */
const startServer = async () => {
    try {
        // En Vercel, el servidor DEBE responder inmediatamente
        app.listen(PORT, () => {
            console.log(`🚀 Onix Soft en línea en puerto ${PORT}`);
        });

        // Intentamos la conexión a la base de datos de fondo
        // Si Clever Cloud falla, el servidor no se apaga, solo verás el error en los logs
        sequelize.authenticate()
            .then(() => {
                console.log("✅ DB Conectada");
                return conectarDB();
            })
            .catch(err => console.error("❌ Error DB diferido:", err.message));

    } catch (err) {
        console.error("❌ Error crítico de arranque:", err);
    }
};

startServer();

export default app;