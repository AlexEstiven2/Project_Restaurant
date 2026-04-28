import { Router } from "express";
import { crearPreferencia, recibirWebhook } from "../Controllers/MercadoPagoController.js";

const router = Router();

router.post("/mercadopago/preferencia", crearPreferencia);
router.post("/webhook", recibirWebhook);

export default router;