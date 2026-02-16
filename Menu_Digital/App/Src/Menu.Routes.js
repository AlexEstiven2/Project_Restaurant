import { Router } from "express";
import { 
    obtenerCategorias, 
    obtenerSubcategorias, 
    obtenerProductosPorSub 
} from "../Controllers/MenuController.js";

const router = Router();

// Endpoints específicos del Menú Digital
router.get("/categorias", obtenerCategorias);
router.get("/subcategorias/:idCategoria", obtenerSubcategorias);
router.get("/productos/:idSub", obtenerProductosPorSub);

export default router;