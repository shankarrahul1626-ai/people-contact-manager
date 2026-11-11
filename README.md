# People — Contact manager

A responsive React contact manager backed by an Express API and MongoDB. Create a private account, save contact details and notes, search your address book, sort contacts, and keep favorites close.

## Requirements

- Node.js 18 or newer
- MongoDB installed locally, or a MongoDB connection string

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Install MongoDB Community Server. For a project-local Windows setup, place the MongoDB server binaries in `server/runtime/mongodb/bin/`. The `npm run dev` command starts MongoDB using `server/data/mongodb` for its database files; these local binaries and database files are excluded from version control.

3. Copy `.env.example` to `.env`, set `MONGODB_URI` to your MongoDB connection string, and replace `AUTH_TOKEN_SECRET` with a random secret of at least 32 characters. To use the local database, leave the example `MONGODB_URI` unchanged.

4. Start MongoDB, the API, and React development server together:

   ```sh
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:5000`.

The Vite development server proxies `/api` requests to the Express API. The API waits for MongoDB to connect before listening; startup errors are printed in the terminal. The first time you open the app, create an account. Passwords are hashed before they are stored, and the session is kept in an HTTP-only cookie. Sign-in and sign-up attempts are rate limited.

## Production build

Run `npm run build` to generate the frontend in `dist/`. Set `MONGODB_URI` in the server environment and run `npm start` to start the API. Serve the generated frontend separately and configure it to send `/api` requests to the API server.

## API

- `GET /api/health` — API and database connection status
- `POST /api/auth/signup` — create an account
- `POST /api/auth/login` — sign in
- `GET /api/auth/me` — get the current account
- `POST /api/auth/logout` — sign out
- `GET /api/contacts` — list the signed-in user's contacts
- `POST /api/contacts` — create a contact for the signed-in user
- `PATCH /api/contacts/:id` — update one of the signed-in user's contacts
- `DELETE /api/contacts/:id` — delete one of the signed-in user's contacts

A contact requires a name and at least one way to reach them (email or phone). Contact fields and request bodies are validated by the API. Existing contacts created before account support are not automatically assigned to any account; back them up before performing any intentional migration.

For production, use HTTPS and a distinct, randomly generated `AUTH_TOKEN_SECRET`. The session cookie is HTTP-only, `SameSite=Strict`, and marked `Secure` in production, so host the frontend and API on the same site and set `CLIENT_ORIGIN` to the frontend's exact origin.
