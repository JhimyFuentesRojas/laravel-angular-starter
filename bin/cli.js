#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const { validateProjectName, checkDependencies } = require('../src/validators');
const { testDatabaseConnection, createDatabase } = require('../src/database');
const { setupLaravel } = require('../src/laravel-setup');
const { setupAngular } = require('../src/angular-setup');
const { startServers } = require('../src/index');

console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════╗
║  Laravel + Angular Full-Stack Generador de proyectos ║
║  Creación automatizada de proyectos profesionales    ║
╚══════════════════════════════════════════════════════╝
`));

program
    .version('1.0.0')
    .description('Genera proyectos full-stack con Laravel y Angular')
    .action(async () => {
        try {
            // Paso 1: Verificar dependencias
            console.log(chalk.yellow('\n🔍 Verificando dependencias del sistema...\n'));
            const spinner = ora('Comprobando dependencias').start();

            const dependencies = await checkDependencies();

            if (!dependencies.allInstalled) {
                spinner.fail(chalk.red('Faltan dependencias necesarias'));
                console.log(chalk.red('\n❌ Dependencias faltantes:'));
                if (!dependencies.node) console.log(chalk.red('  - Node.js (versión 14+)'));
                if (!dependencies.php) console.log(chalk.red('  - PHP (versión 8.0+)'));
                if (!dependencies.composer) console.log(chalk.red('  - Composer'));
                if (!dependencies.mysql) console.log(chalk.red('  - MySQL/MariaDB'));
                if (!dependencies.angularCli) console.log(chalk.red('  - Angular CLI (npm install -g @angular/cli)'));
                console.log(chalk.yellow('\nPor favor, instala las dependencias faltantes y vuelve a intentar.\n'));
                process.exit(1);
            }

            spinner.succeed(chalk.green('Todas las dependencias están instaladas'));

            // Paso 2: Preguntas interactivas
            console.log(chalk.cyan('\n📝 Configuración del proyecto\n'));

            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: '¿Cuál es el nombre de tu proyecto?',
                    default: 'mi-proyecto',
                    validate: (input) => {
                        const validation = validateProjectName(input);
                        return validation.valid ? true : validation.message;
                    }
                },
                {
                    type: 'input',
                    name: 'dbName',
                    message: '¿Nombre de la base de datos?',
                    default: (answers) => answers.projectName.replace(/-/g, '_') + '_db'
                },
                {
                    type: 'input',
                    name: 'dbUser',
                    message: '¿Usuario de la base de datos?',
                    default: 'root'
                },
                {
                    type: 'password',
                    name: 'dbPassword',
                    message: '¿Contraseña de la base de datos?',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'dbHost',
                    message: '¿Host de la base de datos?',
                    default: 'localhost'
                },
                {
                    type: 'confirm',
                    name: 'createDb',
                    message: '¿Deseas crear la base de datos automáticamente si no existe?',
                    default: true
                }
            ]);

            // Paso 3: Verificar conexión a la base de datos
            console.log(chalk.cyan('\n🔌 Verificando conexión a la base de datos...\n'));
            const dbSpinner = ora('Conectando a la base de datos').start();

            try {
                const dbConnection = await testDatabaseConnection({
                    host: answers.dbHost,
                    user: answers.dbUser,
                    password: answers.dbPassword
                });

                if (!dbConnection.success) {
                    dbSpinner.fail(chalk.red('No se pudo conectar a la base de datos'));
                    console.log(chalk.red(`\n❌ Error: ${dbConnection.error}\n`));
                    process.exit(1);
                }

                dbSpinner.succeed(chalk.green('Conexión a la base de datos exitosa'));

                // Crear base de datos si se solicitó
                if (answers.createDb) {
                    const createDbSpinner = ora(`Creando base de datos ${answers.dbName}`).start();
                    const dbCreated = await createDatabase({
                        host: answers.dbHost,
                        user: answers.dbUser,
                        password: answers.dbPassword,
                        database: answers.dbName
                    });

                    if (dbCreated.success) {
                        createDbSpinner.succeed(chalk.green(`Base de datos ${answers.dbName} lista`));
                    } else {
                        createDbSpinner.warn(chalk.yellow(`La base de datos ya existe o no se pudo crear`));
                    }
                }
            } catch (error) {
                dbSpinner.fail(chalk.red('Error al conectar con la base de datos'));
                console.log(chalk.red(`\n❌ ${error.message}\n`));
                process.exit(1);
            }

            // Paso 4: Crear estructura de carpetas y configurar proyectos
            const projectPath = path.join(process.cwd(), answers.projectName);
            const backendPath = path.join(projectPath, `${answers.projectName}-backend`);
            const frontendPath = path.join(projectPath, `${answers.projectName}-frontend`);

            console.log(chalk.cyan('\n🚀 Creando estructura del proyecto...\n'));

            // Configurar Laravel
            await setupLaravel(backendPath, answers);

            // Configurar Angular
            await setupAngular(frontendPath, answers);

            // Paso 5: Iniciar servidores
            console.log(chalk.cyan('\n🎉 ¡Proyecto creado exitosamente!\n'));
            console.log(chalk.green('📂 Estructura del proyecto:'));
            console.log(chalk.white(`   ${projectPath}/`));
            console.log(chalk.white(`   ├── ${answers.projectName}-backend/ (Laravel)`));
            console.log(chalk.white(`   └── ${answers.projectName}-frontend/ (Angular)`));

            const startAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'startNow',
                    message: '¿Deseas iniciar los servidores de desarrollo ahora?',
                    default: true
                }
            ]);

            if (startAnswer.startNow) {
                await startServers(backendPath, frontendPath, answers);
            } else {
                console.log(chalk.yellow('\n📖 Para iniciar los servidores manualmente:\n'));
                console.log(chalk.white(`   Backend:  cd ${answers.projectName}-backend && php artisan serve`));
                console.log(chalk.white(`   Frontend: cd ${answers.projectName}-frontend && ng serve\n`));
            }

        } catch (error) {
            console.error(chalk.red('\n❌ Error durante la creación del proyecto:'));
            console.error(chalk.red(error.message));
            console.error(error);
            process.exit(1);
        }
    });

program.parse(process.argv);