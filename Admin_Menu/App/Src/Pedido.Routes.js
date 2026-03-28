import express from 'express';
import { procesarPedidoCompleto, getDetallePorMesa, getPedidosCocina, cambiarEstadoPedido, finalizarPedidosMesa } from '../Controllers/PedidoController.js';

const router = express.Router();

router.post('/enviar', procesarPedidoCompleto);
router.get('/mesa/:idMesa', getDetallePorMesa);
router.get('/cocina', getPedidosCocina);
router.put('/estado/:id', cambiarEstadoPedido);
router.put('/finalizar-mesa/:idMesa', finalizarPedidosMesa);
 
export default router;