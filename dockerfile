FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY src/ ./src/

# Copy the trained model
COPY Models/ ./Models/

# Copy data directory (if needed at runtime)
COPY data/ ./data/

# Create necessary directories
RUN mkdir -p uploads results

EXPOSE 8080
CMD ["python", "src/app.py"]