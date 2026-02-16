import Categoria from '../Models/Categoria.js';
import Subcategoria from '../Models/Subcategoria.js';
import fs from 'fs/promises';
import path from 'path';

const borrarImagenFisica = async (rutaRelativa) => {
    if (!rutaRelativa) return;
    try {
        const rutaAbsoluta = path.join(process.cwd(), 'App', 'Assets', rutaRelativa);
        await fs.unlink(rutaAbsoluta);
        console.log(`Archivo borrado: ${rutaRelativa}`);
    } catch (err) {
        console.warn(`No se pudo borrar el archivo: ${rutaRelativa}. Quizás no existe.`);
    }
};

// --- CONTROLADOR DE CATEGORÍAS ---
export const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll({
            include: [{ model: Subcategoria, as: 'subcategorias' }]
        });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener categorías" });
    }
};

export const crearCategoria = async (req, res) => { 
    try {
        const { nombre } = req.body;
        const imagenRuta = req.file ? `/Image/Categoria/${req.file.filename}` : null;

        const nueva = await Categoria.create({ 
            NOMBRE_CATE: nombre, 
            IMAGEN: imagenRuta 
        });
        
        res.status(201).json(nueva);
    } catch (error) {
        console.error(error);
        res.status(400).json({ mensaje: "Error al crear categoría" });
    }
};

export const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const cate = await Categoria.findByPk(id);
        if (!cate) return res.status(404).json({ mensaje: "No existe" });

        let imagenRuta = cate.IMAGEN;

        if (req.file) {
            // Si subió una imagen nueva, borramos la vieja
            await borrarImagenFisica(cate.IMAGEN);
            imagenRuta = `/Image/Categoria/${req.file.filename}`;
        }

        await cate.update({ NOMBRE_CATE: nombre, IMAGEN: imagenRuta });
        res.json(cate);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar" });
    }
};

export const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const cate = await Categoria.findByPk(id);
        if (cate) {
            await borrarImagenFisica(cate.IMAGEN);
            await Categoria.destroy({ where: { ID_CATEGORIA: id } });
        }
        res.json({ mensaje: "Categoría e imagen eliminadas" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar" });
    }
};

// --- CONTROLADOR DE SUBCATEGORÍAS ---

export const crearSubcategoria = async (req, res) => {
    try {
        const { nombre, idPadre } = req.body;
        
        const imagenRuta = req.file ? `/Image/SubCategoria/${req.file.filename}` : null;

        const nueva = await Subcategoria.create({ 
            NOMBRE_SUBCATE: nombre, 
            IMAGEN: imagenRuta, 
            ID_CATEGO: idPadre 
        });
        
        res.status(201).json(nueva);
    } catch (error) {
        console.error(error);
        res.status(400).json({ mensaje: "Error al crear subcategoría" });
    }
};

export const actualizarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const sub = await Subcategoria.findByPk(id);
        
        let imagenRuta = sub.IMAGEN;
        if (req.file) {
            await borrarImagenFisica(sub.IMAGEN);
            imagenRuta = `/Image/SubCategoria/${req.file.filename}`;
        }

        await sub.update({ NOMBRE_SUBCATE: nombre, IMAGEN: imagenRuta });
        res.json(sub);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar sub" });
    }
};

export const eliminarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await Subcategoria.findByPk(id);
        if (sub) await borrarImagenFisica(sub.IMAGEN);
        await Subcategoria.destroy({ where: { ID_SUBCATEGORIA: id } });
        res.json({ mensaje: "Subcategoría eliminada" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar" });
    }
};