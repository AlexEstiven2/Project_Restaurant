import { Router } from 'express';
import * as cateCtrl from '../Controllers/CategoriaController.js';
import { upload } from '../Middlewares/UploadMiddleware.js';

const router = Router();

// Rutas para Categorías
router.get('/api/categorias', cateCtrl.obtenerCategorias);
router.post('/api/categorias', upload.single('cateFile'), cateCtrl.crearCategoria);
router.put('/api/categorias/:id', upload.single('cateFile'), cateCtrl.actualizarCategoria);
router.delete('/api/categorias/:id', cateCtrl.eliminarCategoria);

// Rutas para Subcategorías
router.post('/api/subcategorias', upload.single('subFile'), cateCtrl.crearSubcategoria);
router.put('/api/subcategorias/:id', upload.single('subFile'), cateCtrl.actualizarSubcategoria);
router.delete('/api/subcategorias/:id', cateCtrl.eliminarSubcategoria);

export default router; 