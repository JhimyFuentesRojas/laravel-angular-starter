const shell = require('shelljs');
const semver = require('semver');

/**
 * Valida el nombre del proyecto
 */
function validateProjectName(name) {
    const regex = /^[a-z0-9-]+$/;

    if (!name) {
        return { valid: false, message: 'El nombre del proyecto no puede estar vacío' };
    }

    if (!regex.test(name)) {
        return { valid: false, message: 'El nombre solo puede contener letras minúsculas, números y guiones' };
    }

    if (name.length < 3) {
        return { valid: false, message: 'El nombre debe tener al menos 3 caracteres' };
    }

    return { valid: true };
}

/**
 * Verifica la versión de Node.js
 */
function checkNodeVersion() {
    const version = process.version;
    const requiredVersion = '14.0.0';

    return {
        installed: true,
        version: version,
        valid: semver.gte(version, requiredVersion)
    };
}

/**
 * Verifica si PHP está instalado
 */
function checkPhp() {
    const result = shell.exec('php -v', { silent: true });

    if (result.code !== 0) {
        return { installed: false, version: null };
    }

    const versionMatch = result.stdout.match(/PHP (\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : null;

    return {
        installed: true,
        version: version,
        valid: version ? semver.gte(version, '8.0.0') : false
    };
}

/**
 * Verifica si Composer está instalado
 */
function checkComposer() {
    const result = shell.exec('composer --version', { silent: true });

    if (result.code !== 0) {
        return { installed: false, version: null };
    }

    const versionMatch = result.stdout.match(/Composer version (\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : null;

    return {
        installed: true,
        version: version,
        valid: true
    };
}

/**
 * Verifica si MySQL está instalado y accesible
 */
function checkMysql() {
    const result = shell.exec('mysql --version', { silent: true });

    if (result.code !== 0) {
        // Intentar con mysqld
        const result2 = shell.exec('mysqld --version', { silent: true });
        if (result2.code !== 0) {
            return { installed: false, version: null };
        }
    }

    return {
        installed: true,
        version: 'installed',
        valid: true
    };
}

/**
 * Verifica si Angular CLI está instalado
 */
function checkAngularCli() {
    const result = shell.exec('ng version', { silent: true });

    if (result.code !== 0) {
        return { installed: false, version: null };
    }

    const versionMatch = result.stdout.match(/Angular CLI: (\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : null;

    return {
        installed: true,
        version: version,
        valid: true
    };
}

/**
 * Verifica todas las dependencias necesarias
 */
async function checkDependencies() {
    const node = checkNodeVersion();
    const php = checkPhp();
    const composer = checkComposer();
    const mysql = checkMysql();
    const angularCli = checkAngularCli();

    const allInstalled = node.valid &&
        php.installed && php.valid &&
        composer.installed &&
        mysql.installed &&
        angularCli.installed;

    return {
        node: node.valid,
        php: php.installed && php.valid,
        composer: composer.installed,
        mysql: mysql.installed,
        angularCli: angularCli.installed,
        allInstalled,
        details: {
            node,
            php,
            composer,
            mysql,
            angularCli
        }
    };
}

module.exports = {
    validateProjectName,
    checkDependencies,
    checkNodeVersion,
    checkPhp,
    checkComposer,
    checkMysql,
    checkAngularCli
};