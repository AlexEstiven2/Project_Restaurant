import express from 'express';
import * as mesaController from '../Controllers/MesaController.js';

const router = express.Router();

/* ==========================================================================
   1. RUTAS POR ID (Para el Panel Administrativo / Mesas.js)
   ========================================================================== */
router.get('/', mesaController.getMesas);
router.post('/', mesaController.createMesa);
router.put('/:id', mesaController.updateMesa);
router.delete('/:id', mesaController.deleteMesa);
router.put('/estado/:id', mesaController.updateEstado);

/* ==========================================================================
   2. RUTAS POR NÚMERO DE MESA (Para el Cliente y Cocina)
   ========================================================================== */
router.post("/ocupar/:numeroMesa", mesaController.ocuparMesa);
router.post("/estado/esperando/:numeroMesa", mesaController.setEsperandoPedido);
router.post("/solicitar-cuenta/:numeroMesa", mesaController.solicitarCuenta);
router.post("/llamar-mesero/:numeroMesa", mesaController.llamarMesero);

export default router;