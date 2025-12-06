"""
Utility functions for ML matching service
Helper functions for frontend/backend integration
"""

from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


def validate_user_data(user_data: Dict) -> Tuple[bool, Optional[str]]:
    """
    Validate user data structure for matching.
    
    Args:
        user_data: User data dictionary
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    required_fields = ['idea', 'skills']
    
    for field in required_fields:
        if field not in user_data:
            return False, f"Missing required field: {field}"
    
    if not user_data.get('idea') or len(user_data['idea'].strip()) < 10:
        return False, "Idea description must be at least 10 characters"
    
    if not user_data.get('skills') or not isinstance(user_data['skills'], list):
        return False, "Skills must be a non-empty list"
    
    if len(user_data['skills']) == 0:
        return False, "At least one skill is required"
    
    return True, None


def format_match_for_frontend(match_result: tuple) -> Dict:
    """
    Format match result for frontend consumption.
    
    Args:
        match_result: Tuple of (user_dict, match_score, explanation_dict)
        
    Returns:
        Formatted dictionary for frontend
    """
    candidate, score, explanation = match_result
    
    return {
        "user_id": candidate.get('user_id', ''),
        "match_score": round(score, 3),
        "match_percentage": round(score * 100, 1),
        "explanation": {
            "idea_similarity": round(explanation.get('idea_similarity', 0), 3),
            "skill_complementarity": round(explanation.get('skill_complementarity', 0), 3),
            "role_compatibility": round(explanation.get('role_compatibility', 0), 3),
            "user1_role": explanation.get('user1_role'),
            "user2_role": explanation.get('user2_role'),
        },
        "user_profile": {
            "idea": candidate.get('idea', ''),
            "skills": candidate.get('skills', []),
            "required_skills": candidate.get('required_skills', []),
        }
    }


def filter_matches_by_threshold(
    matches: List[tuple], 
    min_score: float = 0.3
) -> List[tuple]:
    """
    Filter matches by minimum score threshold.
    
    Args:
        matches: List of match tuples
        min_score: Minimum match score (0-1)
        
    Returns:
        Filtered list of matches
    """
    return [
        match for match in matches 
        if match[1] >= min_score
    ]


def get_match_summary(explanation: Dict) -> str:
    """
    Generate human-readable match summary.
    
    Args:
        explanation: Match explanation dictionary
        
    Returns:
        Human-readable summary string
    """
    parts = []
    
    idea_sim = explanation.get('idea_similarity', 0)
    if idea_sim > 0.7:
        parts.append("Highly aligned ideas")
    elif idea_sim > 0.4:
        parts.append("Related ideas")
    else:
        parts.append("Different ideas")
    
    role1 = explanation.get('user1_role')
    role2 = explanation.get('user2_role')
    if role1 and role2 and role1 != role2:
        parts.append(f"Complementary roles ({role1} + {role2})")
    
    comp = explanation.get('skill_complementarity', 0)
    if comp > 0.6:
        parts.append("Strong skill complementarity")
    elif comp > 0.4:
        parts.append("Good skill fit")
    
    return " • ".join(parts) if parts else "Potential match"

