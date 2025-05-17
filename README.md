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

Start the API Gateway:
```bash
cd api-gateway
npm run dev
```

Start Other Services (e.g., identity-service):
```bash
cd identity-service
npm run dev
```
> Repeat the steps above for any other services (post-service, search-service, etc.)
