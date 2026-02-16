// App/Controllers/UserController.js
import Usuario from "../Models/Usuario.js"; // <--- CORREGIDO: Nombre exacto del archivo
import bcrypt from "bcrypt";

export const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            // Usamos los nombres exactos de las columnas definidos en Models/Usuario.js
            attributes: ['ID_USUARIO', 'NOMBRE_USUARIO', 'CORREO', 'ROL'] 
        });
        res.json(usuarios);
    } catch (error) { 
        console.error("Error en obtenerUsuarios:", error);
        res.status(500).json({ mensaje: "Error al obtener usuarios" });
    }
};

export const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, contrasena, rol } = req.body;
        const passwordHash = await bcrypt.hash(contrasena, 10);
        
        const nuevoUsuario = await Usuario.create({
            NOMBRE_USUARIO: nombre,
            CORREO: correo,
            CONTRASENA: passwordHash,
            ROL: rol
        });
        
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        console.error("Error en crearUsuario:", error);
        res.status(400).json({ mensaje: "Error al crear usuario" });
    }
};

// Funcion para editar los Usuarios.
export const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, rol, contrasena } = req.body;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        // Preparamos los datos a actualizar
        const datosActualizados = {
            NOMBRE_USUARIO: nombre,
            CORREO: correo,
            ROL: rol
        };

        // Solo actualizamos la contraseña si el usuario escribió una nueva
        if (contrasena && contrasena.trim() !== "") {
            datosActualizados.CONTRASENA = await bcrypt.hash(contrasena, 10);
        }

        await usuario.update(datosActualizados);
        res.json({ mensaje: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar" });
    }
};

//Funcion Eliminar Usuario.
export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Usuario.destroy({ where: { ID_USUARIO: id } });
        
        if (eliminado) {
            res.json({ mensaje: "Usuario eliminado correctamente" });
        } else {
            res.status(404).json({ mensaje: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar" });
    }
};