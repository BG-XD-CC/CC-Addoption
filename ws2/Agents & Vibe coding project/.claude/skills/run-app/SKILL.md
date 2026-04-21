---
name: run-app
description: Run the Next.js development server or production build. Use this skill whenever the user asks to start, run, launch, or serve the application — even if they just say "run it", "start the app", "spin it up", or mention a port number. Also use when asked to restart the server or run on a different port.
---

## IMPORTANT: No questions, no exploration, no confirmation. Just run it.

Do NOT ask the user anything. Do NOT read files. Do NOT explore the directory. Execute immediately.

## Step 1: Check if already running on port 3000

```bash
lsof -ti:3000
```

If a process is already listening on port 3000, the app is already running. Tell the user "App is already running at http://localhost:3000" and stop. Do NOT kill it. Do NOT restart it.

## Step 2: Start the dev server (only if port 3000 is free)

Run this exact command in the background:

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH" && npm run dev -- -p 3000
```

Wait a few seconds, then read the output to confirm it started. Report "App is running at http://localhost:3000".

## If the user specifies a different port

Replace 3000 with their port in both the check and the start command.

## Production Build

Only if the user explicitly asks for production:

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH" && npm run build && npm run start -- -p 3000
```

## Database

Only if the user explicitly asks to seed or reset:

```bash
export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH" && npx prisma db seed
```
