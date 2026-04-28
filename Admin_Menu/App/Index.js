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

// Solo cargar .env en desarrollo
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use(express.static(path.join(__dirname, "Assets")));
app.use('/Image', express.static(path.join(__dirname, 'Assets/Image')));

app.use("/", routes);

/* --- INICIO DEL SERVIDOR --- */
app.listen(PORT, () => {
  console.log(`🚀 Servidor administrativo en puerto ${PORT}`);
});

/* --- CONEXIÓN DB --- */
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ DB Conectada");
    return conectarDB();
  })
  .catch((err) => console.error("❌ Error DB:", err.message));

export default app;