# XAI-Assistant-UI
[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/LaurenceC3HF/XAI-Assistant-UI-AI-OpenAI)

## Development

1. Start the OpenAI proxy server (for local development): 

```bash
npm run server
```

2. In a separate terminal start Vite:

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to the local Node server.

## Deployment on Vercel

The `/api/openai` endpoint is also implemented as a Vercel serverless
function in `api/openai.js`. When deploying to Vercel, no separate Node
server is required—just define `OPENAI_API_KEY` in the project settings
and the function will handle unscripted queries.
