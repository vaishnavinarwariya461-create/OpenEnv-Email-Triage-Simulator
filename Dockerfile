# Use Node.js base image for the full-stack app
FROM node:20-slim
RUN echo "Rebuild trigger v2"
# Install Python and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
# Use --break-system-packages for newer Python versions
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages || pip3 install --no-cache-dir -r requirements.txt

# Copy all files
COPY . .

# Build the React app
RUN npm run build

# Set environment variables
ENV PORT=7860
ENV NODE_ENV=production

# Expose the port
EXPOSE 7860

# Start the Express server
CMD ["npm", "start"]
