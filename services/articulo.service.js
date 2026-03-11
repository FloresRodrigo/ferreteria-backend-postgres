const { Articulo } = require('../models');
const { subirImagen } = require('./imgbb.service');
const { Op } = require('sequelize');

class ArticuloService {
    //METODO PARA CREAR UN ARTICULO
    async createArticulo({ nombre, descripcion, imagen, precio, stock }) {
        //Validar que lleguen todos los datos
        nombre = nombre?.trim();
        descripcion = descripcion?.trim();
        if(!nombre || !descripcion || precio === undefined || precio === null || stock == undefined || stock === null) {
            throw new Error('Debe ingresar todos los campos');
        };
        if(!imagen) {
            throw new Error('Debe subir una imagen del articulo');
        };
        //VALIDACIONES
        //Validar longitudes
        if(nombre.length < 8 || nombre.length > 40) {
            throw new Error('El nombre del articulo debe tener entre 8 y 40 caracteres');
        };
        if(descripcion.length < 10 || descripcion.length > 200) {
            throw new Error('La descripcion del articulo debe tener entre 10 y 200 caracteres');
        };
        //Validar valor
        if(typeof precio !== 'number' || precio < 0) {
            throw new Error('El precio no puede ser negativo');
        };
        if(typeof stock !== 'number' || stock < 0) {
            throw new Error('El stock no puede ser negativo');
        };
        //Se sube solo la imagen al final
        const imagenUrl = await subirImagen(imagen.buffer);
        const articulo = await Articulo.create({
            nombre: nombre,
            descripcion: descripcion,
            imagen: imagenUrl,
            precio: precio,
            stock: stock 
        });
        return articulo;
    };

    //METODO PARA TRAER LOS ARTICULOS (para los clientes)
    async getArticulos({ nombre, descripcion, precioMin, precioMax, page, limit, sortBy, order}) {
        //Para que por defecto traiga la pagina 1 con 9 articulos
        page = Math.max(1, Number(page) || 1 );
        limit = Math.min(50, Math.max(1, Number(limit) || 9));
        const filter = {
            estado: 'ACTIVO'
        };
        if(nombre && nombre.trim() !== '') {
            filter.nombre = { [Op.iLike]: `%${nombre.trim()}%` }
        };
        if(descripcion && descripcion.trim() !== '') {
            filter.descripcion = { [Op.iLike]: `%${descripcion.trim()}%` }
        };
        //Para traer precios mayor que y/o menor que
        if((precioMin !== undefined && precioMin !== '') || (precioMax !== undefined && precioMax !== '')) {
            filter.precio = {};
            if(precioMin !== undefined && precioMin !== '') {
                filter.precio[Op.gte] = Number(precioMin);
            };
            if(precioMax !== undefined && precioMax !== '') {
                filter.precio[Op.lte] = Number(precioMax);
            };
        };
        //Establecer el salto
        const skip = (page - 1) * limit;
        //Si no llega forma de ordenacion, se devuelve lo mas nuevo primero
        let sort = [['createdAt', 'DESC']];   
        //Cuando si llega se asigna esa forma
        if(sortBy) {
            const orderValid = order === 'asc' || order === 'desc';
            switch (sortBy) {
                //Se ordena por mayor precio o menor precio
                case 'precio':
                    if(orderValid) {
                        sort = [['precio', order.toUpperCase()]];
                    } else {
                        throw new Error('Ingrese un orden de precio valido');
                    };
                    break;
                //Se ordena por nombre (A-z)
                case 'nombre':
                    sort = [['nombre', 'ASC']];
                    break;
                //Si no es un caso valido, ordena por defecto desde el mas nuevo
                default: sort = [['createdAt', 'DESC']];
            };
        };
        //Se establece todo lo definido
        const [ articulos, total ] = await Promise.all([
            Articulo.findAll({
                where: filter,
                attributes: { exclude: ['estado', 'total_vendido', 'createdAt', 'updatedAt'] },
                order: sort,
                offset: skip,
                limit: limit
            }),
            Articulo.count({
                where: filter
            })
        ]);
        return {
            articulos,
            pagination: {
                page,
                limit,
                total,
                //Cuantas paginas totales habran con el limite establecido
                totalPages: Math.ceil(total / limit),
                //Verifica si se llego al total de articulos
                hasMore: page * limit < total
            }
        };
    };

    //METODO PARA TREAER EL INVENTARIO (para el admin)
    async getInventario({ nombre, descripcion, precioMin, precioMax, estado, page, limit, sortBy, order}) {
        //Para que por defecto traiga la pagina 1 con 9 articulos
        page = Math.max(1, Number(page) || 1 );
        limit = Math.min(50, Math.max(1, Number(limit) || 9));
        const filter = {};
        if(nombre && nombre.trim() !== '') {
            filter.nombre = { [Op.iLike]: `%${nombre.trim()}%` }
        };
        if(descripcion && descripcion.trim() !== '') {
            filter.descripcion = { [Op.iLike]: `%${descripcion.trim()}%` }
        };
        if(estado && (estado === 'ACTIVO' || estado === 'INACTIVO')) {
            filter.estado = estado;
        };
        //Para traer precios mayor que y/o menor que
        if((precioMin !== undefined && precioMin !== '') || (precioMax !== undefined && precioMax !== '')) {
            filter.precio = {};
            if(precioMin !== undefined && precioMin !== '') {
                filter.precio[Op.gte] = Number(precioMin);
            };
            if(precioMax !== undefined && precioMax !== '') {
                filter.precio[Op.lte] = Number(precioMax);
            };
        };
        //Establecer el salto
        const skip = (page - 1) * limit;
        //Si no llega forma de ordenacion, se devuelve lo mas nuevo primero
        let sort = [['createdAt', 'DESC']];
        //Cuando si llega se asigna esa forma
        if(sortBy) {
            const orderValid = order === 'asc' || order === 'desc';
            switch (sortBy) {
                //Se ordena por mayor precio o menor precio
                case 'precio':
                    if(orderValid) {
                        sort = [['precio', order.toUpperCase()]];
                    } else {
                        throw new Error('Ingrese un orden de precio valido');
                    };
                    break;
                //Se ordena por nombre (A-z)
                case 'nombre':
                    sort = [['nombre', 'ASC']];
                    break;
                //Se ordena por mayor stock o menor stock
                case 'stock':
                    if(orderValid) {
                        sort = [['stock', order.toUpperCase()]];
                    } else {
                        throw new Error('Ingrese un orden de stock valido');
                    };
                    break;
                //Se ordena por mayor cantidad vendida o menor cantidad vendida
                case 'total_vendido':
                    if(orderValid) {
                        sort = [['total_vendido', order.toUpperCase()]];
                    } else {
                        throw new Error('Ingrese un orden de total vendido valido');
                    };
                    break;
                //Si no es un caso valido, ordena por defecto desde el mas nuevo
                default: sort = [['createdAt', 'DESC']];
            };
        };
        //Se establece todo lo definido
        const [ articulos, total ] = await Promise.all([
            Articulo.findAll({
                where: filter,
                order: sort,
                offset: skip,
                limit: limit
            }),
            Articulo.count({
                where: filter
            })
        ]);
        return {
            articulos,
            pagination: {
                page,
                limit,
                total,
                //Cuantas paginas totales habran con el limite establecido
                totalPages: Math.ceil(total / limit),
                //Verifica si se llego al total de articulos
                hasMore: page * limit < total
            }
        };
    };

    //METODO PARA TRAER UN ARTICULO (para los clientes)
    async getArticuloPublic(id) {
        if(!id) {
            throw new Error('ID invalido');
        };
        const articulo = await Articulo.findOne({ where: { id: id, estado: 'ACTIVO' }, attributes: { exclude: ['estado', 'total_vendido', 'createdAt', 'updatedAt'] } });
        if(!articulo) {
            throw new Error('Articulo no disponible');
        };
        return articulo;
    };

    //METODO PARA TRAER UN ARTICULO (para el admin)
    async getArticuloAdmin(id) {
        if(!id) {
            throw new Error('ID invalido');
        };
        const articulo = await Articulo.findByPk(id);
        if(!articulo) {
            throw new Error('No se encontro un articulo con ese ID');
        };
        return articulo;
    };

    //METODO PARA ACTUALIZAR UN ARTICULO
    async updateArticulo(id, { nombre, descripcion, precio, stock, estado }, imagen) {
        //Verificar ID
        if(!id) {
            throw new Error('ID invalido');
        };
        //Validar datos
        nombre = nombre?.trim();
        descripcion = descripcion?.trim();
        if(!nombre && !descripcion && (precio === undefined || precio === null) && (stock === undefined || stock === null) && !estado && !imagen) {
            throw new Error('Ingrese al menos un campo para actualizar');
        };
        //Verificar articulo a editar
        const articulo = await Articulo.findByPk(id);
        if(!articulo) {
            throw new Error('No se encontro el articulo con ese ID');
        };
        //VALIDACIONES
        //Validar longitudes
        if(nombre) {
            if(nombre.length < 8 || nombre.length > 40) {
                throw new Error('El nombre del articulo debe tener entre 8 y 40 caracteres');
            };
            articulo.nombre = nombre;
        };
        if(descripcion) {
            if(descripcion.length < 10 || descripcion.length > 200) {
                throw new Error('La descripcion del articulo debe tener entre 10 y 200 caracteres');
            };
            articulo.descripcion = descripcion;
        };
        //Validar valores de precio y stock
        if(precio !== undefined && precio !== null) {
            if(typeof precio !== 'number' || precio < 0) {
                throw new Error('El precio no puede ser negativo');
            };
            articulo.precio = precio;
        };
        if(stock !== undefined && stock !== null) {
            if(typeof stock !== 'number' || stock < 0) {
                throw new Error('El stock no puede ser negativo');
            };
            articulo.stock = stock;
        };
        //Solo se puede colocar el estado en ACTIVO
        if(estado === 'ACTIVO') {
            articulo.estado = estado;
        };
        //Si llega una imagen nueva, esta se reemplaza
        if(imagen) {
            const imagenUrl = await subirImagen(imagen.buffer);
            articulo.imagen = imagenUrl;
        };
        await articulo.save();
        return articulo;
    };

    //METODO PARA ELIMINAR UN ARTICULO (logicamente)
    async deleteArticulo(id) {
        //Verificar ID
        if(!id) {
            throw new Error('ID invalido');
        };
        //Verificar articulo a eliminar
        const articulo = await Articulo.findByPk(id);
        if(!articulo) {
            throw new Error('No se encontro el articulo con ese ID');
        };
        //Verificar que no se encuentre ya inactivo
        if(articulo.estado === 'INACTIVO') {
            throw new Error('El articulo ya se encuentra inactivo');
        };
        articulo.estado = 'INACTIVO';
        await articulo.save();
    };

    //METODO PARA ACTUALIZAR STOCK Y TOTAL VENDIDO DE UN ARTICULO (no tiene endpoint)
    async actualizarStockYtotal(id, cantidad, transaction = null) {
        //Verificar ID
        if(!id) {
            throw new Error('ID invalido');
        };
        //Verificar que llegue cantidad
        if(cantidad === undefined || cantidad === null) {
            throw new Error('Ingrese cantidad para actualizar');
        };
        //Verificar que sea positiva
        if(cantidad <= 0) {
            throw new Error('La cantidad debe ser mayor a 0');
        };
        //Verificar articulo a actualizar
        const articulo = await Articulo.findByPk(id, { transaction: transaction });
        if(!articulo) {
            throw new Error('No se encontro el articulo con ese ID');
        };
        //Verificar stock disponible
        if(cantidad > articulo.stock) {
            throw new Error('No hay stock suficiente');
        };
        await Articulo.decrement(
            { stock: cantidad }, { where: { id: id }, transaction: transaction }
        );
        await Articulo.increment(
            { total_vendido: cantidad }, { where: { id: id }, transaction: transaction }
        );
    };

    //METODO PARA TRAER TOP 10 ARTICULOS MAS VENDIDOS
    async top10Articulos() {
        const destacados = await Articulo.findAll({ where: { estado: 'ACTIVO' }, attributes: { exclude: ['estado', 'total_vendido', 'createdAt', 'updatedAt'] }, order: [['total_vendido', 'DESC']], limit: 10 });
        return destacados;
    };

};//ARTICULOSERVICE
module.exports = new ArticuloService();