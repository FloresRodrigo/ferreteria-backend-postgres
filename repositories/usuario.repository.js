const pool = require('../database');

class UsuarioRepository {
    //Devuelve true si existe el usuario con el username pasado
    async findByUsername(username) {
        const result = await pool.query(`
            SELECT 1 FROM usuarios
            WHERE username = $1;`,
            [username]);
        return result.rows.length > 0;
    };

    //Devuelve true si existe el usuario con el email pasado
    async findByEmail(email) {
        const result = await pool.query(`
            SELECT estado, "deleteRequestedAt", id, rol, "lastLogin", nombre_completo, username, email, "isGoogle" FROM usuarios
            WHERE email = $1;`,
            [email]);
        return result.rows[0];
    };

    //Guarda un usuario en la bd
    async create({ nombre_completo, username, email, password }) {
        const result = await pool.query(`
            INSERT INTO usuarios (nombre_completo, username, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING nombre_completo, username, email;`,
            [nombre_completo, username, email, password]);
        return result.rows[0];
    };

    //Busca un usuario por username o email
    async findByUsernameOrEmail(login) {
        const result = await pool.query(`
            SELECT "isGoogle", password, estado, "deleteRequestedAt", id, rol, "lastLogin", nombre_completo, username, email FROM usuarios
            WHERE username = $1 OR email = $1`,
            [login]);
        return result.rows[0];
    };

    //Actualiza los datos de un usuario (se usa en auth service)
    async authSave(id, datos = {}) {
        let campos = [];
        let valores = [];
        let i = 1;
        for(const key in datos) {
            if(datos[key] !== undefined) {
                campos.push(`"${key}" = $${i++}`);
                valores.push(datos[key]);
            };
        };
        if(campos.length === 0) {
            throw new Error('No hay campos para actualizar');
        };
        valores.push(id);
        const query = `
            UPDATE usuarios
            SET ${campos.join(', ')}
            WHERE id = $${i};`;
        await pool.query(query, valores);
        return;
    };

    //Guarda un usuario de google en la bd
    async createGoogle({ nombre_completo, username, email, isGoogle }) {
        const result = await pool.query(`
            INSERT INTO usuarios (nombre_completo, username, email, "isGoogle")
            VALUES ($1, $2, $3, $4)
            RETURNING estado, "deleteRequestedAt", id, rol, "lastLogin", nombre_completo, username, email, "isGoogle";`,
            [nombre_completo, username, email, isGoogle]);
        return result.rows[0];
    };

    //Busca un usuario por su clave primaria (solo devuelve campos sensibles)
    async findByPkSens(id) {
        const result = await pool.query(`
            SELECT "isGoogle", password, "passwordChangedAt", estado, "deleteRequestedAt", id FROM usuarios
            WHERE id = $1;`,
            [id]);
        return result.rows[0];
    };

    //Recupera todos los usuarios que cumplan las condiciones
    async findAll({ nombre_completo, username, email, estado }) {
        let condiciones = [];
        let valores = [];
        let i = 1;
        if(nombre_completo) {
            condiciones.push(`nombre_completo ILIKE $${i++}`);
            valores.push(`%${nombre_completo}%`);
        };
        if(username) {
            condiciones.push(`username ILIKE $${i++}`);
            valores.push(`%${username}%`);
        };
        if(email) {
            condiciones.push(`email ILIKE $${i++}`);
            valores.push(`%${email}%`);
        };
        if(estado) {
            condiciones.push(`estado = $${i++}`);
            valores.push(estado);
        };
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''; 
        const query = `
            SELECT id, nombre_completo, username, email, rol, estado, "lastLogin", "deleteRequestedAt", "passwordChangedAt", "isGoogle", "createdAt", "updatedAt" FROM usuarios
            ${where};`;
        const result = await pool.query(query, valores);
        return result.rows;
    };

    //Busca un usuario por su clave primaria (no devuelve campos sensibles)
    async findByPkNoSens(id) {
        const result = await pool.query(`
            SELECT id, nombre_completo, username, email, rol, estado, "lastLogin", "passwordChangedAt", "isGoogle", "createdAt", "updatedAt" FROM usuarios
            WHERE id = $1;`,
            [id]);
        return result.rows[0];
    };

    //Busca un usuario por su clave primaria (recupera todos los datos)
    async findByPk(id) {
        const result = await pool.query(`
            SELECT * FROM usuarios
            WHERE id = $1;`,
            [id]);
        return result.rows[0];
    };

    //Devuelve true si existe el usuario con el username pasado, sin incluirlo
    async findByUsernameNe(id, username) {
        const result = await pool.query(`
            SELECT 1 FROM usuarios
            WHERE username = $2 AND id != $1;`,
            [id, username]);
        return result.rows.length > 0;
    };

    //Devuelve true si existe el usuario con el email pasado, sin incluirlo
    async findByEmailNe(id, email) {
        const result = await pool.query(`
            SELECT 1 FROM usuarios
            WHERE email = $2 AND id != $1;`,
            [id, email]);
        return result.rows.length > 0;
    };

    //Actualiza los datos de un usuario (se usa en usuario service)
    async userSave(id, datos = {}) {
        let campos = [];
        let valores = [];
        let i = 1;
        for(const key in datos) {
            if(datos[key] !== undefined) {
                campos.push(`"${key}" = $${i++}`);
                valores.push(datos[key]);
            };
        };
        if(campos.length === 0) {
            throw new Error('No hay campos para actualizar');
        };
        valores.push(id);
        const query = `
            UPDATE usuarios
            SET ${campos.join(', ')}
            WHERE id = $${i};`;
        await pool.query(query, valores);
        return;
    };

};//USUARIOREPOSITORY

module.exports = new UsuarioRepository();