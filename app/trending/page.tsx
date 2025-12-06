'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useIdeasGraph, IdeaNode } from '@/app/hooks/useIdeasGraph';
import { getAvatarUrl } from '@/lib/utils';

// Dynamic import to avoid SSR issues with canvas
const IdeasGraphCanvas = dynamic(
  () => import('@/app/components/ideas/IdeasGraphCanvas'),
  { ssr: false }
);

export default function TrendingPage() {
  const {
    graphData,
    selectedIdea,
    setSelectedIdea,
    loading,
    error,
  } = useIdeasGraph();

  const handleIdeaClick = useCallback(
    (idea: IdeaNode) => {
      setSelectedIdea(idea);
    },
    [setSelectedIdea]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedIdea(null);
  }, [setSelectedIdea]);

  if (loading) {
    return (
      <div className="graph-loading">
        <div className="loading-spinner" />
        <p>Loading trending ideas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-error">
        <h2>Unable to load trending ideas</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="graph-page">
      {/* Header */}
      <header className="graph-header">
        <div className="header-left">
          <h1>Jumble</h1>
          <nav className="header-nav">
            <a href="/graph" className="nav-link">Matches</a>
            <a href="/trending" className="nav-link active">Trending Ideas</a>
          </nav>
        </div>
        <div className="header-info">
          <span className="node-count">
            {graphData.nodes.length} trending ideas
          </span>
          <div className="legend">
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
              Launched
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
              MVP
            </span>
            <span className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
              Idea
            </span>
          </div>
        </div>
      </header>

      {/* Graph Canvas */}
      <IdeasGraphCanvas
        data={graphData}
        onIdeaClick={handleIdeaClick}
        selectedIdeaId={selectedIdea?.id ?? null}
      />

      {/* Idea Detail Panel */}
      {selectedIdea && (
        <div className="profile-panel">
          <button className="panel-close" onClick={handleClosePanel}>
            ×
          </button>
          
          <div className="panel-header">
            <div className="panel-avatar-container">
              <img
                src={getAvatarUrl(selectedIdea.userProfilePicture, selectedIdea.userName || selectedIdea.title, selectedIdea.userId)}
                alt={selectedIdea.userName || selectedIdea.title}
                className="panel-avatar-img"
                style={{ borderColor: selectedIdea.color }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = selectedIdea.title.charAt(0).toUpperCase();
                    container.style.backgroundColor = selectedIdea.color;
                  }
                }}
              />
            </div>
            <h2 className="panel-name">{selectedIdea.title}</h2>
            <div className="idea-meta">
              <span className={`idea-stage-badge stage-${selectedIdea.stage}`}>
                {selectedIdea.stage}
              </span>
              {selectedIdea.industry && (
                <span className="idea-industry-badge">
                  {selectedIdea.industry}
                </span>
              )}
            </div>
            {selectedIdea.userName && (
              <p className="idea-creator">by {selectedIdea.userName}</p>
            )}
          </div>

          <div className="panel-section">
            <h3>Description</h3>
            <p className="idea-description-full">{selectedIdea.description}</p>
          </div>

          <div className="panel-section">
            <h3>Trending Score</h3>
            <div className="trending-score-display">
              <div className="score-value">{Math.round(selectedIdea.trendingScore)}</div>
              <div className="score-bar-container">
                <div 
                  className="score-bar" 
                  style={{ 
                    width: `${Math.min(selectedIdea.trendingScore, 100)}%`,
                    backgroundColor: selectedIdea.color 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="panel-actions">
            <button 
              className="action-btn action-connect"
              onClick={() => {
                window.location.href = `/graph`;
              }}
            >
              Find Co-founders
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div className="empty-state">
          <h2>No trending ideas yet</h2>
          <p>Check back later for trending startup ideas!</p>
        </div>
      )}
    </div>
  );
}

