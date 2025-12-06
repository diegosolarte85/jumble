"""
Test script for Simple Local Matching Algorithm
No external downloads required - uses TF-IDF locally
"""

from simple_matching import SimpleMatchingAlgorithm
import json


def main():
    print("="*60)
    print("Testing Simple Local Matching Algorithm (TF-IDF)")
    print("="*60)
    
    # Initialize the matching algorithm
    print("\n1. Initializing matching algorithm...")
    matcher = SimpleMatchingAlgorithm()
    print("   ✓ Algorithm initialized (no downloads needed!)")
    
    # Sample user data
    print("\n2. Creating sample user profiles...")
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
    
    print("   ✓ Created 4 sample users")
    
    # Test 1: Calculate match score
    print("\n3. Testing match score calculation...")
    print("   Calculating match between User 1 and User 2...")
    score, explanation = matcher.calculate_match_score(user1, user2)
    print(f"\n   Match Score: {score:.3f}")
    print(f"   Breakdown:")
    print(f"     - Idea Similarity: {explanation['idea_similarity']:.3f}")
    print(f"     - Idea Score: {explanation['idea_score']:.3f}")
    print(f"     - Skill Complementarity: {explanation['skill_complementarity']:.3f}")
    print(f"     - Skill Overlap: {explanation['skill_overlap']:.3f}")
    print(f"     - Skill Overlap Score: {explanation['skill_overlap_score']:.3f}")
    print(f"     - Role Compatibility: {explanation['role_compatibility']:.3f}")
    print(f"     - User 1 Role: {explanation['user1_role']}")
    print(f"     - User 2 Role: {explanation['user2_role']}")
    print(f"     - Connection Strength: {explanation.get('connection_strength', 0):.1f}/100")
    print(f"     - Success Probability: {explanation.get('success_probability', 0):.1%}")
    if 'match_characteristics' in explanation:
        print(f"     - Match Characteristics:")
        for char in explanation['match_characteristics']:
            print(f"       • {char}")
    
    # Test 2: Rank matches
    print("\n4. Testing match ranking...")
    candidates = [user2, user3, user4]
    matches = matcher.rank_matches(user1, candidates, top_k=3)
    
    print(f"\n   Top {len(matches)} matches for User 1:\n")
    for i, (candidate, match_score, expl) in enumerate(matches, 1):
        print(f"   {i}. {candidate['user_id']} - Score: {match_score:.3f}")
        print(f"      Idea: {candidate['idea'][:70]}...")
        print(f"      Skills: {', '.join(candidate['skills'])}")
        print(f"      Breakdown:")
        print(f"        - Idea Similarity: {expl['idea_similarity']:.3f}")
        print(f"        - Skill Complementarity: {expl['skill_complementarity']:.3f}")
        print(f"        - Skill Overlap: {expl['skill_overlap']:.3f}")
        print(f"        - Role Compatibility: {expl['role_compatibility']:.3f}")
        print(f"        - Connection Strength: {expl.get('connection_strength', 0):.1f}/100")
        print(f"        - Success Probability: {expl.get('success_probability', 0):.1%}")
        if 'match_characteristics' in expl:
            print(f"        - Key Strengths: {', '.join(expl['match_characteristics'])}")
        print()
    
    # Test 3: Idea similarity
    print("5. Testing idea similarity...")
    sim1 = matcher.calculate_idea_similarity(user1['idea'], user2['idea'])
    sim2 = matcher.calculate_idea_similarity(user1['idea'], user3['idea'])
    print(f"   User 1 ↔ User 2: {sim1:.3f}")
    print(f"   User 1 ↔ User 3: {sim2:.3f}")
    
    # Test 4: Skill overlap
    print("\n6. Testing skill overlap...")
    overlap1 = matcher.calculate_skill_overlap(user1['skills'], user2['skills'])
    overlap2 = matcher.calculate_skill_overlap(user1['skills'], user3['skills'])
    print(f"   User 1 ↔ User 2 skill overlap: {overlap1:.3f}")
    print(f"   User 1 ↔ User 3 skill overlap: {overlap2:.3f}")
    
    print("\n" + "="*60)
    print("✓ All tests completed successfully!")
    print("="*60)
    print("\nThis simple algorithm uses TF-IDF locally - no external downloads needed!")
    print("Perfect for MVP and corporate environments.")


if __name__ == "__main__":
    main()

