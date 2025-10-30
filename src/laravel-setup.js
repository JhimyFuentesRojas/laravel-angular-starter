const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');

/**
 * Configura el proyecto Laravel
 */
async function setupLaravel(backendPath, config) {
    const spinner = ora('Creando proyecto Laravel...').start();

    try {
        // Crear proyecto Laravel
        const result = shell.exec(
            `composer create-project laravel/laravel "${backendPath}" --prefer-dist`,
            { silent: false }
        );

        if (result.code !== 0) {
            spinner.fail('Error al crear proyecto Laravel');
            throw new Error('No se pudo crear el proyecto Laravel');
        }

        spinner.text = 'Configurando Laravel...';

        // Configurar archivo .env
        await configureEnv(backendPath, config);

        // Configurar CORS
        await configureCors(backendPath);

        // Crear controlador de verificación
        await createDatabaseController(backendPath);

        // Configurar rutas API
        await configureApiRoutes(backendPath);

        // Instalar dependencias adicionales
        shell.cd(backendPath);
        shell.exec('composer require fruitcake/laravel-cors', { silent: true });

        // Generar key de la aplicación
        shell.exec('php artisan key:generate', { silent: true });

        // Ejecutar migraciones
        spinner.text = 'Ejecutando migraciones...';
        const migrateResult = shell.exec('php artisan migrate', { silent: true });

        if (migrateResult.code !== 0) {
            spinner.warn('Advertencia: No se pudieron ejecutar las migraciones');
        }

        spinner.succeed(chalk.green('✓ Backend Laravel configurado correctamente'));

    } catch (error) {
        spinner.fail('Error al configurar Laravel');
        throw error;
    }
}

/**
 * Configura el archivo .env
 */
async function configureEnv(backendPath, config) {
    const envPath = path.join(backendPath, '.env');
    const envExamplePath = path.join(backendPath, '.env.example');

    // Leer el archivo .env.example o .env
    let envContent = '';

    if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
    } else if (await fs.pathExists(envExamplePath)) {
        envContent = await fs.readFile(envExamplePath, 'utf8');
    }

    // Actualizar las variables de base de datos
    envContent = envContent.replace(/DB_CONNECTION=.*/g, 'DB_CONNECTION=mysql');
    envContent = envContent.replace(/DB_HOST=.*/g, `DB_HOST=${config.dbHost}`);
    envContent = envContent.replace(/DB_PORT=.*/g, 'DB_PORT=3306');
    envContent = envContent.replace(/DB_DATABASE=.*/g, `DB_DATABASE=${config.dbName}`);
    envContent = envContent.replace(/DB_USERNAME=.*/g, `DB_USERNAME=${config.dbUser}`);
    envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${config.dbPassword}`);

    // Agregar configuración de CORS
    if (!envContent.includes('SANCTUM_STATEFUL_DOMAINS')) {
        envContent += '\nSANCTUM_STATEFUL_DOMAINS=localhost:4200';
    }

    await fs.writeFile(envPath, envContent);
}

/**
 * Configura CORS para Laravel
 */
async function configureCors(backendPath) {
    const corsConfigPath = path.join(backendPath, 'config', 'cors.php');

    const corsConfig = `<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:4200'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
`;

    await fs.writeFile(corsConfigPath, corsConfig);
}

/**
 * Crea el controlador de verificación de base de datos
 */
async function createDatabaseController(backendPath) {
    const controllerPath = path.join(backendPath, 'app', 'Http', 'Controllers', 'DatabaseController.php');

    const controllerContent = `<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class DatabaseController extends Controller
{
    /**
     * Verifica el estado de la conexión a la base de datos
     */
    public function checkConnection()
    {
        try {
            DB::connection()->getPdo();
            
            $dbName = DB::connection()->getDatabaseName();
            
            return response()->json([
                'success' => true,
                'message' => 'Conexión a la base de datos exitosa',
                'database' => $dbName,
                'connection' => 'active',
                'timestamp' => now()->toDateTimeString()
            ]);
            
        } catch (\\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al conectar con la base de datos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Obtiene información del proyecto
     */
    public function projectInfo()
    {
        return response()->json([
            'success' => true,
            'project' => [
                'name' => env('APP_NAME', 'Laravel'),
                'environment' => env('APP_ENV', 'production'),
                'debug' => env('APP_DEBUG', false),
                'url' => env('APP_URL', 'http://localhost'),
                'database' => env('DB_DATABASE', 'N/A'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version()
            ]
        ]);
    }
}
`;

    await fs.writeFile(controllerPath, controllerContent);
}

/**
 * Configura las rutas API
 */
async function configureApiRoutes(backendPath) {
    const apiRoutesPath = path.join(backendPath, 'routes', 'api.php');

    const apiRoutes = `<?php

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\DatabaseController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API funcionando correctamente',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::get('/database/check', [DatabaseController::class, 'checkConnection']);
Route::get('/project/info', [DatabaseController::class, 'projectInfo']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
`;

    await fs.writeFile(apiRoutesPath, apiRoutes);
}

module.exports = {
    setupLaravel
};