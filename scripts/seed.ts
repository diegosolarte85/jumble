import { db } from '../lib/db';
import { users, skills, startupIdeas } from '../drizzle/schema';
import { generateId } from '../lib/utils';

async function seed() {
  try {
    console.log('Seeding database...');

    // Create a test user
    const testUserId = generateId();
    await db.insert(users).values({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      bio: 'A test user for development',
      location: 'San Francisco, CA',
      commitmentLevel: 'fulltime',
    });

    // Add some skills
    await db.insert(skills).values([
      {
        id: generateId(),
        userId: testUserId,
        skillName: 'Full Stack Development',
        proficiencyLevel: 'expert',
      },
      {
        id: generateId(),
        userId: testUserId,
        skillName: 'Product Management',
        proficiencyLevel: 'intermediate',
      },
    ]);

    // Add a startup idea
    await db.insert(startupIdeas).values({
      id: generateId(),
      userId: testUserId,
      title: 'AI-Powered Task Manager',
      description: 'A smart task management app that uses AI to prioritize and organize your work',
      industry: 'Productivity',
      stage: 'idea',
    });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();

