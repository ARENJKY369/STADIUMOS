"""
Training pipeline for crowd prediction - production with MLflow tracking
"""
import os, sys
sys.path.append(os.path.dirname(__file__))
from model import CrowdPredictionModel
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting crowd model training pipeline")
    model = CrowdPredictionModel(model_dir="./models")
    # Generate synthetic data for 5000 samples realistic
    df = model.prepare_training_data(synthetic=True, n_samples=8000)
    logger.info(f"Dataset shape {df.shape}")
    metrics = model.train(df)
    logger.info(f"Training metrics: {metrics}")
    model.save()
    logger.info("Model saved to ./models")
    # Evaluate real-time
    test = model.evaluate_real_time("zone-1", {"density":85, "avg_last_5":80, "trend":2, "expected":80000, "peak":90}, 30)
    logger.info(f"Real-time test: {test}")

if __name__ == "__main__":
    main()
