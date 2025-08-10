# Web Chess

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Java 21](https://img.shields.io/badge/Java-21-orange)
![React 19](https://img.shields.io/badge/React-19-61DAFB)

A real-time multiplayer chess platform with a modern web interface.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## Features
- Real-time chess matches over WebSockets
- Waiting rooms and sharable game codes to invite opponents
- JWT-based authentication with email verification
- ELO rating tracking and updates after each game
- Responsive React interface powered by Tailwind CSS
- RESTful API built with Spring Boot

## Tech Stack
- **Backend:** Java 21, Spring Boot, Spring Security, WebSocket (STOMP), PostgreSQL, Maven
- **Frontend:** React 19, Vite, Tailwind CSS, Chess.js, STOMP.js
- **Communication:** SockJS and STOMP over WebSocket

## Installation
### Prerequisites
- Java 21
- Node.js and npm
- PostgreSQL

### Backend
```bash
cd chess/apps/demo1
# configure environment variables in .env
./mvnw spring-boot:run
```

Sample `.env` file:
```ini
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/chess
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=secret
JWT_SECRET_KEY=your_secret_key
SUPPORT_EMAIL=you@example.com
APP_PASSWORD=app_password
```

### Frontend
```bash
cd chess/apps/frontend
npm install
npm run dev
```
The site will be available at http://localhost:5173.

## Usage
1. Register a new account and verify it via email.
2. Log in and create a waiting room or join an existing one using its game code.
3. Share the game code with an opponent and wait for them to join.
4. Play chess in real time. Moves are synchronized for all players.
5. When the match ends, ELO ratings are updated automatically.

## Screenshots
![chess-game](https://i.postimg.cc/Sxk3n0XJ/unnamed-6.png)
![chess-game-process](https://i.postimg.cc/ncvNVVhy/unnamed-7.png)
![waiting-room](https://i.postimg.cc/15xLZVs0/unnamed-8.png)
![game-result](https://i.postimg.cc/bYSKM9cN/unnamed-5.png)

## Contributing
Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License
This project is licensed under the [MIT License](LICENSE).
