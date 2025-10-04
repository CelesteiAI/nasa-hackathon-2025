import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib

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
        
    def load_data(self):
        """Load and filter confirmed exoplanets"""
        print("Loading exoplanet data for habitability analysis...")
        self.df = pd.read_csv(self.data_path, comment='#')
        
        # Focus on confirmed exoplanets only
        self.confirmed = self.df[self.df['koi_disposition'] == 'CONFIRMED'].copy()
        print(f"Total confirmed exoplanets: {len(self.confirmed)}")
        
        return self.confirmed
    
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
        
        return self.habitability_criteria
    
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
    
    def get_top_habitable_candidates(self, n=10):
        """
        Get top habitable planet candidates
        """
        top_candidates = self.confirmed.nlargest(n, 'habitability_score')
        
        print(f"\n🏆 TOP {n} MOST HABITABLE EXOPLANET CANDIDATES:")
        print("-" * 80)
        
        display_cols = [
            'kepoi_name', 'kepler_name', 'habitability_score', 'habitability_class',
            'koi_prad', 'koi_teq', 'koi_insol', 'koi_period'
        ]
        
        for i, (_, planet) in enumerate(top_candidates.iterrows(), 1):
            print(f"\n{i:2d}. {planet['kepoi_name']} ({planet.get('kepler_name', 'No name')})")
            print(f"    Habitability Score: {planet['habitability_score']:.3f}")
            print(f"    Classification: {planet['habitability_class']}")
            print(f"    Radius: {planet['koi_prad']:.2f} Earth radii")
            print(f"    Temperature: {planet['koi_teq']:.0f} K")
            print(f"    Insolation: {planet['koi_insol']:.2f} Earth flux")
            print(f"    Orbital Period: {planet['koi_period']:.1f} days")
        
        return top_candidates
    
    def visualize_habitability(self):
        """
        Create visualizations for habitability analysis
        """
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        # 1. Habitability Score Distribution
        ax1.hist(self.confirmed['habitability_score'], bins=50, alpha=0.7, color='skyblue')
        ax1.set_xlabel('Habitability Score')
        ax1.set_ylabel('Number of Planets')
        ax1.set_title('Distribution of Habitability Scores')
        ax1.grid(True, alpha=0.3)
        
        # 2. Habitability Class Counts
        class_counts = self.confirmed['habitability_class'].value_counts()
        colors = ['red', 'orange', 'yellow', 'green']
        ax2.bar(class_counts.index, class_counts.values, color=colors[:len(class_counts)])
        ax2.set_xlabel('Habitability Class')
        ax2.set_ylabel('Number of Planets')
        ax2.set_title('Planets by Habitability Class')
        ax2.tick_params(axis='x', rotation=45)
        
        # 3. Temperature vs Radius (with habitability coloring)
        habitable = self.confirmed[self.confirmed['habitability_class'].isin(['highly_habitable', 'potentially_habitable'])]
        not_habitable = self.confirmed[self.confirmed['habitability_class'] == 'not_habitable']
        
        ax3.scatter(not_habitable['koi_teq'], not_habitable['koi_prad'], 
                   alpha=0.5, color='red', label='Not Habitable', s=20)
        ax3.scatter(habitable['koi_teq'], habitable['koi_prad'], 
                   alpha=0.8, color='green', label='Potentially Habitable', s=30)
        
        # Add habitable zone boundaries
        ax3.axvline(x=200, color='blue', linestyle='--', alpha=0.7, label='Temp Range')
        ax3.axvline(x=350, color='blue', linestyle='--', alpha=0.7)
        ax3.axhline(y=0.5, color='purple', linestyle='--', alpha=0.7, label='Size Range')
        ax3.axhline(y=2.0, color='purple', linestyle='--', alpha=0.7)
        
        ax3.set_xlabel('Equilibrium Temperature (K)')
        ax3.set_ylabel('Planet Radius (Earth radii)')
        ax3.set_title('Habitability in Temperature-Radius Space')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # 4. Insolation vs Period (with habitability coloring)
        ax4.scatter(not_habitable['koi_period'], not_habitable['koi_insol'], 
                   alpha=0.5, color='red', label='Not Habitable', s=20)
        ax4.scatter(habitable['koi_period'], habitable['koi_insol'], 
                   alpha=0.8, color='green', label='Potentially Habitable', s=30)
        
        ax4.set_xlabel('Orbital Period (days)')
        ax4.set_ylabel('Insolation (Earth flux)')
        ax4.set_title('Habitability in Period-Insolation Space')
        ax4.set_yscale('log')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
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
        
        print(f"\n📊 SUMMARY STATISTICS:")
        print(f"  Total confirmed exoplanets analyzed: {total_confirmed:,}")
        print(f"  Highly habitable planets: {highly_habitable:,} ({highly_habitable/total_confirmed*100:.1f}%)")
        print(f"  Potentially habitable planets: {potentially_habitable:,} ({potentially_habitable/total_confirmed*100:.1f}%)")
        print(f"  Marginally habitable planets: {marginally_habitable:,} ({marginally_habitable/total_confirmed*100:.1f}%)")
        
        print(f"\n🎯 KEY FINDINGS:")
        print(f"  • Found {highly_habitable + potentially_habitable} planets with high habitability potential")
        print(f"  • {(highly_habitable + potentially_habitable)/total_confirmed*100:.1f}% of confirmed exoplanets show habitability promise")
        print(f"  • Most habitable planets have temperatures between 200-350K")
        print(f"  • Earth-sized planets (0.5-2.0 R⊕) are most likely to be habitable")
        
        # Top candidate summary
        top_candidate = self.confirmed.loc[self.confirmed['habitability_score'].idxmax()]
        print(f"\n🏆 MOST HABITABLE CANDIDATE:")
        print(f"  Name: {top_candidate['kepoi_name']} ({top_candidate.get('kepler_name', 'No name')})")
        print(f"  Habitability Score: {top_candidate['habitability_score']:.3f}")
        print(f"  Radius: {top_candidate['koi_prad']:.2f} Earth radii")
        print(f"  Temperature: {top_candidate['koi_teq']:.0f} K")
        
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

# Example usage
if __name__ == "__main__":
    # Initialize habitability analyzer
    # analyzer = ExoplanetHabitabilityClassifier('/home/tron/Code/nasa-hackathon-2025/cumulative_exoplanets.csv')
    analyzer = ExoplanetHabitabilityClassifier('../data/cumulative_exoplanets.csv')

    # Run complete analysis
    results, top_candidates = analyzer.run_full_analysis()