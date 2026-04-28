import { sequelize } from "../Config/database.js";
import { QueryTypes } from "sequelize";
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: 'APP_USR-3995604907423819-042518-26c7287da15a949b705b35f7078c91f1-3360257618'
});

// URL de tu túnel activo en ngrok
const NGROK_URL = "https://eastcoast-unseated-brink.ngrok-free.dev";

export const crearPreferencia = async (req, res) => {
    try {
        const { mesa, total } = req.body;

        if (!total || isNaN(total)) {
            return res.status(400).json({ error: 'El precio total es inválido.' });
        }

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [{
                    title: `Pedido Mesa ${mesa} - Balcony`,
                    quantity: 1,
                    unit_price: Number(total),
                    currency_id: 'COP'
                }],
                back_urls: {
                    // Usamos la URL de ngrok para que el retorno automático sea aceptado
                    success: `${NGROK_URL}/?pago=exitoso&mesa=${mesa}`,
                    failure: `${NGROK_URL}/?pago=error`,
                    pending: `${NGROK_URL}/?pago=pendiente`
                },
                auto_return: "approved", 
                external_reference: mesa.toString(),
                notification_url: `${NGROK_URL}/api/pagos/webhook`
            }
        });

        res.json({ init_point: result.init_point });

    } catch (error) {
        console.error("Error Mercado Pago (Detallado):", JSON.stringify(error, null, 2));
        res.status(500).json({ error: 'No se pudo crear la preferencia' });
    }
};

export const recibirWebhook = async (req, res) => {
    const { type, data } = req.body;

    // Solo procesamos si la notificación es de un pago
    if (type === "payment") {
        try {
            const paymentId = data.id;
            
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${client.accessToken}` }
            });
            const paymentData = await response.json();

            if (paymentData.status === "approved") {
                const numeroMesa = paymentData.external_reference;

                // 1. Actualizamos el estado de la mesa a RECIBIDO (Azul en tu panel)
                await sequelize.query(
                    "UPDATE MESAS SET ESTADO_MESA = 'RECIBIDO' WHERE NUMERO_MESA = ?",
                    {
                        replacements: [numeroMesa],
                        type: QueryTypes.UPDATE
                    }
                );

                // 2. Opcional: Marcar pedidos como FINALIZADOS si así lo requiere tu lógica
                await sequelize.query(
                    "UPDATE PEDIDOS SET ESTADO_PEDIDO = 'FINALIZADO' WHERE ID_MESA = (SELECT ID_MESAS FROM MESAS WHERE NUMERO_MESA = ?) AND ESTADO_PEDIDO != 'FINALIZADO'",
                    {
                        replacements: [numeroMesa],
                        type: QueryTypes.UPDATE
                    }
                );

                console.log(`✅ Pago confirmado: Mesa ${numeroMesa} actualizada a RECIBIDO.`);
            }
        } catch (error) {
            console.error("❌ Error procesando el Webhook:", error);
        }
    }
    res.sendStatus(200); // Siempre responder 200 a Mercado Pago
};