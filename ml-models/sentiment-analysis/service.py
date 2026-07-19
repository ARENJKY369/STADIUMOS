"""
Sentiment Service - FIFA World Cup 2026
Analyzes incident reports, fan feedback, chat messages
Triggers escalation if needed, calculates satisfaction
"""
from .model import SentimentAnalyzer
from typing import List, Dict
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SentimentService:
    def __init__(self):
        self.analyzer = SentimentAnalyzer()
        self.escalation_threshold = -0.6  # strongly negative triggers escalation
        self.satisfaction_threshold = 0.5

    def analyze_incident_reports(self, reports: List[Dict]) -> Dict:
        """
        Analyze incident reports sentiment to identify critical issues
        Reports: [{id, description, severity, created_at}, ...]
        """
        texts = [r.get('description','') + ' ' + r.get('title','') for r in reports]
        batch_result = self.analyzer.analyze_batch(texts)
        
        # Identify critical based on sentiment + severity
        critical_reports = []
        for i, r in enumerate(reports):
            analysis = self.analyzer.analyze_single(texts[i])
            if analysis['score'] < -0.5 or analysis['urgent'] or r.get('severity') in ['critical','high']:
                critical_reports.append({
                    'report_id': r.get('id'),
                    'reason': 'negative_sentiment' if analysis['score'] < -0.5 else 'urgent_keyword',
                    'sentiment_score': analysis['score'],
                    'urgent': analysis['urgent'],
                    'original': reports[i]
                })

        # Priority recommendations
        recommendations = []
        if batch_result['breakdown']['negative'] > len(reports) * 0.4:
            recommendations.append("High negative sentiment in incidents - review safety protocols")
        if len(critical_reports) > 3:
            recommendations.append(f"{len(critical_reports)} critical incident reports need immediate attention")
        if batch_result['overall_sentiment'] < -0.3:
            recommendations.append("Overall incident sentiment negative - consider fan communication")

        return {
            'overall_sentiment': batch_result['overall_sentiment'],
            'sentiment_label': batch_result['sentiment_label'],
            'breakdown': batch_result['breakdown'],
            'critical_reports': critical_reports,
            'urgent_concerns': batch_result['urgent_concerns'],
            'recommendations': recommendations,
            'total_analyzed': len(reports),
            'timestamp': datetime.utcnow().isoformat()
        }

    def analyze_feedback(self, feedback_list: List[Dict]) -> Dict:
        """
        Analyze fan feedback for satisfaction score and trends
        feedback_list: [{text, rating, created_at, user_id, category}, ...]
        """
        texts = [f.get('text','') for f in feedback_list]
        batch_result = self.analyzer.analyze_batch(texts)
        
        # Calculate satisfaction from both sentiment and explicit ratings
        explicit_ratings = [f.get('rating',3) for f in feedback_list if 'rating' in f]
        avg_rating = sum(explicit_ratings)/len(explicit_ratings) if explicit_ratings else 3.0
        
        # Combined satisfaction: 60% rating, 40% sentiment
        # rating 1-5 mapped to 0-1: (rating-1)/4, sentiment -1 to 1 mapped to 0-1: (sentiment+1)/2
        sentiment_normalized = (batch_result['overall_sentiment'] + 1) / 2
        rating_normalized = (avg_rating - 1) / 4
        satisfaction = rating_normalized * 0.6 + sentiment_normalized * 0.4

        # Identify trends by category
        categories = {}
        for fb in feedback_list:
            cat = fb.get('category','general')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(self.analyzer.analyze_single(fb.get('text',''))['score'])

        trends = {cat: round(sum(scores)/len(scores),3) for cat, scores in categories.items()}

        # Identify low satisfaction areas
        low_areas = [cat for cat, score in trends.items() if score < -0.2]

        return {
            'satisfaction_score': round(satisfaction,3),
            'satisfaction_label': 'high' if satisfaction > 0.7 else 'medium' if satisfaction > 0.4 else 'low',
            'average_rating': round(avg_rating,2),
            'sentiment': batch_result,
            'trends_by_category': trends,
            'low_satisfaction_areas': low_areas,
            'total_feedback': len(feedback_list),
            'recommendations': [
                f"Focus improvement on {', '.join(low_areas)}" if low_areas else "Overall satisfaction good, maintain",
                f"Avg rating {avg_rating:.1f}/5 - {'excellent' if avg_rating >=4.5 else 'good' if avg_rating >=4 else 'needs improvement'}"
            ]
        }

    def analyze_chat_messages(self, messages: List[Dict]) -> Dict:
        """
        Analyze chat messages for frustration/anger, trigger escalation
        messages: [{message, role, intent, created_at}, ...]
        """
        user_messages = [m for m in messages if m.get('role') == 'user']
        texts = [m.get('message','') for m in user_messages]
        
        if not texts:
            return {'escalation_needed': False, 'frustration_level': 0, 'overall_sentiment': 0}

        batch_result = self.analyzer.analyze_batch(texts)
        
        # Detect frustration: repeated negative, urgent keywords, escalation words
        frustration_keywords = ['frustrated','angry','terrible','worst','hate','useless','stupid','annoying']
        frustration_count = sum(1 for t in texts if any(k in t.lower() for k in frustration_keywords))
        
        frustration_level = frustration_count / max(len(texts),1)
        if batch_result['overall_sentiment'] < -0.5:
            frustration_level += 0.3
        
        # Escalation if frustration high or urgent concerns
        escalation_needed = (
            frustration_level > 0.5 or
            batch_result['overall_sentiment'] < self.escalation_threshold or
            len(batch_result['urgent_concerns']) > 0
        )

        return {
            'frustration_level': round(frustration_level,3),
            'overall_sentiment': batch_result['overall_sentiment'],
            'sentiment_label': batch_result['sentiment_label'],
            'breakdown': batch_result['breakdown'],
            'urgent_concerns': batch_result['urgent_concerns'],
            'escalation_needed': escalation_needed,
            'escalation_reason': (
                'high_frustration' if frustration_level > 0.5 else
                'negative_sentiment' if batch_result['overall_sentiment'] < self.escalation_threshold else
                'urgent_keyword' if batch_result['urgent_concerns'] else None
            ),
            'total_user_messages': len(user_messages),
            'recommendation': 'Escalate to human support' if escalation_needed else 'Continue AI handling'
        }

    def get_overall_sentiment(self, data: Dict) -> Dict:
        """
        Calculate overall sentiment from multiple sources
        data: {incidents, feedback, chats}
        """
        sources = {}
        if 'incidents' in data:
            sources['incidents'] = self.analyze_incident_reports(data['incidents'])
        if 'feedback' in data:
            sources['feedback'] = self.analyze_feedback(data['feedback'])
        if 'chats' in data:
            sources['chats'] = self.analyze_chat_messages(data['chats'])

        # Weighted average: incidents 40%, feedback 40%, chats 20%
        weights = {'incidents': 0.4, 'feedback': 0.4, 'chats': 0.2}
        total_score = 0
        total_weight = 0
        
        for source, result in sources.items():
            score = result.get('overall_sentiment', result.get('satisfaction_score', 0))
            # Normalize satisfaction 0-1 to -1 to 1
            if source == 'feedback':
                score = (score * 2) - 1
            w = weights.get(source, 0.33)
            total_score += score * w
            total_weight += w

        overall = total_score / total_weight if total_weight > 0 else 0

        return {
            'overall_sentiment': round(overall,3),
            'overall_label': 'positive' if overall > 0.3 else 'negative' if overall < -0.3 else 'neutral',
            'sources': sources,
            'timestamp': datetime.utcnow().isoformat()
        }

if __name__ == "__main__":
    service = SentimentService()
    print(service.analyze_incident_reports([
        {'id': '1', 'title': 'Medical emergency', 'description': 'Fan fainted near Gate A', 'severity': 'high'},
        {'id': '2', 'title': 'Great atmosphere', 'description': 'Amazing game, love the energy!', 'severity': 'low'}
    ]))
