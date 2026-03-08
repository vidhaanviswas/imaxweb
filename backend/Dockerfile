FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src

RUN npm ci
RUN npm run build
RUN npx prisma generate

EXPOSE 4000

CMD ["node", "dist/index.js"]
