# Laravel Angular Starter

🚀 Generador CLI automático para proyectos full-stack con Laravel (backend) y Angular (frontend).

## 📋 Características

- ✅ Creación automática de proyectos Laravel + Angular
- ✅ Configuración automática de base de datos
- ✅ CORS preconfigurado
- ✅ Página de verificación de conexión
- ✅ Servidores de desarrollo iniciados automáticamente
- ✅ Estructura de proyecto profesional
- ✅ Validación de dependencias
- ✅ Interfaz CLI interactiva

## 🔧 Requisitos del Sistema

Antes de usar este paquete, asegúrate de tener instalado:

- **Node.js** v14.0.0 o superior
- **PHP** v8.0 o superior
- **Composer** (gestor de paquetes de PHP)
- **MySQL** o **MariaDB**
- **Angular CLI** (instalar con: `npm install -g @angular/cli`)

### Verificar Instalaciones

```bash
node --version    # Debe ser >= 14.0.0
php --version     # Debe ser >= 8.0
composer --version
mysql --version
ng version
```

## 📦 Instalación

### Instalación Global (Recomendado)

```bash
npm install -g laravel-angular-starter
```

### Uso con npx (Sin instalación)

```bash
npx laravel-angular-starter
```

## 🚀 Uso

### Crear un Nuevo Proyecto

```bash
create-laravel-angular
```

El CLI te guiará a través de un proceso interactivo donde deberás proporcionar:

1. **Nombre del proyecto**: nombre-de-tu-proyecto
2. **Nombre de la base de datos**: mi_base_de_datos
3. **Usuario de BD**: root (o tu usuario)
4. **Contraseña de BD**: tu contraseña
5. **Host de BD**: localhost (por defecto)
6. **Crear BD automáticamente**: Sí/No

### Ejemplo de Uso

```bash
$ create-laravel-angular

╔══════════════════════════════════════════════════════╗
║  Laravel + Angular Full-Stack Project Generator     ║
║  Creación automatizada de proyectos profesionales   ║
╚══════════════════════════════════════════════════════╝

🔍 Verificando dependencias del sistema...

✓ Todas las dependencias están instaladas

📝 Configuración del proyecto

? ¿Cuál es el nombre de tu proyecto? mi-proyecto
? ¿Nombre de la base de datos? mi_proyecto_db
? ¿Usuario de la base de datos? root
? ¿Contraseña de la base de datos? ********
? ¿Host de la base de datos? localhost
? ¿Deseas crear la base de datos automáticamente si no existe? Yes

🔌 Verificando conexión a la base de datos...

✓ Conexión a la base de datos exitosa
✓ Base de datos mi_proyecto_db lista

🚀 Creando estructura del proyecto...

✓ Backend Laravel configurado correctamente
✓ Frontend Angular configurado correctamente

🎉 ¡Proyecto creado exitosamente!

📂 Estructura del proyecto:
   /ruta/a/mi-proyecto/
   ├── mi-proyecto-backend/ (Laravel)
   └── mi-proyecto-frontend/ (Angular)

? ¿Deseas iniciar los servidores de desarrollo ahora? Yes

🚀 Iniciando servidores de desarrollo...

✓ Backend Laravel corriendo en http://localhost:8000
✓ Frontend Angular corriendo en http://localhost:4200

============================================================

  🎉 ¡Todo está listo!

  Backend (Laravel):  http://localhost:8000
  Frontend (Angular): http://localhost:4200
  Base de datos:      mi_proyecto_db

============================================================

  Presiona Ctrl+C para detener los servidores
```

## 📁 Estructura del Proyecto Generado

```
mi-proyecto/
├── mi-proyecto-backend/          # Backend Laravel
│   ├── app/
│   │   └── Http/
│   │       └── Controllers/
│   │           └── DatabaseController.php
│   ├── config/
│   │   └── cors.php
│   ├── routes/
│   │   └── api.php
│   ├── .env
│   └── ...
│
└── mi-proyecto-frontend/         # Frontend Angular
    ├── src/
    │   ├── app/
    │   │   ├── welcome/
    │   │   │   ├── welcome.component.ts
    │   │   │   ├── welcome.component.html
    │   │   │   └── welcome.component.css
    │   │   └── services/
    │   │       └── api.service.ts
    │   └── environments/
    │       └── environment.ts
    └── ...
```

## 🔌 API Endpoints Incluidos

El backend viene con los siguientes endpoints preconfigurados:

- `GET /api/health` - Verificación de estado de la API
- `GET /api/database/check` - Verificación de conexión a BD
- `GET /api/project/info` - Información del proyecto

### Ejemplo de Respuesta

```json
{
  "success": true,
  "message": "Conexión a la base de datos exitosa",
  "database": "mi_proyecto_db",
  "connection": "active",
  "timestamp": "2024-01-15 10:30:45"
}
```

## 🎨 Página de Bienvenida

Al iniciar el proyecto, verás una página de bienvenida que muestra:

- ✅ Estado de conexión a la base de datos
- 📦 Nombre del proyecto
- 💾 Base de datos configurada
- 🚀 Puertos de los servidores
- 📋 Información del sistema (versiones de Laravel, PHP)
- 📝 Próximos pasos recomendados

## ⚙️ Configuración

### CORS

El backend está preconfigurado para aceptar peticiones desde `http://localhost:4200`. Para modificar esto:

**Backend (`config/cors.php`)**:
```php
'allowed_origins' => ['http://localhost:4200', 'https://tudominio.com'],
```

### Variables de Entorno

**Backend (`.env`)**:
```env
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=mi_proyecto_db
DB_USERNAME=root
DB_PASSWORD=tu_password
```

**Frontend (`src/environments/environment.ts`)**:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  projectName: 'mi-proyecto',
  database: 'mi_proyecto_db'
};
```

## 🛠️ Comandos Útiles

### Backend (Laravel)

```bash
cd mi-proyecto-backend

# Iniciar servidor
php artisan serve

# Ejecutar migraciones
php artisan migrate

# Crear controlador
php artisan make:controller NombreController

# Crear modelo
php artisan make:model NombreModelo -m
```

### Frontend (Angular)

```bash
cd mi-proyecto-frontend

# Iniciar servidor
ng serve

# Crear componente
ng generate component nombre-componente

# Crear servicio
ng generate service nombre-servicio

# Build para producción
ng build --configuration production
```

## 🐛 Solución de Problemas

### Error: "No se pudo conectar a la base de datos"

- Verifica que MySQL/MariaDB esté corriendo
- Confirma las credenciales de la base de datos
- Asegúrate de que el puerto 3306 esté disponible

### Error: "Comando 'composer' no encontrado"

```bash
# Instalar Composer
# Visita: https://getcomposer.org/download/
```

### Error: "Comando 'ng' no encontrado"

```bash
npm install -g @angular/cli
```

### Puerto 8000 o 4200 ya en uso

```bash
# Para Laravel, usar otro puerto:
php artisan serve --port=8001

# Para Angular, usar otro puerto:
ng serve --port=4201
```

## 📚 Recursos Adicionales

- [Documentación de Laravel](https://laravel.com/docs)
- [Documentación de Angular](https://angular.io/docs)
- [Composer](https://getcomposer.org/)
- [Angular CLI](https://angular.io/cli)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Tu Nombre - [@JhimyFuentesRojas](https://github.com/JhimyFuentesRojas/)

## 🙏 Agradecimientos

- Laravel Team
- Angular Team
- Comunidad Open Source

---

**¿Problemas o sugerencias?** [Abre un issue](https://github.com/JhimyFuentesRojas/laravel-angular-starter.git)