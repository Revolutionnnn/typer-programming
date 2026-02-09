# Arquitectura del Proyecto Typer

## Visión General
Typer es una plataforma interactiva de código abierto diseñada específicamente para programadores. Su objetivo es ayudar tanto a desarrolladores experimentados a aumentar su velocidad de escritura como a principiantes a familiarizarse con la sintaxis de nuevos lenguajes, proporcionando un entorno práctico para practicar la codificación a través de la memoria muscular.

## Filosofía del Proyecto
Typer se basa en la creencia de que la educación y las herramientas para lograrla deben ser libres, abiertas y accesibles para todos. Bajo la licencia **AGPL-3.0**, este proyecto fomenta la colaboración, la transparencia y la mejora colectiva de las herramientas de aprendizaje.

## Tecnologías Principales (Tech Stack)

### Frontend
- **Framework:** Angular 19
- **Características:** Componentes Standalone, RxJS, SCSS
- **Ubicación:** `apps/web-angular/`

### Backend
- **Lenguaje:** Go (Golang)
- **Servicio:** API-Go
- **Ubicación:** `apps/api-go/`

### Infraestructura
- **Contenedores:** Docker y Docker Compose
- **Servidor Web:** Nginx (dentro de los contenedores para producción/stage)
- **Desarrollo:** Hot Reload habilitado para una experiencia de desarrollo fluida.

## Estructura del repositorio

El repositorio está organizado como un monorepo con las siguientes carpetas principales:

- **`apps/`**: Contiene las aplicaciones principales.
  - `api-go/`: El servicio backend construido con Go.
  - `web-angular/`: La aplicación frontend construida con Angular 19.
- **`content/`**: Archivos de lecciones basados en JSON, categorizados por lenguaje de programación. Aprendizaje soportado actualmente:
  - `go/`
  - `javascript/`
  - `python/`
- **`packages/`**: Paquetes compartidos y utilidades.
  - `lesson-schema/`: Definición de esquema compartido para las lecciones, asegurando consistencia en los datos.
- **`docker/`**: Archivos Docker y configuraciones de Nginx necesarios para la contenerización y despliegue.

## Guía de Inicio (Desarrollo Local)

### Prerrequisitos
- Docker y Docker Compose instalados en tu máquina.

### Ejecución de la Aplicación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/revolutionnnn/typer-programming.git
   cd typer-programming
   ```

2. **Iniciar el entorno:**
   ```bash
   docker-compose up --build
   ```

3. **Acceder a la aplicación:**
   - **Frontend:** [http://localhost:4200](http://localhost:4200)
   - **API:** [http://localhost:8080](http://localhost:8080)

## Contribución

Damos la bienvenida a contribuciones de todos. El flujo de trabajo estándar es:

1. Hacer un Fork del proyecto.
2. Crear una rama para tu funcionalidad (`git checkout -b feature/AmazingFeature`).
3. Hacer commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4. Hacer push a la rama (`git push origin feature/AmazingFeature`).
5. Abrir un Pull Request.

## Licencia
Distribuido bajo la Licencia Pública General Affero de GNU v3.0 (GNU AGPLv3). Consulta el archivo `LICENSE` para más información.
