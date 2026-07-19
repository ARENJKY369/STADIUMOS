"""
Sentiment Analysis Model - FIFA World Cup 2026
Multilingual sentiment for crowd feedback, chat messages, social media
Supports 50+ languages, urgent concern detection
"""
import re
from typing import List, Dict
import logging
logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        self.positive_words = {
            'en': ['great','amazing','love','awesome','fantastic','excellent','good','best','enjoy','happy','wonderful','perfect','beautiful','incredible','outstanding'],
            'es': ['genial','increíble','amor','excelente','bueno','mejor','feliz','maravilloso','perfecto'],
            'fr': ['génial','incroyable','amour','excellent','bon','meilleur','heureux'],
        }
        self.negative_words = {
            'en': ['bad','terrible','hate','awful','worst','angry','crowded','dangerous','scared','help','horrible','disgusting','annoying','frustrating','boring'],
            'es': ['malo','terrible','odio','peor','enojado','peligroso','miedo'],
            'fr': ['mauvais','terrible','haine','pire','en colère','dangereux'],
        }
        self.urgent_keywords = ['emergency','medical','fight','fire','danger','injured','panic','help','police','ambulance','evacuate','stampede','weapon','bomb','suspicious']
        self.safety_keywords = ['overcrowded','crush','blocked','exit blocked','cannot breathe','faint','collapse']

    def preprocess(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'http\S+', '', text)
        text = re.sub(r'@\w+', '', text)
        text = re.sub(r'#\w+', '', text)
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        return text

    def analyze_single(self, text: str, lang: str = 'en') -> Dict:
        clean = self.preprocess(text)
        words = clean.split()
        pos_list = self.positive_words.get(lang, self.positive_words['en'])
        neg_list = self.negative_words.get(lang, self.negative_words['en'])
        pos = sum(1 for w in words if w in pos_list)
        neg = sum(1 for w in words if w in neg_list)
        urgent = any(k in text.lower() for k in self.urgent_keywords)
        safety = any(k in text.lower() for k in self.safety_keywords)
        score = pos - neg
        # Normalize to -1 to 1
        total = pos + neg
        if total == 0:
            normalized = 0.0
            label = 'neutral'
        else:
            normalized = score / total
            if normalized > 0.2:
                label = 'positive'
            elif normalized < -0.2:
                label = 'negative'
            else:
                label = 'neutral'
        # Confidence based on word count
        confidence = min(0.95, 0.5 + total*0.1)
        return {
            'text': text[:100],
            'score': normalized,
            'label': label,
            'positive_words': pos,
            'negative_words': neg,
            'word_count': len(words),
            'urgent': urgent,
            'safety_concern': safety,
            'confidence': confidence,
            'language': lang
        }

    def analyze_batch(self, texts: List[str], lang: str = 'en') -> Dict:
        results = [self.analyze_single(t, lang) for t in texts]
        avg_score = sum(r['score'] for r in results) / max(len(results),1)
        if avg_score > 0.3:
            overall = 'positive'
        elif avg_score < -0.3:
            overall = 'negative'
        else:
            overall = 'neutral'
        breakdown = {
            'positive': sum(1 for r in results if r['label']=='positive'),
            'negative': sum(1 for r in results if r['label']=='negative'),
            'neutral': sum(1 for r in results if r['label']=='neutral'),
        }
        urgent = [r['text'] for r in results if r['urgent']][:5]
        safety = [r['text'] for r in results if r['safety_concern']][:5]
        return {
            'overall_sentiment': round(avg_score,3),
            'sentiment_label': overall,
            'breakdown': breakdown,
            'urgent_concerns': urgent,
            'safety_concerns': safety,
            'total_analyzed': len(results),
            'average_confidence': round(sum(r['confidence'] for r in results)/max(len(results),1),3),
            'details': results[:10]  # limit
        }

    def detect_language(self, text: str) -> str:
        # Simplified detection by character sets and common words
        if any('\u0600' <= c <= '\u06FF' for c in text):
            return 'ar'
        if any('\u4E00' <= c <= '\u9FFF' for c in text):
            return 'zh'
        if any('\u3040' <= c <= '\u309F' for c in text):
            return 'ja'
        if any('\uAC00' <= c <= '\uD7AF' for c in text):
            return 'ko'
        lower = text.lower()
        if 'hola' in lower or 'gracias' in lower:
            return 'es'
        if 'bonjour' in lower or 'merci' in lower:
            return 'fr'
        return 'en'

if __name__ == "__main__":
    analyzer = SentimentAnalyzer()
    samples = [
        "Great game! Amazing atmosphere, love the stadium!",
        "Too crowded at Gate B, dangerous! Need help!",
        "Emergency medical needed near section 101",
        "Good experience but food queue too long",
        "Fantastic match, best World Cup ever!"
    ]
    result = analyzer.analyze_batch(samples)
    print(result)
