# CodeCoach AI

A programming tutor we built for BigRed//Hacks (September 2025). You solve small coding challenges in Python or JavaScript, and an AI tutor helps when you're stuck. It asks you questions about your code instead of just giving you the answer.

There are 8 challenges (beginner to hard), each with 3 hints that get more specific. The hints work even without an API key. There's also a progress page for students and a basic analytics page for instructors.

Built with React, Monaco Editor, Node/Express, MongoDB and the Claude API.

## Running it

You need Node 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at http://localhost:5173 and the API at http://localhost:4000.

If `MONGODB_URI` is empty, the server starts an in-memory MongoDB so you don't need to install anything. It downloads a MongoDB binary the first time, and the data resets when you restart. Demo students and submissions are added automatically so the dashboards aren't empty. On the sign-in screen you can use the "Student" or "Instructor" demo buttons.

To run it as a single server instead:

```bash
npm run build
npm start      # serves everything on http://localhost:4000
```

Tests: `npm test`

## Environment variables

| Variable | What it does |
|---|---|
| `PORT` | API port (default 4000) |
| `MONGODB_URI` | MongoDB connection string. Leave empty for in-memory |
| `ANTHROPIC_API_KEY` | Turns on the AI tutor. Without it the tutor shows as offline and hints still work |
| `ANTHROPIC_MODEL` | Defaults to `claude-opus-5-5` |
| `CODE_RUNNER` | `browser` (default), `docker`, or `disabled` |
| `CLIENT_ORIGIN` | Frontend URL for CORS |

## How code runs

We didn't want to run students' code directly inside the Node server, so there are two options:

- `browser`: code runs in a Web Worker in the student's browser. Python runs through Pyodide. Network access is blocked inside the worker, and it gets killed after 6 seconds. The downside is that the server trusts the test results the browser sends back, so submissions are saved as unverified.
- `docker`: the server runs each submission in a throwaway container with no network, limited memory/CPU, and a read-only filesystem. You need Docker installed with `python:3.12-alpine` and `node:22-alpine` pulled. These submissions are marked as verified.

`disabled` turns the Run and Submit buttons off.

## Notes

- Sign-in is just a name, with no passwords. It was enough for the hackathon demo, but don't use it for anything real.
- The tutor's system prompt tells it never to write the full solution. It also gets the challenge, your current code and your last test results as context.
- The API has rate limits (stricter ones on the tutor and on code runs) and validates requests with zod.
