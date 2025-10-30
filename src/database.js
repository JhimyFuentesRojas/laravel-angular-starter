const mysql = require('mysql2/promise');

/**
 * Prueba la conexión a la base de datos
 */
async function testDatabaseConnection(config) {
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password
        });

        await connection.ping();
        await connection.end();

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Crea la base de datos si no existe
 */
async function createDatabase(config) {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password
        });

        // Verificar si la base de datos ya existe
        const [databases] = await connection.query(
            'SHOW DATABASES LIKE ?',
            [config.database]
        );

        if (databases.length > 0) {
            await connection.end();
            return {
                success: true,
                existed: true,
                message: `La base de datos ${config.database} ya existe`
            };
        }

        // Crear la base de datos
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.database}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );

        await connection.end();

        return {
            success: true,
            existed: false,
            message: `Base de datos ${config.database} creada exitosamente`
        };

    } catch (error) {
        if (connection) {
            await connection.end();
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verifica la conexión a una base de datos específica
 */
async function testDatabaseExists(config) {
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        await connection.ping();
        await connection.end();

        return { success: true, exists: true };
    } catch (error) {
        if (error.code === 'ER_BAD_DB_ERROR') {
            return { success: true, exists: false };
        }
        return {
            success: false,
            exists: false,
            error: error.message
        };
    }
}

module.exports = {
    testDatabaseConnection,
    createDatabase,
    testDatabaseExists
};