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

- **Frontend:** Angular 19 (Standalone Components, RxJS, SCSS)
- **Backend:** Go (API-Go)
- **Infrastructure:** Docker & Docker Compose (Hot Reload enabled for development)

## 🚦 Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine.

### Running the App

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/typer.git
   cd typer
   ```

2. Start the environment:
   ```bash
   docker-compose up --build
   ```

3. Open your browser:
   - **Frontend:** [http://localhost:4200](http://localhost:4200)
   - **API:** [http://localhost:8080](http://localhost:8080)

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
