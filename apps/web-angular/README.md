# Typing Code Learn

Aplicación para practicar mecanografía con código de programación.

## 🚀 Cómo ejecutar el Frontend localmente

### Prerrequisitos

- Node.js 18+ 
- npm 9+

### Instalación y ejecución

1. **Navegar al directorio del frontend:**
   ```bash
   cd apps/web-angular
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run start
   ```

4. **Abrir en navegador:**
   
   La aplicación estará disponible en: **http://localhost:4200**

---

## 📁 Estructura del Frontend

```
apps/web-angular/
├── src/
│   ├── app/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la app
│   │   ├── services/       # Servicios (API, lógica)
│   │   ├── models/         # Interfaces TypeScript
│   │   └── app.routes.ts   # Configuración de rutas
│   └── styles.scss         # Estilos globales
└── angular.json            # Configuración Angular
```

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run start` | Servidor de desarrollo (con hot reload) |
| `npm run build` | Build de producción |
| `npm run test` | Ejecutar tests |

---

## ⚠️ Problemas conocidos

- **Warnings de CSS:** El build muestra warnings de nesting CSS en `typing-editor.component.ts`. No afectan el funcionamiento pero se recomienda corregirlos.
- **Deprecación Sass:** `lighten()` está deprecado en `styles.scss:55`.
