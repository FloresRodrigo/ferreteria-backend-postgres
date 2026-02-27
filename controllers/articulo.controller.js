const articuloService = require('../services/articulo.service');
const { success, failed } = require('../helpers/response.helper');

const articuloCtrl = {};

//METODO PARA CREAR UN ARTICULO
articuloCtrl.createArticulo = async (req, res) => {
    try {
        const articulo = await articuloService.createArticulo({ ...req.body, imagen: req.file });
        return success(res, 'Articulo creado exitosamente', articulo);
    } catch (error) {
        console.error('ERROR AL CREAR ARTICULO: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA RECUPERAR LOS ARTICULOS ACTIVOS (para los clientes)
articuloCtrl.getArticulos = async (req, res) => {
    try {
        const articulos = await articuloService.getArticulos(req.query);
        return success(res, 'Lista de articulos obtenida', articulos);
    } catch (error) {
        console.error('ERROR AL OBTENER ARTICULOS: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA TRAER EL INVENTARIO (para el admin)
articuloCtrl.getInventario = async (req, res) => {
    try {
        const articulos = await articuloService.getInventario(req.query);
        return success(res, 'Inventario obtenido', articulos);
    } catch (error) {
        console.error('ERROR AL OBTENER INVENTARIO: ', error);
        return failed(res, error.message);
    };
};
 
//METODO PARA TRAER UN ARTICULO (para los clientes)
articuloCtrl.getArticuloPublic = async (req, res) => {
    try {
        const articulo = await articuloService.getArticuloPublic(req.params.id);
        return success(res, 'Articulo encontrado', articulo);
    } catch (error) {
        console.error('ERROR AL OBTENER ARTICULO PUBLICO: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA TRAER UN ARTICULO (para el admin)
articuloCtrl.getArticuloAdmin = async (req, res) => {
    try {
        const articulo = await articuloService.getArticuloAdmin(req.params.id);
        return success(res, 'Articulo encontrado', articulo);
    } catch (error) {
        console.error('ERROR AL OBTENER ARTICULO: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA ACTUALIZAR UN ARTICULO
articuloCtrl.updateArticulo = async (req, res) => {
    try {
        const articulo = await articuloService.updateArticulo(req.params.id, req.body, req.file);
        return success(res, 'Articulo actualizado correctamente', articulo);
    } catch (error) {
        console.error('ERROR AL ACTUALIZAR ARTICULO: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA ELIMINAR UN ARTICULO (logicamente)
articuloCtrl.deleteArticulo = async (req, res) => {
    try {
        await articuloService.deleteArticulo(req.params.id);
        return success(res, 'Articulo eliminado');
    } catch (error) {
        console.error('ERROR AL ELIMINAR ARTICULO: ', error);
        return failed(res, error.message);
    };
};

//METODO PARA TRAER TOP 10 ARTICULOS MAS VENDIDOS
articuloCtrl.top10Articulos = async (req, res) => {
    try {
        const destacados = await articuloService.top10Articulos();
        return success(res, 'Top 10 articulos destacados', destacados);
    } catch (error) {
        console.error('ERROR AL OBTENER TOP 10: ', error);
        return failed(res, error.message);
    };
};

module.exports = articuloCtrl;