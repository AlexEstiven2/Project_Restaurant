// Controllers/AuthController.js
import Usuario from '../Models/Usuario.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // <--- IMPORTANTE: Importar bcrypt

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Buscar usuario
        const usuario = await Usuario.findOne({ 
            where: { 
                NOMBRE_USUARIO: username,
                ESTADO: 'ACTIVO' 
            } 
        }); 

        // 2. Validar existencia del usuario
        if (!usuario) {
            return res.status(401).json({ 
                message: "Usuario o contraseña incorrectos" 
            });
        }

        // 3. Comparar contraseña encriptada usando BCRYPT
        const passwordValido = await bcrypt.compare(password, usuario.CONTRASENA);

        if (!passwordValido) {
            return res.status(401).json({ 
                message: "Usuario o contraseña incorrectos" 
            });
        }

        // 4. Generar el Token JWT
        const token = jwt.sign(
            { id: usuario.ID_USUARIO, rol: usuario.ROL }, 
            process.env.JWT_SECRET || 'secret_key_balcony', 
            { expiresIn: '1d' }
        );

        // 5. Configurar la Cookie de seguridad
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });

        // 6. Respuesta exitosa
        return res.status(200).json({
            message: "Login exitoso",
            rol: usuario.ROL,
            nombre: usuario.NOMBRE_USUARIO,
            redirect: "/Webcony/dashboard"
        });

    } catch (error) {
        console.error("Error en Login:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};