# Exoplanet Detection Powered by Machine Learning — NASA Space Apps Auckland 2025 (2nd Place)

This project was built during the NASA Space Apps Challenge 2025 (Auckland), where our team placed 2nd overall.
We focused on creating a fully functional prototype, hosted live with a custom domain, rather than just a concept presentation.

## Features

List of features to aim for:

- Upload .csv telescope data
    - User is redirected to new page
- Process data using a ml model
- User requests parsed data to be displayed in a 3d format (three.js)

- **OPTIONAL:**
    - Add community board of other users results
    - Create a (ever growing) 3D map of confirmed exoplanets


<br>

### File structure

```
nasa-hackathon-2025/
├─ src/                      # source code files
|  ├─ app.py                 # Flask app entry point
|  ├─ models                 # ML modles
|  ├─ static                 # Static file for UI (.js, .css & any image) 
|  └─ templates              # HTML for UI
├─ models/                   # (Planned) Saved ML models (.pkl, .joblib, etc.)
├─ .gitignore               # Git exclusions for data, models, etc.
├─ LICENSE                  # MIT License
├─ README.md                # Project overview and setup instructions
└─ requirements.txt         # Python dependencies
```

<br>

### Git workflow

- When we add a new feature create a new branch for that feature
    - e.g. ml-integration, three-js
- Keep to the branching workflow
    - Shouldn't need to commit to main branch
- Before uploading your branch to remote, git pull to make sure your up to date
    - Same before you start working on a new feature aswell

<br>

---

## 🚀 Setup & Deployment

### Prerequisites

- **Docker** (recommended) or Python 3.11+
- **Git** for cloning the repository
- **macOS/Linux/Windows** with terminal access

<br>

### Option 1: Quick Start with Docker (Recommended)

#### 1. Install Docker

**macOS:**
```bash
# Using Homebrew and Colima (lightweight Docker alternative)
brew install colima docker
colima start
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
sudo systemctl start docker
```

**Windows:**
- Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### 2. Clone the Repository

```bash
git clone https://github.com/your-username/nasa-hackathon-2025.git
cd nasa-hackathon-2025
```

#### 3. Build the Docker Image

```bash
docker build -t nasa-hackathon-2025 .
```

This will:
- Pull Python 3.11-slim base image
- Install all dependencies from `requirements.txt`
- Copy project files into the container
- Create an image tagged as `nasa-hackathon-2025`

#### 4. Run the Container

```bash
docker run -d -p 8000:5000 --name nasa-app nasa-hackathon-2025
```

**Flags explained:**
- `-d` - Run in detached mode (background)
- `-p 8000:5000` - Map port 8000 (host) to 5000 (container)
- `--name nasa-app` - Name the container for easy reference

#### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

Or test the health endpoint:
```bash
curl http://localhost:8000/health
```

<br>

### Option 2: Local Development without Docker

#### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Run the Application

```bash
python src/app.py
```

The app will be available at: `http://localhost:5000`

<br>

### 🔧 Useful Docker Commands

#### Container Management

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop the container
docker stop nasa-app

# Start the container
docker start nasa-app

# Restart the container
docker restart nasa-app

# Remove the container
docker rm nasa-app

# Remove container and image
docker rm nasa-app && docker rmi nasa-hackathon-2025
```

#### Logs & Debugging

```bash
# View logs
docker logs nasa-app

# Follow logs in real-time
docker logs -f nasa-app

# Execute commands inside container
docker exec -it nasa-app /bin/bash

# Inspect container details
docker inspect nasa-app
```

#### Rebuild After Changes

```bash
# Quick rebuild and restart
docker stop nasa-app && docker rm nasa-app && \
docker build -t nasa-hackathon-2025 . && \
docker run -d -p 8000:5000 --name nasa-app nasa-hackathon-2025
```

#### Image Management

```bash
# List all images
docker images

# Remove unused images
docker image prune

# View image size
docker images nasa-hackathon-2025
```

<br>

### 🐛 Troubleshooting

#### Port Already in Use

If port 5000 or 8000 is already in use:
```bash
# Use a different port (e.g., 9000)
docker run -d -p 9000:5000 --name nasa-app nasa-hackathon-2025
```

#### Docker Not Found

```bash
# macOS: Check if Colima is running
colima status

# Start Colima if stopped
colima start
```

#### Permission Denied (Linux)

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

#### Container Exits Immediately

```bash
# Check logs for errors
docker logs nasa-app

# Run in foreground to see output
docker run -p 8000:5000 nasa-hackathon-2025
```

<br>

### 📦 Project Structure After Build

```
nasa-hackathon-2025/
├─ src/
│  ├─ app.py                 # ✅ Flask application
│  ├─ static/
│  │  ├─ css/style.css
│  │  └─ js/base.js
│  └─ templates/
│     └─ index.html
├─ trained-models/           # ✅ Created for ML models
├─ dockerfile               # ✅ Docker configuration
├─ requirements.txt         # ✅ Python dependencies
└─ README.md                # ✅ This file
```

<br>

### 🌐 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application page |
| `/health` | GET | Health check endpoint |

<br>

### 💡 Development Tips

1. **Hot Reload:** Use `debug=True` in Flask for auto-reload during development
2. **Environment Variables:** Add `.env` file for configuration
3. **Volume Mounting:** Mount local files for development without rebuild:
   ```bash
   docker run -d -p 8000:5000 -v $(pwd)/src:/app/src --name nasa-app nasa-hackathon-2025
   ```

<br>

### 🎯 Next Steps

- [ ] Implement CSV upload functionality
- [ ] Integrate ML model for data processing
- [ ] Add Three.js 3D visualization
- [ ] Create community board feature
- [ ] Build exoplanet 3D map

<br>

---

**Built with ❤️ for NASA Hackathon 2025**
