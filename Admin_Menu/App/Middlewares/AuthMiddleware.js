// App/Src/Middlewares/AuthMiddleware.js
import jwt from 'jsonwebtoken';

export const verificarAcceso = (rolesPermitidos = []) => {
    return (req, res, next) => {
        // 1. Obtener el token de las cookies
        const token = req.cookies.token;

        if (!token) {
            // Si es una navegación por URL (página HTML)
            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/Webcony/login');
            }
            // Si es una petición de datos (API/JSON)
            return res.status(401).json({ message: "Sesión no iniciada." });
        }

        try {
            // 2. Verificar el token
            const secret = process.env.JWT_SECRET || 'secret_key_balcony';
            const decoded = jwt.verify(token, secret);
            
            // Inyectamos los datos del usuario en la request para uso posterior
            req.user = decoded; 

            // 3. Control de Roles (RBAC) con validación de seguridad
            if (rolesPermitidos.length > 0) {
                // Verificamos que el rol exista en el token y esté en la lista permitida
                if (!decoded.rol || !rolesPermitidos.includes(decoded.rol)) {
                    
                    // Si intenta acceder a una página HTML sin permiso, mandarlo al dashboard
                    if (req.headers.accept && req.headers.accept.includes('text/html')) {
                        return res.redirect('/Webcony/dashboard');
                    }
                    
                    return res.status(403).json({ 
                        message: "No tienes permisos para realizar esta acción." 
                    });
                }
            }

            // 4. Todo correcto
            next();

        } catch (error) {
            // Si el token expiró o es inválido, limpiamos la cookie
            res.clearCookie("token");

            if (req.headers.accept && req.headers.accept.includes('text/html')) {
                return res.redirect('/Webcony/login?error=sesion_expirada');
            }
            
            return res.status(401).json({ message: "Su sesión ha expirado. Inicie sesión nuevamente." });
        }
    }; 
};