# TeamSpeak Auth Bot

A Node.js bot for TeamSpeak that authenticates users via WG (Wargaming.net) and automatically assigns TeamSpeak server groups based on WN8 stats and battle count. The bot also provides a web interface for the authentication flow.

## Features
- Connects to a TeamSpeak server using ServerQuery credentials
- Listens for users joining a specific authorization channel
- Pokes users with a link to authenticate via WG
- Assigns TeamSpeak groups based on:
  - Overall WN8
  - Recent WN8 (with up/down trend)
  - Number of battles
- Automatically seeds and manages server groups and their icons
- Web server for handling the authentication callback and user flow

## Requirements
- Node.js (v18+ recommended)
- TeamSpeak 3 server with ServerQuery access

## Setup
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd teamspeak-auth-bot
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   APPLICATION_ID=your-app-id
   PUBLIC_URL=https://your-public-url
   TEAMSPEAK_HOST=your-ts-host
   TEAMSPEAK_SERVERPORT=9987
   TEAMSPEAK_USERNAME=serverquery-username
   TEAMSPEAK_PASSWORD=serverquery-password
   TEAMSPEAK_NICKNAME=BotNickname
   LOCAL_SERVER_PORT=3000
   ```
   - `PUBLIC_URL` must start with http/https and not end with a slash.
   - `TEAMSPEAK_SERVERPORT` defaults to 9987 if not set.
   - `LOCAL_SERVER_PORT` defaults to 3000 if not set.

4. **Build the project:**
   ```sh
   npm build
   ```
5. **Run the bot:**
   - For production:
     ```sh
     npm start
     ```
   - For development (with hot-reload):
     ```sh
     npm dev
     ```

## Usage
- The bot will connect to your TeamSpeak server and listen for users joining the authorization channel.
- When a user joins, they are poked with a link to authenticate via WG.
- After successful authentication, the bot assigns the appropriate groups based on WN8 and battle count, updates their description, and moves them to the default channel.

## Groups & Icons
The bot seeds the following groups (with icons) on your TeamSpeak server:

### Overall WN8 Groups
- Уникальный Игрок (purple)
- Отличный Игрок (blue)
- Хороший Игрок (green)
- Нормальный Игрок (yellow)
- Игрок Ниже Среднего (orange)
- Твинк либо Плохой Игрок (red)

### Recent WN8 Groups (with trend)
- Фиолет, растет / сливает (purple_up/purple_down)
- Бирюза, растет / сливает (blue_up/blue_down)
- Зеленый, растет / сливает (green_up/green_down)
- Желтый, растет / сливает (yellow_up/yellow_down)
- Рыжий, растет / сливает (orange_up/orange_down)
- Красный, растет / сливает (red_up/red_down)

### Battles Count Groups
- Менее 5к боев
- Более 5к, 10к, 15к, ..., 95к боев

Icons are loaded from the `resources/` directory and automatically uploaded to the server.

## Scripts
- `npm build` — Compile TypeScript to JavaScript
- `npm start` — Run the compiled bot
- `npm dev` — Run in development mode (ts-node)

## License
ISC