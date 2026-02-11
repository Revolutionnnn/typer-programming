# Typer: Master Coding by Typing

Typer is an open-source, interactive typing platform designed specifically for programmers. Whether you're a seasoned developer looking to increase your typing speed or a beginner wanting to familiarize yourself with the syntax of a new language, Typer provides a hands-on environment to practice coding through muscle memory.

## 🌟 The Spirit of Software Libre

Typer is built on the belief that education and the tools to achieve it should be free, open, and accessible to everyone. In the spirit of the **AGPL-3.0 license**, this project encourages collaboration, transparency, and the collective improvement of our learning tools. Anyone is welcome to contribute, modify, and host their own version to help the community grow.

## 🚀 Why Typer?

- **Real Code Context:** Practice with actual snippets from popular languages (Go, TypeScript, etc.) instead of random words.
- **Language Immersion:** Learn syntax and common patterns as you type.
- **Gamified Experience:** Track your progress with lives, streaks, and completion badges.
- **Privacy First:** Your progress is yours. Host it locally or on your own server.
- **Multi-language Support:** Built-in i18n support for English and Spanish speakers.

## 🛠️ Tech Stack

- **Frontend:** Angular 19 (Standalone Components, Signals, SCSS)
- **Backend:** Go (Chi Router, JWT Auth)
- **Database:** PostgreSQL (with automated schema migration)
- **Infrastructure:** Docker & Podman Compose (Ready for Development and Production)

## 🚦 Getting Started

### Prerequisites

- Podman/Docker and Compose installed on your machine.
- `make` (optional, but recommended).

### Commands (Makefile)

The project includes a `Makefile` to simplify environment management:

- **Development** (Hot-reload, local ports):
  ```bash
  make dev
  ```
- **Production** (Optimized builds, Nginx, PostgreSQL):
  ```bash
  make prod
  ```
- **Stop everything**:
  ```bash
  make down
  ```

### Manual Run

1. Clone the repository and navigate to the folder.
2. For Development:
   ```bash
   podman compose --env-file .env.dev up --build
   ```
3. For Production:
   ```bash
   cp .env.prod.example .env.prod  # Fill in your secrets!
   podman compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

### Access

- **Frontend:** `http://localhost:4200` (Dev) / `http://localhost:80` (Prod)
- **API:** `http://localhost:8080/api/v1`

## 📂 Project Structure

- `apps/api-go/`: Backend service built with Go.
- `apps/web-angular/`: Frontend application built with Angular 19.
- `content/`: JSON-based lesson files categorized by programming language.
- `packages/lesson-schema/`: Shared schema definition for lessons.
- `docker/`: Dockerfiles and Nginx configurations.

## 🤝 Contributing

We welcome contributions from everyone! Whether it's adding new lessons, fixing bugs, or suggesting features:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the **GNU Affero General Public License v3.0**. See `LICENSE` for more information.

---
*Code is a craft. Practice it.*
