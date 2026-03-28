import { Router } from "express";
import * as pedidoController from "../Controllers/PedidoController.js";

const router = Router();

// Esta ya la tienes
router.post("/enviar", pedidoController.guardarPedido);
router.get("/mesa/:id", pedidoController.obtenerPedidosMesa);

// La nueva ruta para el rastreo del estado
router.get("/estado-ultimo/:numeroMesa", pedidoController.obtenerEstadoUltimoPedido);

export default router;