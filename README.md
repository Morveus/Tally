# Tally - Collaborative Counter App

A self-hostable Next.js collaborative tally counter application that allows teams to track counts in real-time.

## Features

- 🚀 Create instant collaborative counting rooms
- 📊 Real-time synchronization across all participants
- 🎯 Track multiple items per room
- 🔒 No authentication required - share room ID to collaborate
- 📱 Responsive design for mobile and desktop
- 🐳 Docker ready for easy deployment

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tally.git
cd tally
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Docker Deployment

#### Using Docker Compose (Recommended)

1. Build and run with docker-compose:
```bash
docker-compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

#### Using Docker directly

1. Build the Docker image:
```bash
docker build -t morveus/tally .
```

2. Run the container:
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name tally \
  morveus/tally
```

#### Pull from Docker Hub

```bash
docker pull morveus/tally:latest
docker run -d \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  --name tally \
  morveus/tally:latest
```

## Environment Variables

- `DATABASE_URL`: SQLite database path (default: `file:../data/tally.db`)
- `NODE_ENV`: Node environment (development/production)
- `PORT`: Server port (default: 3000)

## Data Persistence

The SQLite database is stored in the `/app/data` directory inside the container. Make sure to mount this directory as a volume to persist data across container restarts.

## Building for Production

To build the application:
```bash
npm run build
```

To build the Docker image:
```bash
npm run docker:build
```

## License

MIT
