# --- Build stage: compile server + client -------------------------------
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* tsconfig.base.json ./
COPY server/package.json server/
COPY client/package.json client/

# Install with dev dependencies so the TypeScript/Vite build tooling is present.
RUN npm install --workspaces --include-workspace-root

COPY server server
COPY client client

RUN npm run build -w server
RUN npm run build -w client

# --- Runtime stage: production deps + compiled output only --------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY server/package.json server/package.json
RUN npm install --workspace server --omit=dev --ignore-scripts

COPY --from=build /repo/server/dist server/dist
COPY --from=build /repo/client/dist server/public

# Serve the built client from the same Express process by pointing a static
# path at server/public (wired in server/src/app.ts in a production build).
ENV STATIC_CLIENT_DIR=/app/server/public

EXPOSE 8080
USER node
CMD ["node", "server/dist/index.js"]
