"""
Incident Prediction Service - FIFA World Cup 2026
Predicts incident probability from zone conditions, crowd, weather, staff
"""
from .model import IncidentPredictor
import logging
from typing import Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

class IncidentPredictionService:
    def __init__(self, model_dir="./models"):
        self.predictor = IncidentPredictor(model_dir)
        self.risk_thresholds = {
            'critical': 0.7,
            'high': 0.5,
            'medium': 0.3,
            'low': 0.0
        }

    def predict_incident_risk(self, zone_data: Dict) -> Dict:
        """
        Analyze zone conditions and predict incident probability
        zone_data: {crowd_density, flow_rate, capacity, historical_incidents, weather, time_of_day, day_of_week, staff_availability, equipment_status}
        """
        # Map to model features
        features = {
            'crowd_density': zone_data.get('crowd_density', 50),
            'hour': zone_data.get('time_of_day', datetime.utcnow().hour),
            'day_of_week': zone_data.get('day_of_week', datetime.utcnow().weekday()),
            'historical_incidents': zone_data.get('historical_incidents', 2),
            'weather_code': self._encode_weather(zone_data.get('weather','clear')),
            'is_peak': 1 if zone_data.get('time_of_day', 0) in [12,13,14,18,19,20] else 0,
            'attendance_ratio': zone_data.get('zone_capacity', 10000) and zone_data.get('current_occupancy', 5000) / zone_data.get('zone_capacity', 10000) or 0.5,
            'staff_coverage': zone_data.get('staff_availability', 0.8)
        }

        prediction = self.predictor.predict(features)
        
        # Add zone-specific insights
        risk_factors = []
        if zone_data.get('crowd_density',0) > 85:
            risk_factors.append('High crowd density (>85%)')
        if zone_data.get('flow_rate',0) > 100:
            risk_factors.append('High flow rate (>100 people/min)')
        if zone_data.get('staff_availability',1) < 0.5:
            risk_factors.append('Low staff coverage (<50%)')
        if zone_data.get('weather') in ['storm','rain']:
            risk_factors.append(f"Weather: {zone_data.get('weather')}")

        preventive = self.get_preventive_actions(prediction['risk_level'])

        return {
            'zone_id': zone_data.get('zone_id'),
            'probability': prediction['probability'],
            'risk_level': prediction['risk_level'],
            'likely_types': prediction['likely_types'],
            'risk_factors': risk_factors,
            'preventive_actions': preventive,
            'confidence': prediction['confidence'],
            'timestamp': datetime.utcnow().isoformat()
        }

    def predict_crowd_incidents(self, crowd_density: float, flow_rate: float) -> Dict:
        """
        Predict crowd-related incidents based on density and flow
        Based on research: density >80% + high flow = crush risk
        """
        # Crowd crush risk model (simplified physics)
        # Risk increases exponentially with density
        if crowd_density < 50:
            crush_risk = 0.05
        elif crowd_density < 70:
            crush_risk = 0.15 + (crowd_density-50)*0.01
        elif crowd_density < 85:
            crush_risk = 0.35 + (crowd_density-70)*0.02
        else:
            crush_risk = 0.65 + (crowd_density-85)*0.03
        
        # Flow amplifies risk
        if flow_rate > 100:
            crush_risk *= 1.3
        elif flow_rate > 50:
            crush_risk *= 1.1

        crush_risk = min(0.95, crush_risk)

        # Other crowd incidents
        fall_risk = 0.1 + (crowd_density/100)*0.2 + (flow_rate/200)*0.1
        conflict_risk = 0.05 + (crowd_density/100)*0.15

        return {
            'crush_risk': round(crush_risk,3),
            'fall_risk': round(min(0.9, fall_risk),3),
            'conflict_risk': round(min(0.8, conflict_risk),3),
            'overall_crowd_risk': round(max(crush_risk, fall_risk, conflict_risk),3),
            'incident_type_probabilities': {
                'crowd_crush': round(crush_risk,3),
                'fall': round(fall_risk,3),
                'conflict': round(conflict_risk,3),
                'medical': round(crush_risk*0.7,3)
            },
            'recommendation': self._crowd_recommendation(crush_risk)
        }

    def predict_infrastructure_issues(self, facility_data: Dict) -> Dict:
        """
        Predict infrastructure failures based on usage patterns
        facility_data: {facility_type, usage_hours, last_maintenance_days, failure_history}
        """
        usage = facility_data.get('usage_hours', 100)
        days_since_maint = facility_data.get('last_maintenance_days', 30)
        failures = facility_data.get('failure_history', 0)
        
        # Simple wear model
        failure_prob = (usage / 1000) * 0.3 + (days_since_maint / 90) * 0.4 + failures * 0.1
        failure_prob = min(0.9, failure_prob + (0.1 if facility_data.get('facility_type') in ['turnstile','escalator'] else 0))

        return {
            'facility_id': facility_data.get('facility_id'),
            'facility_type': facility_data.get('facility_type'),
            'failure_probability': round(failure_prob,3),
            'risk_level': 'high' if failure_prob > 0.6 else 'medium' if failure_prob > 0.3 else 'low',
            'maintenance_recommendation': (
                'Immediate inspection required' if failure_prob > 0.6 else
                'Schedule maintenance within 48h' if failure_prob > 0.3 else
                'Normal monitoring'
            ),
            'estimated_downtime_hours': round(failure_prob * 4,1) if failure_prob > 0.5 else 0
        }

    def get_preventive_actions(self, risk_level: str) -> List[str]:
        actions = {
            'critical': [
                'Increase staff by 50% immediately',
                'Open all emergency exits and secondary gates',
                'Pre-position medical teams in zone',
                'Broadcast crowd guidance via PA and app',
                'Prepare evacuation if density exceeds 95%',
                'Notify security lead and stadium manager',
                'Activate incident command center'
            ],
            'high': [
                'Increase staff by 30%',
                'Open secondary gates',
                'Pre-position medical standby',
                'Monitor via CCTV continuously',
                'Review evacuation routes with staff',
                'Send alert to nearby zones for crowd diversion'
            ],
            'medium': [
                'Regular monitoring every 15 min',
                'Ensure staff availability',
                'Check facilities and exits',
                'Prepare medical kit'
            ],
            'low': [
                'Normal operations',
                'Routine monitoring'
            ]
        }
        return actions.get(risk_level, actions['low'])

    def _encode_weather(self, weather: str) -> int:
        mapping = {'clear': 0, 'clouds': 0, 'rain': 1, 'hot': 2, 'cold': 1, 'storm': 3, 'windy': 1}
        return mapping.get(weather.lower(), 0)

    def _crowd_recommendation(self, crush_risk: float) -> str:
        if crush_risk >= 0.7:
            return "CRITICAL: Immediate crowd dispersal required. Open all exits, stop entry, broadcast evacuation guidance."
        elif crush_risk >= 0.5:
            return "HIGH: Reduce density by 20% - open secondary exits, redirect flow via concourse, deploy crowd management staff."
        elif crush_risk >= 0.3:
            return "MEDIUM: Monitor closely, prepare to open alternative routes if density increases."
        else:
            return "LOW: Normal flow, optimal conditions."

if __name__ == "__main__":
    service = IncidentPredictionService()
    print(service.predict_incident_risk({
        'zone_id': 'zone-1',
        'crowd_density': 85,
        'flow_rate': 120,
        'zone_capacity': 5000,
        'current_occupancy': 4200,
        'historical_incidents': 3,
        'weather': 'clear',
        'time_of_day': 14,
        'staff_availability': 0.6
    }))
    print(service.predict_crowd_incidents(85, 120))
