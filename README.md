# Social Media Microservices

## Project Setup

**Install dependencies:**
```bash
npm install
```

**Environment Variables:**
```bash
cp .env.example .env
```

Install Redis (macOS with Homebrew):
```bash
brew install redis
```

Start Redis:
```bash
# Option 1: Start manually
redis-server

# Option 2: Start as background service
brew services start redis
```

## Run the project

cd identity-service
```bash
npm run dev
```
