import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { skills } from '@/drizzle/schema';

// Skill taxonomy seed data
const SKILL_TAXONOMY = [
  { category: 'Technical', skills: ['Frontend Development', 'Backend Development', 'Full Stack Development', 'Mobile Development', 'DevOps', 'Cloud Architecture', 'Database Design', 'API Development', 'Machine Learning', 'Data Science', 'Cybersecurity', 'Blockchain'] },
  { category: 'Business', skills: ['Business Strategy', 'Product Management', 'Sales', 'Marketing', 'Business Development', 'Operations', 'Finance', 'Accounting', 'Legal', 'Fundraising', 'Partnerships'] },
  { category: 'Design', skills: ['UI/UX Design', 'Graphic Design', 'Product Design', 'Brand Design', 'User Research', 'Prototyping', 'Design Systems'] },
  { category: 'Marketing', skills: ['Digital Marketing', 'Content Marketing', 'SEO', 'Social Media Marketing', 'Growth Hacking', 'Email Marketing', 'Paid Advertising', 'Analytics'] },
  { category: 'Other', skills: ['Project Management', 'Customer Support', 'Content Writing', 'Video Production', 'Photography'] },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let allSkills: { category: string; skills: string[] }[] = SKILL_TAXONOMY;

    if (category) {
      allSkills = allSkills.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      allSkills = allSkills.map(s => ({
        category: s.category,
        skills: s.skills.filter(skill => 
          skill.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.skills.length > 0);
    }

    return NextResponse.json(allSkills);
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

