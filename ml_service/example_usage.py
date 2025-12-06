"""
Example usage of the ML matching algorithm

This script demonstrates how to use the matching algorithm
with sample user data.
"""

from simple_matching import SimpleMatchingAlgorithm
import json


def main():
    # Initialize the matching algorithm
    print("Initializing matching algorithm...")
    matcher = SimpleMatchingAlgorithm()
    
    # Sample user data
    user1 = {
        'user_id': 'user_001',
        'idea': 'Building an AI-powered fitness app that provides personalized workout plans and nutrition advice based on user goals and preferences.',
        'skills': ['Python', 'Machine Learning', 'Backend Development', 'API Design'],
        'required_skills': ['Mobile Development', 'UI/UX Design', 'Marketing', 'Product Management']
    }
    
    user2 = {
        'user_id': 'user_002',
        'idea': 'Creating a mobile fitness application with AI recommendations for workouts and meal planning tailored to individual fitness goals.',
        'skills': ['React Native', 'UI/UX Design', 'Figma', 'Product Design'],
        'required_skills': ['Backend Development', 'Machine Learning', 'Data Science']
    }
    
    user3 = {
        'user_id': 'user_003',
        'idea': 'Developing a SaaS platform for managing remote teams with time tracking and productivity analytics.',
        'skills': ['JavaScript', 'React', 'Node.js', 'Database Design'],
        'required_skills': ['UI/UX Design', 'Marketing', 'Sales']
    }
    
    user4 = {
        'user_id': 'user_004',
        'idea': 'Building a marketplace for freelance designers to connect with startups needing design work.',
        'skills': ['Graphic Design', 'UI/UX Design', 'Marketing', 'Social Media'],
        'required_skills': ['Web Development', 'Backend Development', 'Payment Integration']
    }
    
    # Calculate match score between user1 and user2
    print("\n" + "="*60)
    print("Calculating match between User 1 and User 2")
    print("="*60)
    score, explanation = matcher.calculate_match_score(user1, user2)
    print(f"\nMatch Score: {score:.3f}")
    print(f"\nExplanation:")
    print(json.dumps(explanation, indent=2))
    
    # Find best matches for user1
    print("\n" + "="*60)
    print("Finding best matches for User 1")
    print("="*60)
    candidates = [user2, user3, user4]
    matches = matcher.rank_matches(user1, candidates, top_k=3)
    
    print(f"\nTop {len(matches)} matches for User 1:\n")
    for i, (candidate, match_score, expl) in enumerate(matches, 1):
        print(f"{i}. {candidate['user_id']} - Score: {match_score:.3f}")
        print(f"   Idea: {candidate['idea'][:80]}...")
        print(f"   Skills: {', '.join(candidate['skills'])}")
        print(f"   Idea Similarity: {expl['idea_similarity']:.3f}")
        print(f"   Skill Complementarity: {expl['skill_complementarity']:.3f}")
        print(f"   Role Compatibility: {expl['role_compatibility']:.3f}")
        print()
    
    # Test idea similarity
    print("="*60)
    print("Testing idea similarity")
    print("="*60)
    sim = matcher.calculate_idea_similarity(user1['idea'], user2['idea'])
    print(f"Similarity between User 1 and User 2 ideas: {sim:.3f}")
    
    sim2 = matcher.calculate_idea_similarity(user1['idea'], user3['idea'])
    print(f"Similarity between User 1 and User 3 ideas: {sim2:.3f}")


if __name__ == "__main__":
    main()

