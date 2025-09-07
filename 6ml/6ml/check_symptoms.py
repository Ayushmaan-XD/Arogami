import pickle

with open('feature_names.pkl', 'rb') as f:
    features = pickle.load(f)

print("Fever-related symptoms:")
fever_related = [f for f in features if 'fever' in f.lower()]
for symptom in fever_related:
    print(f"- {symptom}")

print("\nAll symptoms containing common keywords:")
keywords = ['pain', 'ache', 'fever', 'nausea', 'vomit', 'cough', 'cold', 'tired']
for keyword in keywords:
    matching = [f for f in features if keyword in f.lower()]
    if matching:
        print(f"\n{keyword.upper()}:")
        for symptom in matching[:5]:  # Show first 5 matches
            print(f"  - {symptom}")
