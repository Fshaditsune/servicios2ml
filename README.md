# Servicios 2ML – Guía de Instalación y Configuración

## Estructura del proyecto
```
servicios2ml/
├── server.js           ← Backend Node.js (API + servidor)
├── package.json        ← Dependencias
├── .env.example        ← Plantilla de variables de entorno
├── .gitignore
└── public/
    ├── index.html      ← Página pública (usuarios)
    ├── admin.html      ← Login del administrador
    └── inventario.html ← Panel de gestión
```

## Cuenta admin por defecto
- Usuario: admin
- Contraseña: admin

---

## PASO 1 – Crear nueva base de datos en Railway

1. Ve a https://railway.app y entra a tu cuenta
2. En el dashboard haz clic en **"New Project"**
3. Selecciona **"Provision PostgreSQL"**
4. Railway creará una nueva base de datos PostgreSQL
5. Haz clic en la base de datos → pestaña **"Variables"**
6. Copia el valor de **DATABASE_URL** (tiene este formato):
   `postgresql://postgres:PASSWORD@HOST:PORT/railway`

## PASO 2 – Crear archivo .env

En la carpeta del proyecto crea un archivo llamado `.env` (sin extension):
```
DATABASE_URL=postgresql://postgres:TU_PASSWORD@TU_HOST:TU_PUERTO/railway
SESSION_SECRET=servicios2ml_clave_2024
PORT=3000
```

## PASO 3 – Instalar dependencias

```bash
npm install
```

## PASO 4 – Ejecutar el proyecto localmente

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

La primera vez que corras el servidor, automáticamente:
- Creará las tablas en la base de datos
- Creará el usuario admin
- Insertará los 14 servicios iniciales

## PASO 5 – Subir a GitHub

```bash
git init
git add .
git commit -m "Primer commit - Servicios 2ML"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/servicios2ml.git
git push -u origin main
```

## PASO 6 – Deploy en Railway

1. En Railway, en tu proyecto haz clic en **"New Service"**
2. Selecciona **"GitHub Repo"**
3. Elige el repositorio `servicios2ml`
4. Ve a la pestaña **"Variables"** del servicio y agrega:
   - `DATABASE_URL` = (copia de tu PostgreSQL de Railway)
   - `SESSION_SECRET` = servicios2ml_clave_2024
   - `PORT` = 3000
5. Railway hará el deploy automáticamente
6. Ve a **"Settings" → "Networking" → "Generate Domain"** para obtener tu URL pública

---

## URLs de la aplicación

| Página | URL |
|--------|-----|
| Página pública | `/` |
| Login admin | `/admin` |
| Inventario | `/inventario` |

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/servicios | Todos los servicios activos (público) |
| GET | /api/servicios/:codigo | Detalle de un servicio |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/logout | Cerrar sesión |
| GET | /api/admin/servicios | Todos los servicios (admin) |
| POST | /api/admin/servicios | Crear servicio |
| PUT | /api/admin/servicios/:codigo | Editar servicio |
| DELETE | /api/admin/servicios/:codigo | Eliminar servicio (soft delete) |
