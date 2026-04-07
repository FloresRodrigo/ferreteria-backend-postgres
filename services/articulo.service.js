const ArticuloRepository = require('../repositories/articulo.repository');
const { subirImagen } = require('./imgbb.service');

class ArticuloService {
    //METODO PARA CREAR UN ARTICULO
    async createArticulo({ nombre, descripcion, imagen, precio, stock }) {
        //Validar que lleguen todos los datos
        nombre = nombre?.trim();
        descripcion = descripcion?.trim();
        precio = precio !== undefined && precio !== null ? Number(precio) : precio;
        stock = stock !== undefined && stock !== null ? Number(stock) : stock;
        if(!nombre || !descripcion || precio === undefined || precio === null || stock == undefined || stock === null) {
            throw new Error('Debe ingresar todos los campos');
        };
        if(!imagen) {
            throw new Error('Debe subir una imagen del articulo');
        };
        //VALIDACIONES
        //Validar longitudes
        if(nombre.length < 3 || nombre.length > 40) {
            throw new Error('El nombre del articulo debe tener entre 3 y 40 caracteres');
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
        const articulo = await ArticuloRepository.create({
            nombre: nombre,
            descripcion: descripcion,
            imagen: imagenUrl,
            precio: precio,
            stock: stock 
        });
        return articulo;
    };

    //METODO PARA TRAER LOS ARTICULOS (para los clientes)
    //Ahora solo normaliza y valida
    async getArticulos({ nombre, descripcion, precioMin, precioMax, page, limit, sortBy, order}) {
        //Para que por defecto traiga la pagina 1 con 9 articulos
        page = Math.max(1, Number(page) || 1 );
        limit = Math.min(50, Math.max(1, Number(limit) || 9));
        if(nombre) {
            nombre = nombre.trim();
        };
        if(descripcion) {
            descripcion = descripcion.trim();
        };
        if(precioMin !== undefined && precioMin !== '') {
            precioMin = Number(precioMin);
        };
        if(precioMax !== undefined && precioMax !== '') {
            precioMax = Number(precioMax);
        };
        if(sortBy) {
            const orderValid = order === 'asc' || order === 'desc';
            if(sortBy === 'precio' && !orderValid) {
                throw new Error('Ingrese un orden de precio valido');
            };
        };
        return await ArticuloRepository.getArticulos({ nombre, descripcion, precioMin, precioMax, page, limit, sortBy, order });
    };

    //METODO PARA TREAER EL INVENTARIO (para el admin)
    //Ahora solo normaliza y valida
    async getInventario({ nombre, descripcion, precioMin, precioMax, estado, page, limit, sortBy, order}) {
        //Para que por defecto traiga la pagina 1 con 9 articulos
        page = Math.max(1, Number(page) || 1 );
        limit = Math.min(50, Math.max(1, Number(limit) || 9));
        if(nombre) {
            nombre = nombre.trim();
        };
        if(descripcion) {
            descripcion = descripcion.trim();
        };
        if(estado && !['ACTIVO', 'INACTIVO'].includes(estado)) {
            estado = undefined;
        };
        if((precioMin !== undefined && precioMin !== '')) {
            precioMin = Number(precioMin);
        };
        if(precioMax !== undefined && precioMax !== '') {
            precioMax = Number(precioMax);
        };
        if(sortBy) {
            const orderValid = order === 'asc' || order === 'desc';
                if(sortBy === 'precio' && !orderValid) {
                    throw new Error('Ingrese un orden de precio valido');
                };
                //Se ordena por mayor stock o menor stock
                if(sortBy === 'stock' && !orderValid) {
                    throw new Error('Ingrese un orden de stock valido');
                };
                if(sortBy === 'total_vendido' && !orderValid) {
                    throw new Error('Ingrese un orden de total vendido valido');
                };
        };
        //Se establece todo lo definido
        return await ArticuloRepository.getInventario({ nombre, descripcion, precioMin, precioMax, estado, page, limit, sortBy, order });
    };

    //METODO PARA TRAER UN ARTICULO (para los clientes)
    async getArticuloPublic(id) {
        if(!id) {
            throw new Error('ID invalido');
        };
        const articulo = await ArticuloRepository.findByPkPub(id);
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
        const articulo = await ArticuloRepository.findByPkPriv(id);
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
        precio = precio !== undefined && precio !== null ? Number(precio) : precio;
        stock = stock !== undefined && stock !== null ? Number(stock) : stock;
        if(!nombre && !descripcion && (precio === undefined || precio === null) && (stock === undefined || stock === null) && !estado && !imagen) {
            throw new Error('Ingrese al menos un campo para actualizar');
        };
        //Verificar articulo a editar
        const articulo = await ArticuloRepository.findByPkPriv(id);
        if(!articulo) {
            throw new Error('No se encontro el articulo con ese ID');
        };
        //VALIDACIONES
        //Validar longitudes
        const datosActualizar = {};
        if(nombre) {
            if(nombre.length < 3 || nombre.length > 40) {
                throw new Error('El nombre del articulo debe tener entre 3 y 40 caracteres');
            };
            datosActualizar.nombre = nombre;
        };
        if(descripcion) {
            if(descripcion.length < 10 || descripcion.length > 200) {
                throw new Error('La descripcion del articulo debe tener entre 10 y 200 caracteres');
            };
            datosActualizar.descripcion = descripcion;
        };
        //Validar valores de precio y stock
        if(precio !== undefined && precio !== null) {
            if(typeof precio !== 'number' || precio < 0) {
                throw new Error('El precio no puede ser negativo');
            };
            datosActualizar.precio = precio;
        };
        if(stock !== undefined && stock !== null) {
            if(typeof stock !== 'number' || stock < 0) {
                throw new Error('El stock no puede ser negativo');
            };
            datosActualizar.stock = stock;
        };
        //Solo se puede colocar el estado en ACTIVO
        if(estado === 'ACTIVO') {
            datosActualizar.estado = estado;
        };
        //Si llega una imagen nueva, esta se reemplaza
        if(imagen) {
            const imagenUrl = await subirImagen(imagen.buffer);
            datosActualizar.imagen = imagenUrl;
        };
        const articuloAct = await ArticuloRepository.save(id, datosActualizar);
        return articuloAct;
    };

    //METODO PARA ELIMINAR UN ARTICULO (logicamente)
    async deleteArticulo(id) {
        //Verificar ID
        if(!id) {
            throw new Error('ID invalido');
        };
        //Verificar articulo a eliminar
        const articulo = await ArticuloRepository.findByPkPriv(id);
        if(!articulo) {
            throw new Error('No se encontro el articulo con ese ID');
        };
        //Verificar que no se encuentre ya inactivo
        if(articulo.estado === 'INACTIVO') {
            throw new Error('El articulo ya se encuentra inactivo');
        };
        articulo.estado = 'INACTIVO';
        await ArticuloRepository.save(id, { estado: articulo.estado });
    };

    //METODO PARA ACTUALIZAR STOCK Y TOTAL VENDIDO DE UN ARTICULO (no tiene endpoint)
    async actualizarStockYtotal(id, cantidad, client) {
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
        const actualizado = await ArticuloRepository.actualizarStockYtotal(id, cantidad, client);
        if(!actualizado) {
            throw new Error('No hay stock suficiente');
        };
    };

    //METODO PARA TRAER TOP 10 ARTICULOS MAS VENDIDOS
    async top10Articulos() {
        const destacados = await ArticuloRepository.top10Articulos();
        return destacados;
    };

};//ARTICULOSERVICE
module.exports = new ArticuloService();