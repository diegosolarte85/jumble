'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { IdeaNode, IdeaLink, IdeasGraphData } from '@/app/hooks/useIdeasGraph';
import { getAvatarUrl } from '@/lib/utils';

interface IdeasGraphCanvasProps {
  data: IdeasGraphData;
  onIdeaClick: (idea: IdeaNode) => void;
  selectedIdeaId: string | null;
}

export default function IdeasGraphCanvas({ data, onIdeaClick, selectedIdeaId }: IdeasGraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const [hoveredIdea, setHoveredIdea] = useState<IdeaNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const newCache = new Map<string, HTMLImageElement>();
      const urlsToLoad: string[] = [];
      
      // Collect unique URLs
      for (const node of data.nodes) {
        const avatarUrl = getAvatarUrl(node.userProfilePicture, node.userName || node.title, node.userId);
        if (!imageCache.has(avatarUrl) && !urlsToLoad.includes(avatarUrl)) {
          urlsToLoad.push(avatarUrl);
        }
      }
      
      // Load images
      await Promise.all(
        urlsToLoad.map((url) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              newCache.set(url, img);
              resolve();
            };
            img.onerror = () => {
              resolve();
            };
            img.src = url;
          });
        })
      );
      
      if (newCache.size > 0) {
        setImageCache(prev => new Map([...prev, ...newCache]));
      }
    };
    
    if (data.nodes.length > 0) {
      loadImages();
    }
  }, [data.nodes.length]);

  // Configure forces and center the graph
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      // Configure force simulation for better spread
      graphRef.current.d3Force('charge')?.strength(-300);
      graphRef.current.d3Force('link')?.distance(150);
      graphRef.current.d3Force('center')?.strength(0.05);
      
      // Reheat simulation
      graphRef.current.d3ReheatSimulation();
      
      // Zoom to fit
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 80);
      }, 1000);
    }
  }, [data.nodes]);

  // Custom node rendering
  const paintNode = useCallback(
    (node: IdeaNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const size = node.nodeSize;
      const isSelected = node.id === selectedIdeaId;
      const isHovered = node.id === hoveredIdea?.id;

      // Draw glow for selected/hovered
      if (isSelected || isHovered) {
        const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 2);
        gradient.addColorStop(0, node.color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Try to draw profile picture
      const avatarUrl = getAvatarUrl(node.userProfilePicture, node.userName || node.title, node.userId);
      const cachedImg = imageCache.get(avatarUrl);
      
      if (cachedImg && cachedImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(cachedImg, x - size, y - size, size * 2, size * 2);
        ctx.restore();
        
        // Draw border
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = isSelected || isHovered ? 3 : 2;
        ctx.stroke();
      } else {
        // Fallback to colored circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        if (isSelected || isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw title label for hovered/selected nodes
      if (isHovered || isSelected) {
        const fontSize = Math.max(11 / globalScale, 9);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        
        // Truncate title if too long
        const maxWidth = 120;
        let title = node.title;
        const metrics = ctx.measureText(title);
        if (metrics.width > maxWidth) {
          title = title.substring(0, Math.floor(title.length * (maxWidth / metrics.width))) + '...';
        }
        
        ctx.fillText(title, x, y + size + 6);
      }
    },
    [selectedIdeaId, hoveredIdea, imageCache]
  );

  // Custom link rendering
  const paintLink = useCallback(
    (link: IdeaLink, ctx: CanvasRenderingContext2D) => {
      const sourceNode = link.source as unknown as IdeaNode;
      const targetNode = link.target as unknown as IdeaNode;
      
      if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return;

      const isHighlighted = 
        targetNode.id === selectedIdeaId || 
        targetNode.id === hoveredIdea?.id ||
        sourceNode.id === selectedIdeaId ||
        sourceNode.id === hoveredIdea?.id;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      
      // Different colors for different link types
      let linkColor = 'rgba(100, 100, 150, 0.2)';
      if (link.type === 'industry') {
        linkColor = isHighlighted 
          ? `rgba(139, 92, 246, ${0.4 + link.strength * 0.4})` 
          : `rgba(139, 92, 246, ${0.2 + link.strength * 0.2})`;
      } else if (link.type === 'similarity') {
        linkColor = isHighlighted 
          ? `rgba(0, 255, 255, ${0.4 + link.strength * 0.4})` 
          : `rgba(0, 255, 255, ${0.2 + link.strength * 0.2})`;
      } else {
        linkColor = isHighlighted 
          ? `rgba(255, 255, 255, ${0.3 + link.strength * 0.2})` 
          : `rgba(150, 150, 150, ${0.1 + link.strength * 0.1})`;
      }
      
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();
    },
    [selectedIdeaId, hoveredIdea]
  );

  const handleIdeaClick = useCallback(
    (idea: IdeaNode) => {
      onIdeaClick(idea);
    },
    [onIdeaClick]
  );

  const handleIdeaHover = useCallback((idea: IdeaNode | null) => {
    setHoveredIdea(idea);
    document.body.style.cursor = idea ? 'pointer' : 'default';
  }, []);

  return (
    <div className="graph-container">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#0a0a0f"
        // Node configuration
        nodeId="id"
        nodeCanvasObject={(node, ctx, globalScale) => 
          paintNode(node as IdeaNode, ctx, globalScale)
        }
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as IdeaNode;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, n.nodeSize + 5, 0, 2 * Math.PI);
          ctx.fill();
        }}
        // Link configuration
        linkCanvasObject={(link, ctx) => paintLink(link as IdeaLink, ctx)}
        linkDirectionalParticles={0}
        // Interactions
        onNodeClick={(node) => handleIdeaClick(node as IdeaNode)}
        onNodeHover={(node) => handleIdeaHover(node as IdeaNode | null)}
        // Force simulation
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        // Enable zoom and pan
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />
      
      {/* Tooltip for hovered idea */}
      {hoveredIdea && (
        <div className="node-tooltip">
          <div className="tooltip-name">{hoveredIdea.title}</div>
          <div className="tooltip-stage">{hoveredIdea.stage}</div>
          {hoveredIdea.industry && (
            <div className="tooltip-industry">{hoveredIdea.industry}</div>
          )}
        </div>
      )}
    </div>
  );
}

