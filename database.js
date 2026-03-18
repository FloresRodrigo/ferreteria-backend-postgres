const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
);

sequelize.authenticate()
.then(() => {
    console.log('BD conectada');
    require('./models');
    return sequelize.sync();
})
.then(() => {
    console.log('Tablas sincronizadas');
})
.catch(error => console.error(error));

module.exports = sequelize;