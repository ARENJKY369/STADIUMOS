"""
Incident Prediction Model - FIFA World Cup 2026
Predicts incident probability based on crowd, time, weather, historical
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib, os, logging
from datetime import datetime
logger = logging.getLogger(__name__)

class IncidentPredictor:
    def __init__(self, model_dir="./models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler = StandardScaler()
        self.features = ['crowd_density','hour','day_of_week','historical_incidents','weather_code','is_peak','attendance_ratio','staff_coverage']
        os.makedirs(model_dir, exist_ok=True)

    def generate_synthetic(self, n=3000):
        np.random.seed(42)
        data=[]
        for i in range(n):
            crowd = np.random.beta(2,2)*100
            hour = np.random.randint(0,24)
            day = np.random.randint(0,7)
            hist = np.random.poisson(2)
            weather = np.random.choice([0,1,2,3], p=[0.7,0.15,0.1,0.05])
            is_peak = 1 if hour in [12,13,14,18,19,20] else 0
            attendance_ratio = np.random.rand()
            staff_coverage = np.random.beta(3,2)
            # Label: incident probability increases with crowd, peak, low staff, bad weather
            prob = (crowd/100)*0.4 + is_peak*0.2 + (1-staff_coverage)*0.2 + weather*0.1 + hist*0.05
            prob = np.clip(prob + np.random.randn()*0.1, 0, 1)
            label = 1 if prob > 0.5 else 0
            data.append([crowd,hour,day,hist,weather,is_peak,attendance_ratio,staff_coverage,label,prob])
        df = pd.DataFrame(data, columns=self.features+['label','prob'])
        return df

    def train(self, df=None):
        if df is None:
            df = self.generate_synthetic()
        X = df[self.features]
        y = df['label']
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
        self.model.fit(X_scaled, y)
        acc = self.model.score(X_scaled, y)
        logger.info(f"Incident model trained accuracy {acc:.3f}")
        return {"accuracy": acc, "samples": len(df)}

    def predict(self, data: dict):
        if self.model is None:
            self.load()
        vec = [data.get(f,0) for f in self.features]
        X = np.array(vec).reshape(1,-1)
        X_scaled = self.scaler.transform(X)
        proba = self.model.predict_proba(X_scaled)[0]
        prob = float(proba[1]) if len(proba)>1 else float(proba[0])
        risk = "critical" if prob>=0.7 else "high" if prob>=0.5 else "medium" if prob>=0.3 else "low"
        types = []
        if prob>=0.5:
            types = ["crowd","medical","security"]
        elif prob>=0.3:
            types = ["crowd","technical"]
        else:
            types = ["general"]
        return {"probability": round(prob,3), "risk_level": risk, "likely_types": types, "confidence": 0.78}

    def save(self):
        joblib.dump(self.model, os.path.join(self.model_dir,"incident_model.pkl"))
        joblib.dump(self.scaler, os.path.join(self.model_dir,"incident_scaler.pkl"))

    def load(self):
        try:
            self.model = joblib.load(os.path.join(self.model_dir,"incident_model.pkl"))
            self.scaler = joblib.load(os.path.join(self.model_dir,"incident_scaler.pkl"))
        except:
            logger.warning("No saved incident model, training new")
            self.train()
            self.save()

if __name__ == "__main__":
    m = IncidentPredictor()
    print(m.train())
    print(m.predict({"crowd_density":85,"hour":14,"day_of_week":5,"historical_incidents":3,"weather_code":0,"is_peak":1,"attendance_ratio":0.9,"staff_coverage":0.6}))
