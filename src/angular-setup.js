const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');

/**
 * Configura el proyecto Angular
 */
async function setupAngular(frontendPath, config) {
  const spinner = ora('Creando proyecto Angular...').start();

  try {
    // Asegurar que la ruta del frontend sea absoluta y exista
    const absoluteFrontendPath = path.resolve(frontendPath);
    await fs.ensureDir(path.dirname(absoluteFrontendPath));

    // Comando Angular CLI robusto
    const angularCommand = `npx @angular/cli new "${path.basename(absoluteFrontendPath)}" --directory="${absoluteFrontendPath}" --routing=true --style=css --skip-git=true --skip-install`;

    spinner.text = 'Creando proyecto Angular...';
    const result = shell.exec(angularCommand, { silent: false });

    if (result.code !== 0) {
      spinner.fail('Error al crear proyecto Angular');
      throw new Error('No se pudo crear el proyecto Angular');
    }

    spinner.text = 'Configurando Angular...';

    // Configurar environment
    await configureEnvironment(absoluteFrontendPath, config);

    // Crear servicio API
    await createApiService(absoluteFrontendPath);

    // Crear componente de bienvenida
    await createWelcomeComponent(absoluteFrontendPath, config);

    // Actualizar app.component
    await updateAppComponent(absoluteFrontendPath);

    // Actualizar app.routes o app-routing.module
    await updateRouting(absoluteFrontendPath);

    spinner.succeed(chalk.green('✓ Frontend Angular configurado correctamente'));
  } catch (error) {
    spinner.fail('Error al configurar Angular');
    console.error(chalk.red(`\n❌ ${error.message}\n`));
    throw error;
  }
}

/**
 * Configura el archivo de environment
 */
async function configureEnvironment(frontendPath, config) {
  const envDir = path.join(frontendPath, 'src', 'environments');
  await fs.ensureDir(envDir);

  const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  projectName: '${config.projectName}',
  database: '${config.dbName}'
};`;

  const envProdContent = `export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api',
  projectName: '${config.projectName}',
  database: '${config.dbName}'
};`;

  await fs.writeFile(path.join(envDir, 'environment.ts'), envContent);
  await fs.writeFile(path.join(envDir, 'environment.prod.ts'), envProdContent);
}

/**
 * Crea el servicio API
 */
async function createApiService(frontendPath) {
  const serviceDir = path.join(frontendPath, 'src', 'app', 'services');
  await fs.ensureDir(serviceDir);

  const serviceFile = path.join(serviceDir, 'api.service.ts');
  const serviceContent = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  checkDatabaseConnection(): Observable<any> {
    return this.http.get(\`\${this.apiUrl}/database/check\`);
  }

  getProjectInfo(): Observable<any> {
    return this.http.get(\`\${this.apiUrl}/project/info\`);
  }
}`;

  await fs.writeFile(serviceFile, serviceContent);
}

/**
 * Crea el componente de bienvenida
 */
async function createWelcomeComponent(frontendPath, config) {
  shell.cd(frontendPath);
  shell.exec('npx ng generate component welcome --skip-tests=true', { silent: true });

  const componentDir = path.join(frontendPath, 'src', 'app', 'welcome');
  await fs.ensureDir(componentDir);

  const tsFile = path.join(componentDir, 'welcome.component.ts');
  const htmlFile = path.join(componentDir, 'welcome.component.html');
  const cssFile = path.join(componentDir, 'welcome.component.css');

  // TS
  const tsContent = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  projectName = environment.projectName;
  constructor(private api: ApiService) {}
  ngOnInit(): void {}
}`;

  const htmlContent = `<div style="text-align:center; margin-top:50px;">
  <h1>🎉 Bienvenido a {{ projectName }}!</h1>
  <p>Tu proyecto Angular + Laravel está listo 🚀</p>
</div>`;

  const cssContent = `h1 { color: #673ab7; }`;

  await fs.writeFile(tsFile, tsContent);
  await fs.writeFile(htmlFile, htmlContent);
  await fs.writeFile(cssFile, cssContent);
}

/**
 * Actualiza el componente principal
 */
async function updateAppComponent(frontendPath) {
  const appComponent = path.join(frontendPath, 'src', 'app', 'app.component.ts');
  const content = `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent {}`;
  await fs.writeFile(appComponent, content);
}

/**
 * Actualiza las rutas
 */
async function updateRouting(frontendPath) {
  const routesFile = path.join(frontendPath, 'src', 'app', 'app.routes.ts');
  const content = `import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: '**', redirectTo: '' }
];`;
  await fs.writeFile(routesFile, content);
}

module.exports = { setupAngular };
