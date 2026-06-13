FROM node:24-alpine
WORKDIR /app

# Install runtime dependencies (includes tsx, which runs the TypeScript directly).
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "npm", "start" ]
