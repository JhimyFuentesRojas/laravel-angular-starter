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
        // Crear proyecto Angular
        const result = shell.exec(
            `ng new "${path.basename(frontendPath)}" --directory="${frontendPath}" --routing=true --style=css --skip-git=true`,
            { silent: false }
        );

        if (result.code !== 0) {
            spinner.fail('Error al crear proyecto Angular');
            throw new Error('No se pudo crear el proyecto Angular');
        }

        spinner.text = 'Configurando Angular...';

        // Configurar environment
        await configureEnvironment(frontendPath, config);

        // Crear servicio API
        await createApiService(frontendPath);

        // Crear componente de bienvenida
        await createWelcomeComponent(frontendPath, config);

        // Actualizar app.component
        await updateAppComponent(frontendPath);

        // Actualizar app.routes o app-routing.module
        await updateRouting(frontendPath);

        spinner.succeed(chalk.green('✓ Frontend Angular configurado correctamente'));

    } catch (error) {
        spinner.fail('Error al configurar Angular');
        throw error;
    }
}

/**
 * Configura el archivo de environment
 */
async function configureEnvironment(frontendPath, config) {
    const envPath = path.join(frontendPath, 'src', 'environments', 'environment.ts');
    const envProdPath = path.join(frontendPath, 'src', 'environments', 'environment.prod.ts');

    const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  projectName: '${config.projectName}',
  database: '${config.dbName}'
};
`;

    const envProdContent = `export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api',
  projectName: '${config.projectName}',
  database: '${config.dbName}'
};
`;

    await fs.ensureDir(path.dirname(envPath));
    await fs.writeFile(envPath, envContent);
    await fs.writeFile(envProdPath, envProdContent);
}

/**
 * Crea el servicio API
 */
async function createApiService(frontendPath) {
    const servicePath = path.join(frontendPath, 'src', 'app', 'services');
    await fs.ensureDir(servicePath);

    const serviceFile = path.join(servicePath, 'api.service.ts');

    const serviceContent = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DatabaseStatus {
  success: boolean;
  message: string;
  database?: string;
  connection?: string;
  timestamp?: string;
  error?: string;
}

export interface ProjectInfo {
  success: boolean;
  project: {
    name: string;
    environment: string;
    debug: boolean;
    url: string;
    database: string;
    php_version: string;
    laravel_version: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  checkDatabaseConnection(): Observable<DatabaseStatus> {
    return this.http.get<DatabaseStatus>(\`\${this.apiUrl}/database/check\`);
  }

  getProjectInfo(): Observable<ProjectInfo> {
    return this.http.get<ProjectInfo>(\`\${this.apiUrl}/project/info\`);
  }

  healthCheck(): Observable<any> {
    return this.http.get(\`\${this.apiUrl}/health\`);
  }
}
`;

    await fs.writeFile(serviceFile, serviceContent);
}

/**
 * Crea el componente de bienvenida
 */
async function createWelcomeComponent(frontendPath, config) {
    shell.cd(frontendPath);
    shell.exec('ng generate component welcome --skip-tests=true', { silent: true });

    const componentPath = path.join(frontendPath, 'src', 'app', 'welcome');

    // TypeScript
    const tsContent = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, DatabaseStatus, ProjectInfo } from '../services/api.service';
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
  databaseName = environment.database;
  
  databaseStatus: DatabaseStatus | null = null;
  projectInfo: ProjectInfo | null = null;
  
  loading = true;
  error: string | null = null;
  
  backendPort = '8000';
  frontendPort = '4200';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.checkBackendConnection();
  }

  checkBackendConnection(): void {
    this.loading = true;
    this.error = null;

    // Check database
    this.apiService.checkDatabaseConnection().subscribe({
      next: (response) => {
        this.databaseStatus = response;
        this.loadProjectInfo();
      },
      error: (err) => {
        this.error = 'No se pudo conectar con el backend. Asegúrate de que el servidor Laravel esté corriendo en el puerto 8000.';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  loadProjectInfo(): void {
    this.apiService.getProjectInfo().subscribe({
      next: (response) => {
        this.projectInfo = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project info:', err);
        this.loading = false;
      }
    });
  }

  retry(): void {
    this.checkBackendConnection();
  }
}
`;

    // HTML
    const htmlContent = `<div class="welcome-container">
  <div class="header">
    <h1>🎉 ¡Proyecto Creado Exitosamente!</h1>
    <p class="subtitle">Tu aplicación full-stack está lista para usar</p>
  </div>

  <div class="loading" *ngIf="loading">
    <div class="spinner"></div>
    <p>Conectando con el backend...</p>
  </div>

  <div class="error-message" *ngIf="error && !loading">
    <div class="error-icon">⚠️</div>
    <h3>Error de Conexión</h3>
    <p>{{ error }}</p>
    <button class="retry-btn" (click)="retry()">Reintentar</button>
  </div>

  <div class="success-content" *ngIf="!loading && !error">
    <div class="info-grid">
      <div class="info-card">
        <div class="card-icon">📦</div>
        <h3>Proyecto</h3>
        <p class="card-value">{{ projectName }}</p>
      </div>

      <div class="info-card" [class.success]="databaseStatus?.success">
        <div class="card-icon">💾</div>
        <h3>Base de Datos</h3>
        <p class="card-value">{{ databaseStatus?.database || databaseName }}</p>
        <span class="status-badge" *ngIf="databaseStatus?.success">Conectada</span>
        <span class="status-badge error" *ngIf="!databaseStatus?.success">Error</span>
      </div>

      <div class="info-card">
        <div class="card-icon">🚀</div>
        <h3>Backend (Laravel)</h3>
        <p class="card-value">Puerto {{ backendPort }}</p>
        <a href="http://localhost:{{ backendPort }}/api/health" target="_blank" class="link">Ver API</a>
      </div>

      <div class="info-card">
        <div class="card-icon">⚡</div>
        <h3>Frontend (Angular)</h3>
        <p class="card-value">Puerto {{ frontendPort }}</p>
        <span class="status-badge success">Activo</span>
      </div>
    </div>

    <div class="project-details" *ngIf="projectInfo">
      <h3>Detalles del Sistema</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="label">Laravel:</span>
          <span class="value">{{ projectInfo.project.laravel_version }}</span>
        </div>
        <div class="detail-item">
          <span class="label">PHP:</span>
          <span class="value">{{ projectInfo.project.php_version }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Entorno:</span>
          <span class="value">{{ projectInfo.project.environment }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Estado:</span>
          <span class="value success-text">✓ Operacional</span>
        </div>
      </div>
    </div>

    <div class="next-steps">
      <h3>📋 Próximos Pasos</h3>
      <ol>
        <li>Explora la estructura del proyecto en tu editor de código</li>
        <li>Revisa las rutas API en <code>routes/api.php</code></li>
        <li>Crea tus modelos y controladores en Laravel</li>
        <li>Desarrolla tus componentes en Angular</li>
        <li>¡Comienza a construir algo increíble! 🚀</li>
      </ol>
    </div>
  </div>

  <footer class="footer">
    <p>Generado con ❤️ por Laravel-Angular-Starter</p>
  </footer>
</div>
`;

    // CSS
    const cssContent = `.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 3em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 1.3em;
  margin-top: 10px;
  opacity: 0.9;
}

.loading {
  text-align: center;
  color: white;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: white;
  border-radius: 15px;
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.error-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1em;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.success-content {
  max-width: 1200px;
  margin: 0 auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.info-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: transform 0.3s, box-shadow 0.3s;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
}

.card-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.info-card h3 {
  color: #333;
  margin: 10px 0;
  font-size: 1.2em;
}

.card-value {
  color: #667eea;
  font-size: 1.3em;
  font-weight: bold;
  margin: 10px 0;
}

.status-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9em;
  margin-top: 10px;
  background: #4CAF50;
  color: white;
}

.status-badge.error {
  background: #f44336;
}

.status-badge.success {
  background: #4CAF50;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.9em;
  display: inline-block;
  margin-top: 10px;
}

.link:hover {
  text-decoration: underline;
}

.project-details {
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.project-details h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.detail-item .label {
  font-weight: bold;
  color: #666;
}

.detail-item .value {
  color: #333;
}

.success-text {
  color: #4CAF50 !important;
}

.next-steps {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.next-steps h3 {
  color: #333;
  margin-top: 0;
}

.next-steps ol {
  line-height: 2;
  color: #555;
}

.next-steps code {
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  color: #667eea;
  font-family: 'Courier New', monospace;
}

.footer {
  text-align: center;
  color: white;
  margin-top: 40px;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2em;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
`;

    await fs.writeFile(path.join(componentPath, 'welcome.component.ts'), tsContent);
    await fs.writeFile(path.join(componentPath, 'welcome.component.html'), htmlContent);
    await fs.writeFile(path.join(componentPath, 'welcome.component.css'), cssContent);
}

/**
 * Actualiza el componente principal de la app
 */
async function updateAppComponent(frontendPath) {
    const appComponentPath = path.join(frontendPath, 'src', 'app', 'app.component.ts');

    const appComponentContent = `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  template: '<router-outlet></router-outlet>',
  styles: []
})
export class AppComponent {
  title = 'Laravel Angular Starter';
}
`;

    await fs.writeFile(appComponentPath, appComponentContent);
}

/**
 * Actualiza el sistema de rutas
 */
async function updateRouting(frontendPath) {
    const routesPath = path.join(frontendPath, 'src', 'app', 'app.routes.ts');

    const routesContent = `import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: '**', redirectTo: '' }
];
`;

    await fs.writeFile(routesPath, routesContent);

    // Actualizar app.config.ts para incluir HttpClient
    const appConfigPath = path.join(frontendPath, 'src', 'app', 'app.config.ts');

    const appConfigContent = `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
`;

    await fs.writeFile(appConfigPath, appConfigContent);
}

module.exports = {
    setupAngular
};