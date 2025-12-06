'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  profilePicture: string | null;
  commitmentLevel: 'fulltime' | 'parttime' | 'weekends' | null;
  skills: Array<{
    id: string;
    skillName: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
  }>;
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    industry: string | null;
    stage: 'idea' | 'mvp' | 'launched';
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    profilePicture: '',
    commitmentLevel: 'fulltime' as 'fulltime' | 'parttime' | 'weekends',
  });

  const [skills, setSkills] = useState<Array<{ id: string; skillName: string; proficiencyLevel: 'beginner' | 'intermediate' | 'expert' }>>([]);
  const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        location: data.location || '',
        profilePicture: data.profilePicture || '',
        commitmentLevel: data.commitmentLevel || 'fulltime',
      });
      setSkills(data.skills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/users/me/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSkill),
      });

      if (!response.ok) {
        throw new Error('Failed to add skill');
      }

      setNewSkill({ skillName: '', proficiencyLevel: 'intermediate' });
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/users/me/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }

      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    } finally {
      setSaving(false);
    }
  };

  const handleAddIdea = async () => {
    router.push('/profile/ideas/new');
  };

  const handleEditIdea = async (ideaId: string) => {
    router.push(`/profile/ideas/${ideaId}`);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>Unable to load profile</h2>
        <p>{error || 'Profile not found'}</p>
        <button className="back-btn" onClick={() => router.push('/graph')}>
          Back to Graph
        </button>
      </div>
    );
  }

  return (
    <div className="profile-settings-page" style={{ overflowY: 'auto', height: '100vh' }}>
      <header className="graph-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-secondary)' }}>
        <div className="header-left">
          <h1>Jumble</h1>
          <nav className="header-nav">
            <Link href="/graph" className={`nav-link ${pathname === '/graph' ? 'active' : ''}`}>
              Matches
            </Link>
            <Link href="/trending" className={`nav-link ${pathname === '/trending' ? 'active' : ''}`}>
              Trending Ideas
            </Link>
            <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>
              Profile
            </Link>
          </nav>
        </div>
      </header>
      
      <div className="profile-settings-header">
        <h1>Edit Profile</h1>
      </div>

      <div className="profile-settings-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            Profile updated successfully!
          </div>
        )}

        {/* Basic Info */}
        <section className="settings-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="url"
              value={formData.profilePicture}
              onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
            {formData.profilePicture && (
              <div className="profile-preview">
                <img
                  src={getAvatarUrl(formData.profilePicture, formData.name, profile.id)}
                  alt="Preview"
                  className="preview-avatar"
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div className="form-group">
            <label>Commitment Level</label>
            <select
              value={formData.commitmentLevel}
              onChange={(e) => setFormData({ ...formData, commitmentLevel: e.target.value as any })}
            >
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
              <option value="weekends">Weekends</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </section>

        {/* Skills */}
        <section className="settings-section">
          <h2>Skills</h2>
          
          <div className="skills-list">
            {skills.map((skill) => (
              <div key={skill.id} className="skill-item">
                <div className="skill-info">
                  <span className="skill-name">{skill.skillName}</span>
                  <span className={`skill-level skill-${skill.proficiencyLevel}`}>
                    {skill.proficiencyLevel}
                  </span>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteSkill(skill.id)}
                  disabled={saving}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-skill-form">
            <input
              type="text"
              value={newSkill.skillName}
              onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
              placeholder="Skill name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSkill();
                }
              }}
            />
            <select
              value={newSkill.proficiencyLevel}
              onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value as any })}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
            <button
              className="btn btn-secondary"
              onClick={handleAddSkill}
              disabled={!newSkill.skillName.trim() || saving}
            >
              Add Skill
            </button>
          </div>
        </section>

        {/* Ideas */}
        <section className="settings-section">
          <h2>Startup Ideas</h2>
          
          <div className="ideas-list">
            {profile.ideas.map((idea) => (
              <div key={idea.id} className="idea-item">
                <div className="idea-info">
                  <h3>{idea.title}</h3>
                  <p>{idea.description}</p>
                  <div className="idea-meta">
                    {idea.industry && <span className="idea-industry">{idea.industry}</span>}
                    <span className={`idea-stage stage-${idea.stage}`}>{idea.stage}</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEditIdea(idea.id)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleAddIdea}
          >
            + Add New Idea
          </button>
        </section>
      </div>
    </div>
  );
}

