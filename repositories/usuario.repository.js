const pool = require('../database');

class UsuarioRepository {
    //Devuelve true si existe el usuario con el username pasado
    async findByUsername(username) {
        const result = await pool.query(`
            SELECT id FROM usuarios
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
        return result.rows.length > 0;
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

    //Actualiza los datos de un usuario
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
            WHERE id = $${i};`
        const result = await pool.query(query, valores);
        return result.rows[0];
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

    //Busca un usuario por su clave primaria
    async findByPk(id) {
        const result = await pool.query(`
            SELECT "isGoogle", password, "passwordChangedAt" FROM usuarios
            WHERE id = $1;`,
            [id]);
        return result.rows[0];
    };
};

module.exports = new UsuarioRepository();