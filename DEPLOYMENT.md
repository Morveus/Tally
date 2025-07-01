# Tally Deployment Guide

## Quick Start

### Option 1: Using Pre-built Docker Image

1. Pull the image:
```bash
docker pull morveus/tally:latest
```

2. Create a data directory:
```bash
mkdir -p /path/to/tally-data
```

3. Run the container:
```bash
docker run -d \
  --name tally \
  -p 3000:3000 \
  -v /path/to/tally-data:/app/data \
  --restart unless-stopped \
  morveus/tally:latest
```

### Option 2: Build from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tally.git
cd tally
```

2. Build the Docker image:
```bash
sudo ./build-docker.sh
```

3. The image will be saved to `/mnt/unas1/Temp/tally-docker-image.tar.gz`

4. Load and run on target system:
```bash
docker load < tally-docker-image.tar.gz
docker run -d \
  --name tally \
  -p 3000:3000 \
  -v /path/to/tally-data:/app/data \
  --restart unless-stopped \
  morveus/tally:latest
```

## Production Deployment

### Using Docker Compose

1. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  tally:
    image: morveus/tally:latest
    container_name: tally
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

2. Start the service:
```bash
docker-compose up -d
```

### Using Kubernetes

Save this as `tally-k8s.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tally
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: tally-data
  namespace: tally
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tally
  namespace: tally
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tally
  template:
    metadata:
      labels:
        app: tally
    spec:
      containers:
      - name: tally
        image: morveus/tally:latest
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: data
          mountPath: /app/data
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: tally-data
---
apiVersion: v1
kind: Service
metadata:
  name: tally
  namespace: tally
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: tally
```

Deploy with:
```bash
kubectl apply -f tally-k8s.yaml
```

## Reverse Proxy Configuration

### Nginx

```nginx
server {
    listen 80;
    server_name tally.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik

```yaml
http:
  routers:
    tally:
      rule: "Host(`tally.example.com`)"
      service: tally
      tls:
        certResolver: letsencrypt
  services:
    tally:
      loadBalancer:
        servers:
          - url: "http://localhost:3000"
```

## SSL/HTTPS

For production deployments, always use HTTPS. The easiest way is to use a reverse proxy like Nginx or Traefik with Let's Encrypt for automatic SSL certificates.

## Monitoring

Monitor the application health by checking:
- HTTP endpoint: `http://your-domain:3000`
- Container logs: `docker logs tally`
- Database file: Check that `/app/data/tally.db` exists and is being updated

## Backup

To backup your data:
```bash
# Stop the container
docker stop tally

# Backup the database
cp /path/to/tally-data/tally.db /path/to/backup/tally-$(date +%Y%m%d).db

# Start the container
docker start tally
```

## Troubleshooting

1. **Container won't start**: Check logs with `docker logs tally`
2. **Data not persisting**: Ensure the volume mount is correct
3. **Can't access the app**: Check firewall rules for port 3000
4. **Real-time updates not working**: Ensure your reverse proxy supports WebSocket/SSE connections