const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

async function initDB() {
    try {
        //Prueba que se conecte bien a la bd con una query simple
        await pool.query('SELECT 1');
        console.log('BD conectada');
        //Se ejecuta el script para la creacion de tablas y relaciones
        const sql = fs.readFileSync(
            path.join(process.cwd(), 'init.sql'),
            'utf8'
        );
        await pool.query(sql);
        console.log('Tablas sincronizadas');
    } catch (error) {
        console.error(error);
    };
};

initDB();

module.exports = pool;