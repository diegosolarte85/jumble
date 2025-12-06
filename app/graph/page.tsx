'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGraphData, GraphNode } from '@/app/hooks/useGraphData';

// Dynamic import to avoid SSR issues with canvas
const GraphCanvas = dynamic(
  () => import('@/app/components/graph/GraphCanvas'),
  { ssr: false }
);

export default function GraphPage() {
  const {
    graphData,
    currentUser,
    selectedNode,
    setSelectedNode,
    loading,
    error,
    handleSwipe,
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
            <div 
              className="panel-avatar" 
              style={{ backgroundColor: selectedNode.color }}
            >
              {selectedNode.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="panel-name">{selectedNode.name}</h2>
            {selectedNode.commitmentLevel && (
              <span className="panel-commitment">
                {selectedNode.commitmentLevel}
              </span>
            )}
          </div>

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

