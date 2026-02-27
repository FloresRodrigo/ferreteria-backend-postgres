const multer = require('multer');

//Guardar la imagen
const storage = multer.memoryStorage();

//Aceptar solo imagenes de tipo establecido
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
    if(!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Formato de imagen invalido'));
    };
    cb(null, true);
};

//Se aplica lo anterior y se establece limite de 2MB
const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = uploadMiddleware;