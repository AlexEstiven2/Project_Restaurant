import { Router } from "express";
const router = Router();

import { ocuparMesa, solicitarCuenta, llamarMesero, setEsperandoPedido } from "../Controllers/MenuController.js";


router.post("/ocupar/:numeroMesa", ocuparMesa);
router.post("/solicitar-cuenta/:numeroMesa", solicitarCuenta);
router.post("/llamar-mesero/:numeroMesa", llamarMesero); // <-- Esta es la que arregla el 404
router.post("/estado/esperando/:numeroMesa", setEsperandoPedido);

export default router;