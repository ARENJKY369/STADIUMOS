"""
Sustainability Calculator - FIFA World Cup 2026
Carbon footprint tracking, eco-points, recommendations
"""
from typing import Dict, List

class SustainabilityCalculator:
    EMISSION_FACTORS = {
        'car': 0.12,  # kg CO2 per km
        'bus': 0.05,
        'train': 0.03,
        'subway': 0.02,
        'bicycle': 0.0,
        'walking': 0.0,
        'flight': 0.25,
        'rideshare': 0.10,
        'electric_car': 0.02,
        'tram': 0.02,
    }
    ECO_POINTS = {
        'walking': 100,
        'bicycle': 80,
        'bus': 50,
        'train': 60,
        'subway': 55,
        'car': 10,
        'rideshare': 20,
        'electric_car': 30,
        'tram': 45,
    }

    def calculate_transport(self, mode: str, distance_km: float, passengers: int = 1) -> Dict:
        factor = self.EMISSION_FACTORS.get(mode, 0.12)
        carbon = (distance_km * factor) / passengers
        car_carbon = (distance_km * self.EMISSION_FACTORS['car']) / passengers
        saved = car_carbon - carbon
        base_points = self.ECO_POINTS.get(mode, 10)
        bonus = int(saved * 10)
        points = base_points + bonus
        return {
            'mode': mode,
            'distance_km': distance_km,
            'passengers': passengers,
            'carbon_kg': round(carbon,3),
            'car_equivalent_kg': round(car_carbon,3),
            'saved_kg': round(saved,3),
            'eco_points': points,
            'trees_equivalent': round(saved/21,3),  # kg CO2 per tree per year
        }

    def calculate_waste(self, waste_type: str, weight_kg: float) -> Dict:
        factors = {'plastic': 0.5, 'food': 0.3, 'paper': 0.2, 'general': 0.4}
        carbon = weight_kg * factors.get(waste_type, 0.4)
        points = int(weight_kg * 2)
        return {'waste_type': waste_type, 'weight_kg': weight_kg, 'carbon_kg': carbon, 'eco_points': points}

    def leaderboard_scoring(self, user_actions: List[Dict]) -> int:
        total = 0
        for action in user_actions:
            if action['category']=='transport':
                res = self.calculate_transport(action['mode'], action['distance'], action.get('passengers',1))
                total += res['eco_points']
            elif action['category']=='waste':
                res = self.calculate_waste(action['type'], action['weight'])
                total += res['eco_points']
            else:
                total += int(action.get('value',0))
        return total

    def generate_report(self, stadium_id: str, metrics: List[Dict]) -> Dict:
        total_carbon = sum(m.get('carbon_footprint_kg',0) for m in metrics)
        total_points = sum(m.get('eco_points',0) for m in metrics)
        by_category = {}
        for m in metrics:
            cat = m.get('category','unknown')
            by_category[cat] = by_category.get(cat,0) + m.get('carbon_footprint_kg',0)
        benchmark = 5000  # kg for comparison
        savings = max(0, benchmark - total_carbon)
        return {
            'stadium_id': stadium_id,
            'total_carbon_kg': round(total_carbon,2),
            'total_points': total_points,
            'benchmark_kg': benchmark,
            'savings_kg': round(savings,2),
            'savings_percent': round(savings/benchmark*100,1) if benchmark else 0,
            'by_category': by_category,
            'equivalent_trees': int(savings/21),
            'equivalent_car_km': int(savings/0.12),
            'recommendations': [
                f"Encourage {int(savings/0.12)} km of car travel to switch to bus",
                f"Plant {int(savings/21)} trees to offset remaining",
                "Promote bike parking and walking routes"
            ]
        }

if __name__ == "__main__":
    calc = SustainabilityCalculator()
    print(calc.calculate_transport('bus', 10, 1))
    print(calc.generate_report('stad-1', [
        {'category':'transport','carbon_footprint_kg':5,'eco_points':50},
        {'category':'transport','carbon_footprint_kg':2,'eco_points':100},
    ]))
