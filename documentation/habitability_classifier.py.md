# habitability_classifier.py - Exoplanet Habitability Analysis Module

## Overview
This module provides a comprehensive framework for analyzing the habitability potential of confirmed exoplanets. It implements scientific criteria based on Earth-like conditions and provides detailed classification, visualization, and reporting capabilities.

## Detailed Code Breakdown

### 1. Imports and Dependencies
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
```

**Purpose**: Import essential libraries for:
- Data manipulation (`pandas`, `numpy`)
- Visualization (`matplotlib`, `seaborn`)
- Machine learning (`sklearn`)
- Model persistence (`joblib`)

### 2. Class Definition and Initialization
```python
class ExoplanetHabitabilityClassifier:
    def __init__(self, data_path):
        """
        Initialize habitability classifier for exoplanets
        
        Args:
            data_path (str): Path to the cumulative_exoplanets.csv file
        """
        self.data_path = data_path
        self.df = None
        self.habitability_model = None
```

**Purpose**: Initialize the classifier with:
- `data_path`: Path to the NASA Kepler exoplanet dataset
- `df`: Will store the full dataset
- `habitability_model`: Reserved for future ML model implementation

### 3. Data Loading and Filtering
```python
def load_data(self):
    """Load and filter confirmed exoplanets"""
    print("Loading exoplanet data for habitability analysis...")
    self.df = pd.read_csv(self.data_path, comment='#')
    
    # Focus on confirmed exoplanets only
    self.confirmed = self.df[self.df['koi_disposition'] == 'CONFIRMED'].copy()
    print(f"Total confirmed exoplanets: {len(self.confirmed)}")
    
    return self.confirmed
```

**Purpose**: 
- Load NASA Kepler Object of Interest (KOI) dataset
- Filter to only confirmed exoplanets (excludes candidates and false positives)
- Handle comment lines in NASA data format
- Provides quality assurance by focusing on validated discoveries

### 4. Habitability Criteria Definition
```python
def define_habitability_criteria(self):
    """
    Define scientific criteria for habitability based on Earth-like conditions
    """
    self.habitability_criteria = {
        'earth_like_radius': {
            'min': 0.5,   # Minimum to retain atmosphere
            'max': 2.0,   # Maximum before becoming gas giant
            'feature': 'koi_prad',
            'weight': 0.3
        },
        'habitable_temperature': {
            'min': 200,   # Above freezing point of water
            'max': 350,   # Below boiling point of water
            'feature': 'koi_teq',
            'weight': 0.4  # Most important factor
        },
        'appropriate_insolation': {
            'min': 0.3,   # Minimum for liquid water
            'max': 1.7,   # Maximum before runaway greenhouse
            'feature': 'koi_insol',
            'weight': 0.2
        },
        'reasonable_orbital_period': {
            'min': 10,    # Not tidally locked
            'max': 500,   # Not too cold
            'feature': 'koi_period',
            'weight': 0.1
        }
    }
```

**Purpose**: Define scientifically-based habitability criteria:

**Earth-like Radius (30% weight)**:
- **Minimum 0.5 R⊕**: Small enough planets cannot retain substantial atmospheres
- **Maximum 2.0 R⊕**: Larger planets likely become gas giants with no solid surface
- **Feature**: `koi_prad` (planet radius in Earth radii)

**Habitable Temperature (40% weight - most important)**:
- **Range 200-350K**: Allows liquid water to exist on surface
- **Below 200K**: Too cold, water freezes
- **Above 350K**: Too hot, water boils away
- **Feature**: `koi_teq` (equilibrium temperature)

**Appropriate Insolation (20% weight)**:
- **Range 0.3-1.7× Earth flux**: Optimal energy from host star
- **Below 0.3×**: Too little energy, frozen surface
- **Above 1.7×**: Too much energy, runaway greenhouse effect
- **Feature**: `koi_insol` (stellar flux relative to Earth)

**Reasonable Orbital Period (10% weight)**:
- **Range 10-500 days**: Avoids extreme orbital configurations
- **Below 10 days**: Likely tidally locked, extreme temperature gradients
- **Above 500 days**: Too far from star, too cold
- **Feature**: `koi_period` (orbital period in days)

### 5. Habitability Score Calculation
```python
def calculate_habitability_score(self, row):
    """
    Calculate weighted habitability score (0-1)
    """
    total_score = 0
    total_weight = 0
    
    for criterion, params in self.habitability_criteria.items():
        feature = params['feature']
        weight = params['weight']
        
        if pd.notna(row[feature]):
            value = row[feature]
            # Check if value is within habitable range
            if params['min'] <= value <= params['max']:
                # Calculate how close to optimal (center of range)
                optimal = (params['min'] + params['max']) / 2
                range_size = params['max'] - params['min']
                deviation = abs(value - optimal) / (range_size / 2)
                criterion_score = max(0, 1 - deviation)  # Linear decay from center
            else:
                criterion_score = 0
            
            total_score += criterion_score * weight
            total_weight += weight
    
    return total_score / total_weight if total_weight > 0 else 0
```

**Purpose**: Calculate a comprehensive habitability score (0-1) for each planet

**Algorithm**:
1. **Iterate through each criterion** and check if the planet has data for that feature
2. **Range Check**: If value is outside habitable range, score = 0
3. **Optimal Scoring**: If within range, calculate how close to optimal (center of range)
4. **Linear Decay**: Score decreases linearly as value moves away from optimal
5. **Weighted Average**: Combine all criterion scores using defined weights
6. **Missing Data Handling**: Only includes criteria with available data

### 6. Habitability Classification
```python
def classify_habitability(self, row):
    """
    Classify planets into habitability categories
    """
    score = self.calculate_habitability_score(row)
    
    if score >= 0.7:
        return 'highly_habitable'
    elif score >= 0.5:
        return 'potentially_habitable'
    elif score >= 0.3:
        return 'marginally_habitable'
    else:
        return 'not_habitable'
```

**Purpose**: Convert numerical habitability scores into categorical classifications

**Classification Thresholds**:
- **Highly Habitable (≥0.7)**: Excellent conditions for life, similar to Earth
- **Potentially Habitable (≥0.5)**: Good conditions, worth detailed study
- **Marginally Habitable (≥0.3)**: Some favorable conditions, but challenges exist
- **Not Habitable (<0.3)**: Conditions too extreme for Earth-like life

### 7. Main Analysis Function
```python
def analyze_habitability(self):
    """
    Perform comprehensive habitability analysis
    """
    print("\n" + "="*60)
    print("EXOPLANET HABITABILITY ANALYSIS")
    print("="*60)
    
    # Define criteria
    self.define_habitability_criteria()
    
    # Calculate scores and classifications
    self.confirmed['habitability_score'] = self.confirmed.apply(
        self.calculate_habitability_score, axis=1
    )
    self.confirmed['habitability_class'] = self.confirmed.apply(
        self.classify_habitability, axis=1
    )
    
    # Results summary
    class_counts = self.confirmed['habitability_class'].value_counts()
    print("\n🌍 HABITABILITY CLASSIFICATION RESULTS:")
    for class_name, count in class_counts.items():
        percentage = (count / len(self.confirmed)) * 100
        print(f"  {class_name:20}: {count:4d} planets ({percentage:5.1f}%)")
    
    return self.confirmed
```

**Purpose**: Execute the complete habitability analysis pipeline
- Apply scoring function to all confirmed exoplanets
- Generate classification for each planet
- Provide statistical summary of results

### 8. Top Candidates Identification
```python
def get_top_habitable_candidates(self, n=10):
    """
    Get top habitable planet candidates
    """
    top_candidates = self.confirmed.nlargest(n, 'habitability_score')
    
    print(f"\n🏆 TOP {n} MOST HABITABLE EXOPLANET CANDIDATES:")
    print("-" * 80)
    
    for i, (_, planet) in enumerate(top_candidates.iterrows(), 1):
        print(f"\n{i:2d}. {planet['kepoi_name']} ({planet.get('kepler_name', 'No name')})")
        print(f"    Habitability Score: {planet['habitability_score']:.3f}")
        print(f"    Classification: {planet['habitability_class']}")
        print(f"    Radius: {planet['koi_prad']:.2f} Earth radii")
        print(f"    Temperature: {planet['koi_teq']:.0f} K")
        print(f"    Insolation: {planet['koi_insol']:.2f} Earth flux")
        print(f"    Orbital Period: {planet['koi_period']:.1f} days")
    
    return top_candidates
```

**Purpose**: Identify and display the most promising habitable exoplanet candidates
- Ranks planets by habitability score
- Provides detailed characteristics for each top candidate
- Includes both KOI designation and Kepler name when available

### 9. Visualization Functions
```python
def visualize_habitability(self):
    """
    Create visualizations for habitability analysis
    """
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
```

**Purpose**: Generate comprehensive visualizations of habitability analysis

**Four-Panel Visualization**:

1. **Habitability Score Distribution**: Histogram showing how habitability scores are distributed across all confirmed exoplanets

2. **Habitability Class Counts**: Bar chart showing number of planets in each habitability category

3. **Temperature vs Radius Plot**: 
   - Scatter plot with habitable planets highlighted in green
   - Shows the "sweet spot" for habitability
   - Includes habitable zone boundaries

4. **Insolation vs Period Plot**:
   - Shows relationship between stellar energy received and orbital characteristics
   - Log scale for insolation to handle wide range of values
   - Highlights habitable candidates

### 10. Comprehensive Reporting
```python
def create_habitability_report(self):
    """
    Generate a comprehensive habitability report
    """
    print("\n" + "="*60)
    print("🌍 EXOPLANET HABITABILITY ASSESSMENT REPORT")
    print("="*60)
    
    total_confirmed = len(self.confirmed)
    highly_habitable = len(self.confirmed[self.confirmed['habitability_class'] == 'highly_habitable'])
    potentially_habitable = len(self.confirmed[self.confirmed['habitability_class'] == 'potentially_habitable'])
    marginally_habitable = len(self.confirmed[self.confirmed['habitability_class'] == 'marginally_habitable'])
```

**Purpose**: Generate a detailed summary report including:
- Statistical breakdown of habitability classifications
- Percentage analysis of habitable vs non-habitable planets
- Key scientific findings
- Highlighted characteristics of the most promising candidate

### 11. Results Persistence
```python
def save_results(self, output_path='../results/habitability_results.csv'):
    """
    Save habitability analysis results
    """
    # Select key columns for output
    output_cols = [
        'kepid', 'kepoi_name', 'kepler_name',
        'habitability_score', 'habitability_class',
        'koi_prad', 'koi_teq', 'koi_insol', 'koi_period',
        'koi_steff', 'koi_srad', 'koi_smass'
    ]
    
    results = self.confirmed[output_cols].copy()
    results = results.sort_values('habitability_score', ascending=False)
    
    results.to_csv(output_path, index=False)
    print(f"\n💾 Results saved to: {output_path}")
    
    return results
```

**Purpose**: Save analysis results to CSV file for further use
- Selects essential columns for output
- Sorts by habitability score (best candidates first)
- Provides clean dataset for external analysis or web application integration

### 12. Complete Analysis Pipeline
```python
def run_full_analysis(self):
    """
    Run complete habitability analysis pipeline
    """
    print("="*60)
    print("🚀 EXOPLANET HABITABILITY ANALYSIS PIPELINE")
    print("="*60)
    
    # 1. Load data
    self.load_data()
    
    # 2. Analyze habitability
    self.analyze_habitability()
    
    # 3. Get top candidates
    top_candidates = self.get_top_habitable_candidates(10)
    
    # 4. Create visualizations
    self.visualize_habitability()
    
    # 5. Generate report
    self.create_habitability_report()
    
    # 6. Save results
    results = self.save_results()
    
    print("\n" + "="*60)
    print("🎉 HABITABILITY ANALYSIS COMPLETED!")
    print("="*60)
    
    return results, top_candidates
```

**Purpose**: Execute complete analysis workflow from start to finish
1. **Data Loading**: Import and filter NASA Kepler dataset
2. **Habitability Analysis**: Apply scoring and classification
3. **Top Candidates**: Identify most promising planets
4. **Visualizations**: Generate scientific plots
5. **Reporting**: Create comprehensive summary
6. **Persistence**: Save results for future use

### 13. Standalone Execution
```python
if __name__ == "__main__":
    # Initialize habitability analyzer
    analyzer = ExoplanetHabitabilityClassifier('../data/cumulative_exoplanets.csv')

    # Run complete analysis
    results, top_candidates = analyzer.run_full_analysis()
```

**Purpose**: Allow the module to be run independently for testing and standalone analysis

## Key Features

1. **Scientific Rigor**: Based on established astrobiological principles
2. **Weighted Scoring**: Properly weights different habitability factors
3. **Missing Data Handling**: Robust handling of incomplete datasets
4. **Comprehensive Visualization**: Multi-panel scientific plots
5. **Detailed Reporting**: Professional-grade analysis summaries
6. **Flexible Output**: Results suitable for further analysis or web integration
7. **Modular Design**: Can be easily integrated into larger systems

## Scientific Basis

The habitability criteria are based on:
- **Circumstellar Habitable Zone (CHZ)** theory
- **Earth Similarity Index (ESI)** concepts
- **Atmospheric retention models** for planetary radius limits
- **Stellar flux requirements** for liquid water
- **Tidal locking considerations** for orbital period limits

## Integration with Main Application

This module is designed to work seamlessly with the Flask web application (`app.py`) to provide:
- Real-time habitability analysis of uploaded datasets
- Scientific validation of exoplanet discoveries
- Detailed characterization for visualization systems