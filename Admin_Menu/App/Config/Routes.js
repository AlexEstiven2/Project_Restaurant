// App/Config/Routes.js
import { Router } from "express";

import authRoutes from "../Src/Auth.Routes.js"; 
import viewRoutes from "../Src/View.Routes.js";
import userRoutes from "../Src/User.Routes.js";
import cateRoutes from '../Src/Categorias.Routes.js';
import platosRoutes from '../Src/Platos.Routes.js';
import mesaRoutes from '../Src/Mesa.Routes.js'; // Este es el que usaremos para la API
import pedidoRoutes from '../Src/Pedido.Routes.js';
import estadisticasRoutes from '../Src/Estadistica.Routes.js';
import feedbackRoutes from '../Src/Feedback.Routes.js';

const router = Router();

// 1. Rutas de Autenticación y Vistas (Raíz)
router.use(authRoutes);
router.use(viewRoutes);
router.use(userRoutes);

// 2. Rutas de la API con sus prefijos correspondientes
router.use("/api/mesas", mesaRoutes); 

// 3. Resto de rutas de la API
router.use(cateRoutes);
router.use(platosRoutes);
router.use(pedidoRoutes);
router.use(estadisticasRoutes);
router.use(feedbackRoutes);

export default router;