# 🌌 CelestiAI: Exoplanet Explorer
## Exoplanet Detection Powered by Machine Learning — NASA Space Apps Auckland 2025 (2nd Place)

CelestiAI.vip was collaboratively developed with my hackathon team during the NASA Space Apps Challenge 2025 (Auckland), where we placed 2nd overall.
As Team Lead and ML Engineer, I led the team, allocated tasks, made key project decisions, and designed the exoplanet detection pipeline — including training the Random Forest model and the habitability classifier. I worked closely with the team to integrate these components into a live web deployment, ensuring a functional end-to-end prototype.

# 👩‍🚀 Team & Roles
| Name | Role & Contributions |
|------|--------------------|
| **Aayush Prakash** | Team Lead / ML Engineer — led the team, allocated tasks, made project decisions, designed pipeline, trained Random Forest model and habitability classifier |
| **Mingming Zhang** | ML Support — cleaned code, preprocessed data, assisted with model training |
| **Jonty McBreen-Graham** | Backend, Git & Docker — managed Git workflow, handled technical Git issues, built Flask API bridging back & frontends and built & deployed docker container |
| **Dmitrii Gomazenkov** | Frontend & Visualization — developed UI using Three.js, implemented interactive 3D visualizations |

---           

## 🚀 Features

- Upload **.csv telescope data**  
- Redirect users to a new page for results  
- Process data using an **ML model**  
- Display parsed data in **3D format** using Three.js  

**Optional / Future Features**:  
- Community board for user results  
- Ever-growing 3D map of confirmed exoplanets  

---

<br>

## Tech Stack

**Python, Flask, scikit-learn, pandas, numpy, Three.js, Docker**


## ⚡ Quick Start

**Docker (recommended):**  
```bash
git clone https://github.com/CelesteiAI/nasa-hackathon-2025.git
cd nasa-hackathon-2025
docker build -t nasa-hackathon-2025 .
docker run -d -p 8080 --name celesteiai-nasa-app nasa-hackathon-2025
```

<br>

##  Project Structure

```
nasa-hackathon-2025/
├─ src/
│  ├─ app.py                
│  ├─ static/
│  │  ├─ css/style.css
│  │  └─ js/base.js
│  └─ templates/
│     └─ index.html
├─ trained-models/          
├─ dockerfile              
├─ requirements.txt         
└─ README.md               
```

<br>


# 🌠 Reflection

Leading this project as a first-year Computer Science student was an incredible experience. Together, we built a **fully functional web app with live deployment**.

**Key learnings:**
- **Leadership:** managing tasks and guiding the team under time pressure
- **Machine Learning:** designing and implementing algorithms for real-world data
- **Collaboration:** working across specialized roles (backend, frontend, Git)
- **Execution & Usability:** balancing technical depth with user experience

CelestiAI.vip demonstrates the power of **collaboration, technical skill, and leadership**, while making exoplanet science accessible to everyone.

---

**Built with ❤️ for NASA Hackathon 2025**
