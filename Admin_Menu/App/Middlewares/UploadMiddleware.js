import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determinamos la carpeta según el campo del formulario
        let folder = 'Image/Productos'; // Por defecto
        if (file.fieldname === 'cateFile') folder = 'Image/Categoria';
        if (file.fieldname === 'subFile') folder = 'Image/SubCategoria';
        
        cb(null, path.join('App/Assets', folder));
    },
    filename: (req, file, cb) => {
        // Nombre único: fecha + nombre original
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({ storage });