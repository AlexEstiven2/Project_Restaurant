import { Router } from 'express';
import * as prodCtrl from '../Controllers/ProductoController.js';
import { upload } from '../Middlewares/UploadMiddleware.js';

const router = Router();

// El path debe ser exacto al del fetch en el frontend
router.get('/api/productos', prodCtrl.obtenerProductos);
router.post('/api/productos', upload.single('platoFile'), prodCtrl.crearProducto);
router.put('/api/productos/:id', upload.single('platoFile'), prodCtrl.actualizarProducto);
router.delete('/api/productos/:id', prodCtrl.eliminarProducto);

export default router;