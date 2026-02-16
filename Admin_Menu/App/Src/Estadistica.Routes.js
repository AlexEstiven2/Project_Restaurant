import express from 'express';
const router = express.Router();
import { obtenerEstadisticas } from '../Controllers/EstadisticasController.js';

router.get('/api/estadisticas', obtenerEstadisticas);

export default router;