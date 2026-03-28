const pool = require('../database');

class ArticuloRepository {
    //METODO PARA TRAER LOS ARTICULOS (para los clientes)
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

    //METODO PARA TRAER TOP 10 ARTICULOS MAS VENDIDOS
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