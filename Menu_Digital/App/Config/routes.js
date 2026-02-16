import { Router } from "express";
import menuRoutes from "../Src/Menu.Routes.js";
import mesasRoutes from "../Src/Mesas.Routes.js";
import pedidoRoutes from "../Src/Pedido.Routes.js"
import feedbackRoutes from "../Src/Feedback.Routes.js";


const router = Router();

router.use("/menu", menuRoutes);
router.use("/mesas", mesasRoutes);
router.use("/pedidos", pedidoRoutes);
router.use("/feedback", feedbackRoutes);

router.get("/", (req, res) => {
    res.json({ message: "¡Bienvenido a la API del menú digital!" });
});

export default router;