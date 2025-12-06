'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGraphData, GraphNode } from '@/app/hooks/useGraphData';
import { getAvatarUrl } from '@/lib/utils';

// Dynamic import to avoid SSR issues with canvas
const GraphCanvas = dynamic(
  () => import('@/app/components/graph/GraphCanvas'),
  { ssr: false }
);

export default function GraphPage() {
  const {
    graphData,
    selectedNode,
    setSelectedNode,
    loading,
    error,
    handleSwipe,
    mlServiceAvailable,
  } = useGraphData();

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.isCurrentUser) {
        setSelectedNode(null);
      } else {
        setSelectedNode(node);
      }
    },
    [setSelectedNode]
  );

  const handleConnect = useCallback(async () => {
    if (selectedNode) {
      try {
        await handleSwipe(selectedNode.id, 'right');
      } catch (err) {
        console.error('Failed to connect:', err);
      }
    }
  }, [selectedNode, handleSwipe]);

  const handleHide = useCallback(async () => {
    if (selectedNode) {
      try {
        await handleSwipe(selectedNode.id, 'left');
      } catch (err) {
        console.error('Failed to hide:', err);
      }
    }
  }, [selectedNode, handleSwipe]);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  if (loading) {
    return (
      <div className="graph-loading">
        <div className="loading-spinner" />
        <p>Loading your network...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-error">
        <h2>Unable to load graph</h2>
        <p>{error}</p>
        {error.includes('sign in') && (
          <a href="/api/auth/signin" className="signin-link">
            Sign In
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="graph-page">
      {/* Header */}
      <header className="graph-header">
        <h1>Jumble</h1>
        <div className="header-info">
          <span className="node-count">
            {graphData.nodes.length - 1} potential matches
          </span>
          {mlServiceAvailable && (
            <span className="ml-badge">ML</span>
          )}
        </div>
      </header>

      {/* Graph Canvas */}
      <GraphCanvas
        data={graphData}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNode?.id ?? null}
      />

      {/* Profile Panel */}
      {selectedNode && (
        <div className="profile-panel">
          <button className="panel-close" onClick={handleClosePanel}>
            ×
          </button>
          
          <div className="panel-header">
            <div className="panel-avatar-container">
              <img
                src={getAvatarUrl(selectedNode.profilePicture, selectedNode.name, selectedNode.id)}
                alt={selectedNode.name}
                className="panel-avatar-img"
                style={{ borderColor: selectedNode.color }}
                onError={(e) => {
                  // Fallback to initial if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = selectedNode.name.charAt(0).toUpperCase();
                    container.style.backgroundColor = selectedNode.color;
                  }
                }}
              />
            </div>
            <h2 className="panel-name">{selectedNode.name}</h2>
            {selectedNode.commitmentLevel && (
              <span className="panel-commitment">
                {selectedNode.commitmentLevel}
              </span>
            )}
          </div>

          {/* Match Metrics */}
          {selectedNode.matchScore !== undefined && (
            <div className="match-metrics">
              <div className="metric-row">
                <div className="metric">
                  <span className="metric-value">
                    {Math.round(selectedNode.matchScore * 100)}%
                  </span>
                  <span className="metric-label">Match</span>
                </div>
                {selectedNode.connectionStrength !== undefined && (
                  <div className="metric">
                    <span className="metric-value">
                      {Math.round(selectedNode.connectionStrength)}
                    </span>
                    <span className="metric-label">Connection</span>
                  </div>
                )}
                {selectedNode.successProbability !== undefined && (
                  <div className="metric">
                    <span className="metric-value">
                      {Math.round(selectedNode.successProbability * 100)}%
                    </span>
                    <span className="metric-label">Success</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar for match score */}
              <div className="match-bar-container">
                <div 
                  className="match-bar" 
                  style={{ 
                    width: `${selectedNode.matchScore * 100}%`,
                    backgroundColor: selectedNode.color 
                  }}
                />
              </div>
            </div>
          )}

          {/* Why This Match */}
          {selectedNode.matchCharacteristics && selectedNode.matchCharacteristics.length > 0 && (
            <div className="panel-section match-reasons">
              <h3>Why This Match</h3>
              <ul className="characteristics-list">
                {selectedNode.matchCharacteristics.map((char, idx) => (
                  <li key={idx} className="characteristic">
                    <span className="char-icon">✓</span>
                    {char}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Match Details */}
          {selectedNode.explanation && (
            <div className="panel-section match-details">
              <h3>Match Breakdown</h3>
              <div className="detail-bars">
                <div className="detail-item">
                  <div className="detail-header">
                    <span>Idea Alignment</span>
                    <span>{Math.round(selectedNode.explanation.ideaSimilarity * 100)}%</span>
                  </div>
                  <div className="detail-bar-bg">
                    <div 
                      className="detail-bar" 
                      style={{ width: `${selectedNode.explanation.ideaSimilarity * 100}%` }}
                    />
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-header">
                    <span>Skill Fit</span>
                    <span>{Math.round(selectedNode.explanation.skillComplementarity * 100)}%</span>
                  </div>
                  <div className="detail-bar-bg">
                    <div 
                      className="detail-bar" 
                      style={{ width: `${selectedNode.explanation.skillComplementarity * 100}%` }}
                    />
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-header">
                    <span>Role Compatibility</span>
                    <span>{Math.round(selectedNode.explanation.roleCompatibility * 100)}%</span>
                  </div>
                  <div className="detail-bar-bg">
                    <div 
                      className="detail-bar" 
                      style={{ width: `${selectedNode.explanation.roleCompatibility * 100}%` }}
                    />
                  </div>
                </div>
                {selectedNode.explanation.userRole && (
                  <div className="role-badge">
                    Role: <strong>{selectedNode.explanation.userRole}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedNode.bio && (
            <p className="panel-bio">{selectedNode.bio}</p>
          )}

          {/* Skills */}
          {selectedNode.skills.length > 0 && (
            <div className="panel-section">
              <h3>Skills</h3>
              <div className="skills-list">
                {selectedNode.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className={`skill-badge skill-${skill.proficiencyLevel}`}
                  >
                    {skill.skillName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ideas */}
          {selectedNode.ideas.length > 0 && (
            <div className="panel-section">
              <h3>Ideas</h3>
              <div className="ideas-list">
                {selectedNode.ideas.map((idea) => (
                  <div key={idea.id} className="idea-card">
                    <div className="idea-header">
                      <span className="idea-title">{idea.title}</span>
                      <span className="idea-stage">{idea.stage}</span>
                    </div>
                    <p className="idea-description">{idea.description}</p>
                    {idea.industry && (
                      <span className="idea-industry">{idea.industry}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="panel-actions">
            <button className="action-btn action-hide" onClick={handleHide}>
              Hide
            </button>
            <button className="action-btn action-connect" onClick={handleConnect}>
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Instructions overlay for empty state */}
      {graphData.nodes.length <= 1 && (
        <div className="empty-state">
          <h2>No matches yet</h2>
          <p>Check back later for potential co-founders!</p>
        </div>
      )}
    </div>
  );
}
