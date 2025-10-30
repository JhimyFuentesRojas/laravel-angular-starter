const shell = require('shelljs');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');

/**
 * Inicia los servidores de desarrollo
 */
async function startServers(backendPath, frontendPath, config) {
    console.log(chalk.cyan('\n🚀 Iniciando servidores de desarrollo...\n'));

    // Iniciar Laravel
    const laravelSpinner = ora('Iniciando backend Laravel (puerto 8000)...').start();

    const laravelProcess = spawn('php', ['artisan', 'serve'], {
        cwd: backendPath,
        shell: true,
        detached: false
    });

    laravelProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started')) {
            laravelSpinner.succeed(chalk.green('✓ Backend Laravel corriendo en http://localhost:8000'));
        }
    });

    laravelProcess.stderr.on('data', (data) => {
        console.error(chalk.red(`Error en Laravel: ${data}`));
    });

    // Esperar un momento antes de iniciar Angular
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Iniciar Angular
    const angularSpinner = ora('Iniciando frontend Angular (puerto 4200)...').start();

    const angularProcess = spawn('ng', ['serve', '--open'], {
        cwd: frontendPath,
        shell: true,
        detached: false
    });

    angularProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('compiled successfully')) {
            angularSpinner.succeed(chalk.green('✓ Frontend Angular corriendo en http://localhost:4200'));

            console.log(chalk.cyan('\n' + '='.repeat(60)));
            console.log(chalk.green.bold('\n  🎉 ¡Todo está listo!\n'));
            console.log(chalk.white('  Backend (Laravel):  ') + chalk.cyan('http://localhost:8000'));
            console.log(chalk.white('  Frontend (Angular): ') + chalk.cyan('http://localhost:4200'));
            console.log(chalk.white('  Base de datos:      ') + chalk.cyan(config.dbName));
            console.log(chalk.cyan('\n' + '='.repeat(60)));
            console.log(chalk.yellow('\n  Presiona Ctrl+C para detener los servidores\n'));
        }
    });

    angularProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('Warning') && !output.includes('Debugger')) {
            console.error(chalk.red(`Error en Angular: ${data}`));
        }
    });

    // Manejar la terminación de procesos
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n\n⚠️  Deteniendo servidores...'));

        laravelProcess.kill();
        angularProcess.kill();

        console.log(chalk.green('✓ Servidores detenidos\n'));
        process.exit(0);
    });

    // Mantener el proceso principal vivo
    return new Promise(() => { });
}

module.exports = {
    startServers
};