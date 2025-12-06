"""
Simple Local Matching Algorithm for Co-founder Matching Platform

Uses TF-IDF for text embeddings - completely local, no external downloads needed.
Perfect for MVP and corporate environments with SSL restrictions.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SimpleMatchingAlgorithm:
    """
    Simple matching algorithm using TF-IDF for local embeddings.
    No external model downloads required.
    """
    
    def __init__(self):
        """Initialize the matching algorithm with TF-IDF vectorizer."""
        logger.info("Initializing simple matching algorithm (TF-IDF based)")
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),  # Unigrams and bigrams
            min_df=1,
            max_df=0.95
        )
        self.idea_vectorizer = None  # Will be initialized on first use
        self.skill_vectorizer = None
        
        # Role compatibility mappings
        self.role_compatibility = {
            'technical': ['business', 'design', 'marketing', 'product'],
            'business': ['technical', 'design', 'marketing', 'product'],
            'design': ['technical', 'business', 'marketing', 'product'],
            'marketing': ['technical', 'business', 'design', 'product'],
            'product': ['technical', 'business', 'design', 'marketing'],
        }
    
    def _get_idea_vectorizer(self):
        """Lazy initialization of idea vectorizer."""
        if self.idea_vectorizer is None:
            self.idea_vectorizer = TfidfVectorizer(
                max_features=500,
                stop_words='english',
                ngram_range=(1, 3),
                min_df=1
            )
        return self.idea_vectorizer
    
    def _get_skill_vectorizer(self):
        """Lazy initialization of skill vectorizer."""
        if self.skill_vectorizer is None:
            self.skill_vectorizer = TfidfVectorizer(
                max_features=200,
                stop_words='english',
                ngram_range=(1, 2),
                min_df=1
            )
        return self.skill_vectorizer
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate TF-IDF embedding for a text string.
        
        Args:
            text: Input text to embed
            
        Returns:
            numpy array of TF-IDF embedding
        """
        if not text or not text.strip():
            vectorizer = self._get_idea_vectorizer()
            return np.zeros(vectorizer.max_features if hasattr(vectorizer, 'max_features') else 500)
        
        vectorizer = self._get_idea_vectorizer()
        # Fit on the text if not already fitted
        if not hasattr(vectorizer, 'vocabulary_') or len(vectorizer.vocabulary_) == 0:
            vectorizer.fit([text])
        embedding = vectorizer.transform([text]).toarray()[0]
        return embedding
    
    def calculate_idea_similarity(self, idea1: str, idea2: str) -> float:
        """
        Calculate cosine similarity between two startup ideas using TF-IDF.
        
        Args:
            idea1: First startup idea description
            idea2: Second startup idea description
            
        Returns:
            Cosine similarity score (0-1)
        """
        if not idea1 or not idea2:
            return 0.0
        
        vectorizer = self._get_idea_vectorizer()
        # Fit on both ideas to build vocabulary
        texts = [idea1, idea2]
        vectors = vectorizer.fit_transform(texts)
        
        similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        return float(similarity)
    
    def calculate_skill_overlap(self, skills1: List[str], skills2: List[str]) -> float:
        """
        Calculate skill overlap between two users.
        Lower overlap is better for complementarity.
        
        Args:
            skills1: First user's skills
            skills2: Second user's skills
            
        Returns:
            Overlap score (0-1), where 0 = no overlap, 1 = identical skills
        """
        if not skills1 or not skills2:
            return 0.0
        
        # Convert skills to text
        skills_text1 = ' '.join(skills1).lower()
        skills_text2 = ' '.join(skills2).lower()
        
        # Simple word overlap calculation
        words1 = set(skills_text1.split())
        words2 = set(skills_text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        # Jaccard similarity
        overlap = len(intersection) / len(union) if union else 0.0
        return float(overlap)
    
    def calculate_skill_complementarity(self, 
                                       user_skills: List[str], 
                                       required_skills: List[str]) -> float:
        """
        Calculate how well user's skills complement required skills.
        Higher score = better gap-filling.
        
        Args:
            user_skills: User's current skills
            required_skills: Skills required for the startup
            
        Returns:
            Complementarity score (0-1)
        """
        if not required_skills:
            return 0.5  # Neutral if no requirements specified
        
        if not user_skills:
            return 0.0  # No skills = no complementarity
        
        # Convert to text
        user_text = ' '.join(user_skills).lower()
        required_text = ' '.join(required_skills).lower()
        
        user_words = set(user_text.split())
        required_words = set(required_text.split())
        
        if not required_words:
            return 0.5
        
        # Calculate how many required skills are covered
        covered = user_words.intersection(required_words)
        complementarity = len(covered) / len(required_words) if required_words else 0.0
        
        return float(complementarity)
    
    def get_role_category(self, skills: List[str]) -> Optional[str]:
        """
        Infer role category from skills using keyword matching.
        
        Args:
            skills: List of user skills
            
        Returns:
            Role category or None
        """
        if not skills:
            return None
        
        skills_lower = ' '.join(skills).lower()
        
        # Simple keyword-based role detection
        role_keywords = {
            'technical': ['programming', 'coding', 'software', 'developer', 'engineer', 
                         'python', 'javascript', 'react', 'backend', 'frontend', 'api',
                         'machine learning', 'ml', 'ai', 'data science'],
            'business': ['business', 'strategy', 'finance', 'sales', 'operations', 
                        'management', 'consulting', 'analytics', 'b2b'],
            'design': ['design', 'ui', 'ux', 'graphic', 'visual', 'figma', 'sketch',
                      'illustrator', 'photoshop'],
            'marketing': ['marketing', 'growth', 'seo', 'social media', 'content', 
                         'advertising', 'branding', 'digital marketing'],
            'product': ['product', 'pm', 'product management', 'roadmap', 'feature',
                       'agile', 'scrum']
        }
        
        role_scores = {}
        for role, keywords in role_keywords.items():
            score = sum(1 for kw in keywords if kw in skills_lower)
            if score > 0:
                role_scores[role] = score
        
        if role_scores:
            return max(role_scores, key=role_scores.get)
        return None
    
    def calculate_role_compatibility(self, role1: Optional[str], role2: Optional[str]) -> float:
        """
        Calculate role compatibility score.
        Complementary roles (e.g., technical + business) score higher.
        
        Args:
            role1: First user's role category
            role2: Second user's role category
            
        Returns:
            Compatibility score (0-1)
        """
        if not role1 or not role2:
            return 0.5  # Neutral if roles unknown
        
        if role1 == role2:
            return 0.3  # Same roles = lower compatibility (want complementarity)
        
        # Check if roles are complementary
        if role1 in self.role_compatibility and role2 in self.role_compatibility[role1]:
            return 0.9  # High compatibility for complementary roles
        
        return 0.5  # Neutral for other combinations
    
    def calculate_match_score(self, 
                            user1: Dict, 
                            user2: Dict) -> Tuple[float, Dict]:
        """
        Calculate overall match score between two users.
        
        Args:
            user1: First user data with 'idea', 'skills', 'required_skills'
            user2: Second user data with 'idea', 'skills', 'required_skills'
            
        Returns:
            Tuple of (match_score, explanation_dict)
        """
        # 1. Idea similarity (0.6-0.9 range is ideal - aligned but not identical)
        idea_sim = self.calculate_idea_similarity(
            user1.get('idea', ''),
            user2.get('idea', '')
        )
        
        # Penalize if ideas are too similar (>0.95) or too different (<0.5)
        if idea_sim > 0.95:
            idea_score = 0.3  # Too similar
        elif idea_sim < 0.5:
            idea_score = 0.2  # Too different
        elif 0.6 <= idea_sim <= 0.9:
            idea_score = 1.0  # Ideal range
        else:
            idea_score = 0.6  # Acceptable but not ideal
        
        # 2. Skill complementarity
        comp1_to_2 = self.calculate_skill_complementarity(
            user1.get('skills', []),
            user2.get('required_skills', [])
        )
        
        comp2_to_1 = self.calculate_skill_complementarity(
            user2.get('skills', []),
            user1.get('required_skills', [])
        )
        
        skill_complementarity = (comp1_to_2 + comp2_to_1) / 2
        
        # 3. Skill overlap (lower is better)
        skill_overlap = self.calculate_skill_overlap(
            user1.get('skills', []),
            user2.get('skills', [])
        )
        skill_overlap_score = 1.0 - skill_overlap  # Invert: low overlap = high score
        
        # 4. Role compatibility
        role1 = self.get_role_category(user1.get('skills', []))
        role2 = self.get_role_category(user2.get('skills', []))
        role_compat = self.calculate_role_compatibility(role1, role2)
        
        # Weighted final score
        weights = {
            'idea_alignment': 0.35,
            'skill_complementarity': 0.30,
            'skill_overlap': 0.20,
            'role_compatibility': 0.15
        }
        
        final_score = (
            weights['idea_alignment'] * idea_score +
            weights['skill_complementarity'] * skill_complementarity +
            weights['skill_overlap'] * skill_overlap_score +
            weights['role_compatibility'] * role_compat
        )
        
        # Calculate connection strength (0-100 scale)
        # Based on overall match quality
        connection_strength = float(final_score * 100)
        
        # Calculate success probability
        # Based on multiple factors: idea alignment, skill fit, role compatibility
        # Higher scores = higher probability, but we adjust based on key indicators
        base_probability = final_score
        
        # Boost probability if key indicators are strong
        if idea_score >= 0.8 and skill_complementarity >= 0.6 and role_compat >= 0.7:
            # Strong indicators across the board
            success_probability = min(0.95, base_probability * 1.15)
        elif idea_score >= 0.6 and skill_complementarity >= 0.5:
            # Good indicators
            success_probability = min(0.85, base_probability * 1.05)
        elif final_score >= 0.5:
            # Decent match
            success_probability = base_probability
        else:
            # Lower probability for weaker matches
            success_probability = max(0.1, base_probability * 0.8)
        
        # Ensure probability is in valid range
        success_probability = max(0.0, min(1.0, success_probability))
        
        # Identify key match characteristics/strengths
        match_characteristics = self._identify_match_characteristics(
            idea_score, idea_sim, skill_complementarity, skill_overlap, 
            role_compat, role1, role2
        )
        
        explanation = {
            'final_score': float(final_score),
            'idea_similarity': float(idea_sim),
            'idea_score': float(idea_score),
            'skill_complementarity': float(skill_complementarity),
            'skill_overlap': float(skill_overlap),
            'skill_overlap_score': float(skill_overlap_score),
            'role_compatibility': float(role_compat),
            'user1_role': role1,
            'user2_role': role2,
            'connection_strength': round(connection_strength, 1),
            'success_probability': round(success_probability, 3),
            'match_characteristics': match_characteristics,
            'weights': weights
        }
        
        return final_score, explanation
    
    def _identify_match_characteristics(self, 
                                       idea_score: float,
                                       idea_sim: float,
                                       skill_complementarity: float,
                                       skill_overlap: float,
                                       role_compat: float,
                                       role1: Optional[str],
                                       role2: Optional[str]) -> List[str]:
        """
        Identify key characteristics that make this a good match.
        
        Returns a list of positive match characteristics.
        """
        characteristics = []
        
        # Idea alignment characteristics
        if idea_score >= 0.9:
            characteristics.append("Excellent idea alignment")
        elif idea_score >= 0.7:
            characteristics.append("Strong idea alignment")
        elif idea_sim >= 0.6:
            characteristics.append("Good idea similarity")
        
        if 0.6 <= idea_sim <= 0.9:
            characteristics.append("Ideas are aligned but not identical (ideal range)")
        
        # Skill complementarity characteristics
        if skill_complementarity >= 0.7:
            characteristics.append("Strong skill complementarity")
        elif skill_complementarity >= 0.5:
            characteristics.append("Good skill fit")
        
        # Skill overlap characteristics
        if skill_overlap < 0.2:
            characteristics.append("Low skill overlap (diverse expertise)")
        elif skill_overlap < 0.4:
            characteristics.append("Moderate skill overlap (balanced diversity)")
        
        # Role compatibility characteristics
        if role_compat >= 0.8:
            if role1 and role2 and role1 != role2:
                characteristics.append(f"Complementary roles ({role1} + {role2})")
            else:
                characteristics.append("High role compatibility")
        elif role_compat >= 0.6:
            characteristics.append("Good role compatibility")
        
        # Overall match quality indicators
        if idea_score >= 0.8 and skill_complementarity >= 0.6 and role_compat >= 0.7:
            characteristics.append("Strong match across all dimensions")
        
        # Specific skill gap filling
        if skill_complementarity >= 0.6:
            characteristics.append("Skills effectively fill each other's gaps")
        
        # If no strong characteristics, add a general one
        if not characteristics:
            characteristics.append("Potential match with room for growth")
        
        return characteristics
    
    def rank_matches(self, 
                    target_user: Dict, 
                    candidate_users: List[Dict], 
                    top_k: int = 10) -> List[Tuple[Dict, float, Dict]]:
        """
        Rank candidate users by match score.
        
        Args:
            target_user: The user to find matches for
            candidate_users: List of candidate user dictionaries
            top_k: Number of top matches to return
            
        Returns:
            List of tuples: (user_dict, match_score, explanation_dict), sorted by score
        """
        matches = []
        
        for candidate in candidate_users:
            score, explanation = self.calculate_match_score(target_user, candidate)
            matches.append((candidate, score, explanation))
        
        # Sort by score (descending)
        matches.sort(key=lambda x: x[1], reverse=True)
        
        return matches[:top_k]

