import Producto from '../Models/Productos.js';
import Subcategoria from '../Models/SubCategoria.js';
import fs from 'fs';
import path from 'path';

export const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            include: [{
                model: Subcategoria,
                as: 'detalles_sub', // <--- Debe coincidir con el alias del modelo
                attributes: ['NOMBRE_SUBCATE']
            }]
        });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener productos' });
    }
};

export const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, idSubcate } = req.body;
        const imagenRuta = req.file ? `/Image/Productos/${req.file.filename}` : null;
        const nuevo = await Producto.create({
            NOMBRE_PRODUCTO: nombre, DESCRIPCION_PRO: descripcion,
            PRECIO_PRO: precio, ID_SUBCATE: idSubcate,
            IMAGEN: imagenRuta, ESDADO_PRO: 'DISPONIBLE'
        });
        res.status(201).json(nuevo);
    } catch (error) { res.status(500).json({ mensaje: 'Error al crear' }); }
};

export const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, idSubcate, estado } = req.body;
        const producto = await Producto.findByPk(id);
        if (!producto) return res.status(404).json({ mensaje: 'No encontrado' });

        let nuevaImagenRuta = producto.IMAGEN;
        if (req.file) {
            if (producto.IMAGEN) {
                const rutaVieja = path.join(process.cwd(), 'App/Assets', producto.IMAGEN);
                if (fs.existsSync(rutaVieja)) fs.unlinkSync(rutaVieja);
            }
            nuevaImagenRuta = `/Image/Productos/${req.file.filename}`;
        }

        await producto.update({
            NOMBRE_PRODUCTO: nombre, DESCRIPCION_PRO: descripcion,
            PRECIO_PRO: precio, ID_SUBCATE: idSubcate,
            ESDADO_PRO: estado, IMAGEN: nuevaImagenRuta
        });
        res.json({ mensaje: 'Actualizado' });
    } catch (error) { res.status(500).json({ mensaje: 'Error al actualizar' }); }
};

export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findByPk(id);
        if (producto?.IMAGEN) {
            const ruta = path.join(process.cwd(), 'App/Assets', producto.IMAGEN);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        await Producto.destroy({ where: { ID_PRODUCTOS: id } });
        res.json({ mensaje: 'Eliminado' });
    } catch (error) { res.status(500).json({ mensaje: 'Error' }); }
};