#!/bin/bash
# Build script for Tally Docker image

echo "Building Tally Docker image..."
docker build -t morveus/tally .

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo ""
    echo "Saving image to /mnt/unas1/Temp/..."
    docker save morveus/tally:latest | gzip > /mnt/unas1/Temp/tally-docker-image.tar.gz
    
    if [ $? -eq 0 ]; then
        echo "Docker image saved to: /mnt/unas1/Temp/tally-docker-image.tar.gz"
        echo ""
        echo "To load this image on another system:"
        echo "  docker load < /mnt/unas1/Temp/tally-docker-image.tar.gz"
        echo ""
        echo "To run the container:"
        echo "  docker run -d -p 3000:3000 -v /path/to/data:/app/data morveus/tally:latest"
    else
        echo "Failed to save image to /mnt/unas1/Temp/"
    fi
else
    echo "Build failed!"
    exit 1
fi