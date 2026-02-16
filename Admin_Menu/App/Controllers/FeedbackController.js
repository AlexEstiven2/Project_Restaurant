import Feedback from "../Models/Feedback.js";

export const guardarFeedback = async (req, res) => {
  try {
    const { mesa, estrellas, comentario } = req.body;
    
    const nuevoFeedback = await Feedback.create({
      ID_MESA: mesa,
      ESTRELLAS: estrellas,
      COMENTARIO: comentario
    });

    res.status(200).json({  
        message: "✅ Feedback guardado con éxito", 
        id: nuevoFeedback.ID_FEEDBACK 
    });
  } catch (error) {
    console.error("❌ Error en FeedbackController:", error);
    res.status(500).json({ error: "Error interno al guardar la calificación" });
  }
};

export const obtenerFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [['FECHA', 'DESC']]
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener feedbacks" });
  }
};