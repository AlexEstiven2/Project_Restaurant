import { Router } from "express";
import { 
    obtenerUsuarios, 
    crearUsuario, 
    actualizarUsuario, 
    eliminarUsuario 
} from "../Controllers/UserController.js";
import { verificarAcceso } from "../Middlewares/AuthMiddleware.js";

const router = Router();

router.get("/api/usuarios", verificarAcceso(['SUPERADMIN']), obtenerUsuarios);
router.post("/api/usuarios", verificarAcceso(['SUPERADMIN']), crearUsuario);
router.put("/api/usuarios/:id", verificarAcceso(['SUPERADMIN']), actualizarUsuario);
router.delete("/api/usuarios/:id", verificarAcceso(['SUPERADMIN']), eliminarUsuario); 

export default router; 