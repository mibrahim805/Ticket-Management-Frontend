# Taskline frontend

React and TypeScript frontend for the Ticket Management System backend.

## Development

```bash
npm install
npm run dev
```

The Vite development server proxies `/api` requests to the FastAPI server at
`http://127.0.0.1:7000`. Set `VITE_API_URL` in `.env` when using another API
base URL.

## Current features

- JWT login and protected routes
- Workspace layout and dashboard shell
- Projects list loaded from `GET /projects`
- Project creation for authorized users through `POST /projects`
