import pickle

with open('feature_names.pkl', 'rb') as f:
    features = pickle.load(f)

print(f'Total features: {len(features)}')
print('First 20 features:')
for i, feature in enumerate(features[:20]):
    print(f'{i+1}. {feature}')

print('\nLast 10 features:')
for i, feature in enumerate(features[-10:], len(features)-9):
    print(f'{i}. {feature}')
