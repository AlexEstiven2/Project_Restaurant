import express from 'express';
import { procesarPedidoCompleto, getDetallePorMesa, getPedidosCocina, cambiarEstadoPedido } from '../Controllers/PedidoController.js';

const router = express.Router();

router.post('/api/pedidos', procesarPedidoCompleto);
router.get('/api/pedidos/mesa/:idMesa', getDetallePorMesa);
router.get('/api/cocina', getPedidosCocina);
router.put('/api/pedidos/estado/:id', cambiarEstadoPedido);
 
export default router;