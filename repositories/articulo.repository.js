const pool = require('../database');

class ArticuloRepository {
    //Crea un articulo
    async create({ nombre, descripcion, imagen, precio, stock }) {
        const result = await pool.query(`
            INSERT INTO articulos (nombre, descripcion, imagen, precio, stock)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;`,
            [nombre, descripcion, imagen, precio, stock]);
        return result.rows;
    };

    //Metodo para traer los articulos (para los clientes)
    async getArticulos({ nombre, descripcion, precioMin, precioMax, page, limit, sortBy, order }) {
        //Se establece el offset que tendra la busqueda
        const offset = (page - 1) * limit;
        //Se arma las condiciones, este metodo siempre buscara solo articulos activos
        let condiciones = ['estado = $1'];
        //Aqui van los valores que usaran las condiciones
        let valores = ['ACTIVO'];
        let i = 2;
        //Se agregan las condiciones y valores si estan presentes
        if(nombre) {
            condiciones.push(`nombre ILIKE $${i++}`);
            valores.push(`%${nombre}%`);
        };
        if(descripcion) {
            condiciones.push(`descripcion ILIKE $${i++}`);
            valores.push(`%${descripcion}%`);
        };
        if(precioMin !== undefined) {
            condiciones.push(`precio >= $${i++}`);
            valores.push(precioMin);
        };
        if(precioMax !== undefined) {
            condiciones.push(`precio <= $${i++}`);
            valores.push(precioMax);
        };
        //Se arma la condicion completa
        const where = `WHERE ${condiciones.join(' AND ')}`;
        //El orden por defecto
        let orderQuery = 'ORDER BY "createdAt" DESC';
        //Orden variante
        if(sortBy === 'precio') {
            orderQuery = `ORDER BY precio ${order.toUpperCase()}`;
        } else if(sortBy === 'nombre') {
            orderQuery = "ORDER BY nombre ASC"
        };
        //Se arma la query
        const query = `
            SELECT id, nombre, descripcion, imagen, precio, stock
            FROM articulos
            ${where}
            ${orderQuery}
            LIMIT $${i++}
            OFFSET $${i};`;
        //Valores que se pasaran a la query
        const valoresQuery = [ ...valores, limit, offset ];
        //Se manda la query y se guardan los resultados
        const articulosResult = await pool.query(query, valoresQuery);
        //Query para contar los articulos totales que cumplan con las condiciones del a busque principal
        const countQuery = `
            SELECT COUNT(*) as total
            FROM articulos
            ${where};`;
        //Se manda la query para contar con los valores y se guarda el resultado
        const countResult = await pool.query(countQuery, valores);
        //Parsear el resultado a integer
        const total = parseInt(countResult.rows[0].total);
        return {
            articulos: articulosResult.rows,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total/limit),
                hasMore: page * limit < total
            }
        };
    };

    //Metodo para traer los articulos (para el admin)
    async getInventario({ nombre, descripcion, precioMin, precioMax, estado, page, limit, sortBy, order }) {
        //Se establece el offset que tendra la busqueda
        const offset = (page - 1) * limit;
        //Se arma las condiciones, este metodo siempre buscara solo articulos activos
        let condiciones = [];
        //Aqui van los valores que usaran las condiciones
        let valores = [];
        let i = 1;
        //Se agregan las condiciones y valores si estan presentes
        if(nombre) {
            condiciones.push(`nombre ILIKE $${i++}`);
            valores.push(`%${nombre}%`);
        };
        if(descripcion) {
            condiciones.push(`descripcion ILIKE $${i++}`);
            valores.push(`%${descripcion}%`);
        };
        if(precioMin !== undefined) {
            condiciones.push(`precio >= $${i++}`);
            valores.push(precioMin);
        };
        if(precioMax !== undefined) {
            condiciones.push(`precio <= $${i++}`);
            valores.push(precioMax);
        };
        if(estado) {
            condiciones.push(`estado = $${i++}`);
            valores.push(estado);
        };
        //Se arma la condicion completa
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        //El orden por defecto
        let orderQuery = 'ORDER BY "createdAt" DESC';
        //Orden variante
        if(sortBy === 'precio') {
            orderQuery = `ORDER BY precio ${order.toUpperCase()}`;
        } else if(sortBy === 'stock') {
            orderQuery = `ORDER BY stock ${order.toUpperCase()}`;
        } else if(sortBy === 'total_vendido') {
            orderQuery = `ORDER BY total_vendido ${order.toUpperCase()}`;
        } else if(sortBy === 'nombre') {
            orderQuery = `ORDER BY nombre ASC`;
        };
        //Se arma la query
        const query = `
            SELECT *
            FROM articulos
            ${where}
            ${orderQuery}
            LIMIT $${i++}
            OFFSET $${i};`;
        //Valores que se pasaran a la query
        const valoresQuery = [ ...valores, limit, offset ];
        //Se manda la query y se guardan los resultados
        const articulosResult = await pool.query(query, valoresQuery);
        //Query para contar los articulos totales que cumplan con las condiciones del a busque principal
        const countQuery = `
            SELECT COUNT(*) as total
            FROM articulos
            ${where};`;
        //Se manda la query para contar con los valores y se guarda el resultado
        const countResult = await pool.query(countQuery, valores);
        //Parsear el resultado a integer
        const total = parseInt(countResult.rows[0].total);
        return {
            articulos: articulosResult.rows,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: Math.ceil(total/limit),
                hasMore: page * limit < total
            }
        };
    };

    //Recuepra un articulo por su id (para los clientes)
    async findByPkPub(id) {
        const result = await pool.query(`
            SELECT id, nombre, descripcion, imagen, precio, stock FROM articulos
            WHERE id = $1 AND estado = 'ACTIVO';`,
            [id]);
        return result.rows[0];
    };

    //Recupera un articulo por su id (para el admin)
    async findByPkPriv(id) {
        const result = await pool.query(`
            SELECT * FROM articulos
            WHERE id = $1;`,
            [id]);
        return result.rows[0];
    };

    //Editar un articulo
    async save(id, datos = {}) {
        let campos = [];
        let valores = [];
        let i = 1;
        for(const key in datos) {
            if(datos[key] !== undefined) {
                campos.push(`${key} = $${i++}`);
                valores.push(datos[key]);
            };
        };
        if(campos.length === 0) {
            throw new Error('No hay datos para actualizar');
        };
        valores.push(id);
        const query = `
            UPDATE articulos
            SET ${campos.join(', ')}
            WHERE id = $${i}
            RETURNING *;`;
        const result = await pool.query(query, valores);
        return result.rows[0];
    };

    //Actualiza el stock y el total vendido (transaccion)
    async actualizarStockYtotal(id, cantidad, client) {
        const query = `
            UPDATE articulos
            SET stock = stock - $2, total_vendido = total_vendido + $2
            WHERE id = $1 AND stock >= $2
            RETURNING 1;`;
        const result = await client.query(query, [id, cantidad]);
        return result.rows.length > 0;
    };

    //Trae los 10 articulos mas vendidos
    async top10Articulos() {
        const result = await pool.query(`
            SELECT id, nombre, descripcion, imagen, precio, stock
            FROM articulos
            WHERE estado = 'ACTIVO'
            ORDER BY total_vendido DESC
            LIMIT 1;`);
        return result.rows;
    };
};//ARTICULOREPOSITORY

module.exports = new ArticuloRepository();