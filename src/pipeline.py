import requests
import pandas as pd
from io import StringIO

# URL to fetch the 'cumulative' table from the Exoplanet Archive
url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
adql_query = "SELECT * FROM cumulative"
params = {
    "query": adql_query,
    "format": "csv"
}

print("Downloading data from NASA Exoplanet Archive...")
response = requests.get(url, params=params)

# Check if download was successful
if response.status_code == 200:
    print("Download successful. Parsing data...")
    # Convert CSV text to DataFrame
    df = pd.read_csv(StringIO(response.text))
    
    # Display basic info
    print("\n✅ Dataset loaded into DataFrame.")
    print(f"Number of rows: {df.shape[0]}")
    print(f"Number of columns: {df.shape[1]}")
    print("\n🔹 First 5 rows:")
    print(df.head())

    print("\n🔹 Column summary:")
    print(df.columns.tolist())

    # Optional: Save to local CSV
    df.to_csv("cumulative_exoplanets.csv", index=False)
    print("\n💾 Data saved to 'cumulative_exoplanets.csv'")

else:
    print(f"❌ Failed to download data. Status code: {response.status_code}")
