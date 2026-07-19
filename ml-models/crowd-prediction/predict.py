"""
Prediction script for CLI and API usage
"""
import sys, os
sys.path.append(os.path.dirname(__file__))
from model import CrowdPredictionModel
import json

def predict_from_cli():
    import argparse
    parser = argparse.ArgumentParser(description="Predict crowd density")
    parser.add_argument("--zone", required=True, help="Zone ID")
    parser.add_argument("--stadium", required=True, help="Stadium ID")
    parser.add_argument("--density", type=float, default=70, help="Current density %")
    parser.add_argument("--minutes", type=int, default=30, help="Minutes ahead")
    args = parser.parse_args()

    model = CrowdPredictionModel()
    model.load()
    features = {
        'current_density': args.density,
        'avg_last_5': args.density - 2,
        'trend': 1.5,
        'hour_of_day': 14,
        'day_of_week': 5,
        'event_expected_attendance': 80000,
        'minutes_ahead': args.minutes,
        'historical_peak': args.density + 10,
        'temperature': 26,
        'is_weekend': 1
    }
    result = model.evaluate_real_time(args.zone, {"density": args.density, "expected": 80000, "peak": args.density+10}, args.minutes)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    predict_from_cli()
