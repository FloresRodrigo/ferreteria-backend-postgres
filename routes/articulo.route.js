const express = require('express');
const articuloCtrl = require('../controllers/articulo.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

//RUTAS PARA ADMIN
//Obtener el inventario
router.get('/inventario', authMiddleware, adminMiddleware, articuloCtrl.getInventario);
//Obtener un articulo del inventario
router.get('/inventario/:id', authMiddleware, adminMiddleware, articuloCtrl.getArticuloAdmin);
//Agregar un articulo
router.post('/inventario', authMiddleware, adminMiddleware, uploadMiddleware.single('imagen'), articuloCtrl.createArticulo);
//Actualizar stock y total de un articulo
router.put('/inventario/stock-total/:id', authMiddleware, adminMiddleware, articuloCtrl.actualizarStockYtotal);
//Editar un articulo
router.put('/inventario/:id', authMiddleware, adminMiddleware, uploadMiddleware.single('imagen'), articuloCtrl.updateArticulo);
//Eliminar logicamente un articulo
router.delete('/inventario/:id', authMiddleware, adminMiddleware, articuloCtrl.deleteArticulo);

//RUTAS PUBLICAS
//Obtener top 10 articulos activos mas vendidos
router.get('/top10', articuloCtrl.top10Articulos);
//Obtener los articulos activos
router.get('/', articuloCtrl.getArticulos);
//Obtener un articulo activo
router.get('/:id', articuloCtrl.getArticuloPublic);

module.exports = router;