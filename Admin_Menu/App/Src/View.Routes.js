// App/Src/Routes/View.Routes.js
import { Router } from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { verificarAcceso } from "../Middlewares/AuthMiddleware.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función auxiliar para no repetir path.join
const Pagina = (nombre) => path.join(__dirname, "../Pages", nombre);

// --- RUTAS PÚBLICAS ---
router.get("/Webcony/login", (req, res) => res.sendFile(Pagina("Login.html")));

// --- RUTAS PROTEGIDAS (Requieren Login) ---
// Dashboard: Acceso para cualquier empleado logueado
router.get("/Webcony/dashboard", verificarAcceso(['ADMIN', 'SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("HomeAdmin.html"));
});

router.get("/WebCony/Mesas", verificarAcceso(['ADMIN', 'SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Mesas.html"));
});

router.get("/WebCony/Carrito", verificarAcceso(['ADMIN', 'SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Carrito.html"));
});

router.get("/WebCony/Cocina", verificarAcceso(['ADMIN', 'SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Cocina.html"));
});



// Usuarios: Solo para el Gerente
router.get("/WebCony/Estadisticas", verificarAcceso(['SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Estadisticas.html"))
});

router.get("/WebCony/Categorias", verificarAcceso(['SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Categorias.html"));
});

router.get("/WebCony/Platos", verificarAcceso(['SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Platos.html"));
});

router.get("/WebCony/Usuarios", verificarAcceso(['SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Usuarios.html"));
});

router.get("/WebCony/Qr", verificarAcceso(['SUPERADMIN']), (req, res) => {
    res.sendFile(Pagina("Qr.html"));
});



export default router; 