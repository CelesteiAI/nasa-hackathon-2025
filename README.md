# Nasa Hackathon 2025


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

