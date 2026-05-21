# Local AI Backend

This backend lets the portfolio prototypes call the relay API safely without putting the API key in GitHub or browser JavaScript.

## Run Locally

Set the key only in your local shell:

```bash
export AI_API_KEY="your_local_key_here"
export AI_BASE_URL="https://super-relay.byted.org/v1"
export AI_MODEL="ark/k2"
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8787
```

Then open the portfolio. If the local backend is running, prototypes call it. If it is not running, they keep using the built-in mock data.

## Security

- Never put the API key in frontend JavaScript.
- Never commit `.env` or shell history containing the key.
- Use `backend/.env.example` only as a template.
