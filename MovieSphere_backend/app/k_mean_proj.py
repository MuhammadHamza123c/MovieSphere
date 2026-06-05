import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.datasets import load_iris

# 1. Load the UCI Iris Dataset
iris = load_iris()
X = pd.DataFrame(iris.data, columns=iris.feature_names)
y = iris.target  # True labels (only used for comparison later)

# 2. Initialize the K-Means Model
# We use n_clusters=3 because we know there are 3 species of Iris
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)

# 3. Fit the model and predict clusters
X["cluster"] = kmeans.fit_predict(X)

# 4. Add the true labels for a quick comparison
X["target"] = y
target_map = {0: "setosa", 1: "versicolor", 2: "virginica"}
X["target_name"] = X["target"].map(target_map)

# Print the first few rows to see the results
print("--- First 5 Rows of the Clustered Data ---")
print(X.head())

# 5. Visualize the Results
plt.figure(figsize=(12, 5))

# Plot 1: K-Means Predicted Clusters
plt.subplot(1, 2, 1)
sns.scatterplot(
    x="sepal length (cm)",
    y="sepal width (cm)",
    hue="cluster",
    palette="viridis",
    data=X,
    s=60,
)
# Plot the cluster centers (centroids)
centroids = kmeans.cluster_centers_
plt.scatter(
    centroids[:, 0],
    centroids[:, 1],
    c="red",
    s=200,
    alpha=0.75,
    marker="X",
    label="Centroids",
)
plt.title("K-Means Clustering Predictions")
plt.legend()

# Plot 2: Actual Species (Ground Truth)
plt.subplot(1, 2, 2)
sns.scatterplot(
    x="sepal length (cm)",
    y="sepal width (cm)",
    hue="target_name",
    palette="viridis",
    data=X,
    s=60,
)
plt.title("Actual Iris Species")

plt.tight_layout()
plt.show()