/**
 * Generate an intro message based on match details
 */

interface UserInfo {
  name: string | null;
  skills: Array<{ skillName: string; proficiencyLevel: string }>;
  ideas: Array<{ title: string; description: string; industry: string | null }>;
}

interface MatchInfo {
  currentUser: UserInfo;
  otherUser: UserInfo;
  matchCharacteristics?: string[];
  explanation?: {
    ideaSimilarity?: number;
    skillComplementarity?: number;
    roleCompatibility?: number;
  };
}

export function generateIntroMessage(matchInfo: MatchInfo): string {
  const { currentUser, otherUser, matchCharacteristics } = matchInfo;
  
  const currentUserName = currentUser.name || 'I';
  const otherUserName = otherUser.name || 'you';
  
  // Get top skills
  const topSkills = currentUser.skills
    .filter(s => s.proficiencyLevel === 'expert')
    .slice(0, 3)
    .map(s => s.skillName);
  
  // Get shared or complementary ideas
  const currentUserIdeas = currentUser.ideas;
  const otherUserIdeas = otherUser.ideas;
  
  // Build message parts
  const parts: string[] = [];
  
  // Greeting
  parts.push(`Hey ${otherUserName}! 👋`);
  
  // Reference match characteristics if available
  if (matchCharacteristics && matchCharacteristics.length > 0) {
    const topChar = matchCharacteristics[0];
    if (topChar.includes('idea alignment')) {
      parts.push(`I noticed we have similar ideas - excited to explore collaborating!`);
    } else if (topChar.includes('skill complementarity')) {
      parts.push(`Our skills seem really complementary - I think we could build something great together!`);
    } else if (topChar.includes('role')) {
      parts.push(`I love that we have complementary roles - exactly what I was looking for!`);
    }
  }
  
  // Mention skills
  if (topSkills.length > 0) {
    const skillsText = topSkills.length === 1 
      ? topSkills[0]
      : topSkills.length === 2
      ? `${topSkills[0]} and ${topSkills[1]}`
      : `${topSkills[0]}, ${topSkills[1]}, and ${topSkills[2]}`;
    parts.push(`I'm strong in ${skillsText}.`);
  }
  
  // Mention ideas/projects
  if (currentUserIdeas.length > 0) {
    const idea = currentUserIdeas[0];
    parts.push(`I'm working on ${idea.title}${idea.industry ? ` in ${idea.industry}` : ''}.`);
    
    if (otherUserIdeas.length > 0 && otherUserIdeas[0].industry === idea.industry) {
      parts.push(`I see you're also in ${idea.industry} - would love to chat about potential collaboration!`);
    }
  }
  
  // Closing
  parts.push(`Let's connect and see how we can work together! 🚀`);
  
  return parts.join(' ');
}

