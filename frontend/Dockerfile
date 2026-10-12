FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer cache)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
