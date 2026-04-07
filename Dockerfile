# -------------------------------
# Base image: Node.js for frontend
# -------------------------------
FROM node:20-slim

# -------------------------------
# Install Python and pip
# ----------a---------------------
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# -------------------------------
# Set working directory
# -------------------------------
WORKDIR /app

# -------------------------------
# Copy Node package files and install dependencies
# -------------------------------
COPY package*.json ./
RUN npm install

# -------------------------------
# Copy Python requirements and install
# -------------------------------
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || pip3 install --no-cache-dir -r requirements.txt

# -------------------------------
# Copy all project files
# -------------------------------
COPY . .

# -------------------------------
# Build React frontend
# -------------------------------
RUN npm run build

# -------------------------------
# Set environment variables
# -------------------------------
ENV PORT=7860
ENV NODE_ENV=production

# -------------------------------
# Expose port
# -------------------------------
EXPOSE 7860

# -------------------------------
# Default command: start Node server
# Override with `docker run <image> python inference.py` for validator
# -------------------------------
CMD ["npm", "start"]
