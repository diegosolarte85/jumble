'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphNode, GraphLink, GraphData } from '@/app/hooks/useGraphData';
import { getAvatarUrl } from '@/lib/utils';

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId: string | null;
}

export default function GraphCanvas({ data, onNodeClick, selectedNodeId }: GraphCanvasProps) {
  const graphRef = useRef<ForceGraphMethods>();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
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

  // Configure forces and center the graph
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      // Configure force simulation for better spread
      graphRef.current.d3Force('charge')?.strength(-400);
      graphRef.current.d3Force('link')?.distance(200);
      graphRef.current.d3Force('center')?.strength(0.05);
      
      // Reheat simulation to apply new forces
      graphRef.current.d3ReheatSimulation();
      
      // Give time for the graph to settle, then zoom out to see all nodes
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 80);
      }, 1000);
    }
  }, [data.nodes]);

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const newCache = new Map<string, HTMLImageElement>();
      const urlsToLoad: string[] = [];
      
      // Collect unique URLs
      for (const node of data.nodes) {
        const avatarUrl = getAvatarUrl(node.profilePicture, node.name, node.id);
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
              // Image failed, skip it
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
  }, [data.nodes.length]); // Only re-run when node count changes

  // Custom node rendering
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const size = node.nodeSize;
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNode?.id;

      // Draw glow effect for current user or selected nodes
      if (node.isCurrentUser || isSelected || isHovered) {
        const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 2);
        gradient.addColorStop(0, node.color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Try to draw profile picture
      const avatarUrl = getAvatarUrl(node.profilePicture, node.name, node.id);
      const cachedImg = imageCache.get(avatarUrl);
      
      if (cachedImg && cachedImg.complete) {
        // Draw profile picture
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

        // Draw border for selected/hovered nodes
        if (isSelected || isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw name label only for current user, hovered, or selected nodes
      if (isHovered || isSelected || node.isCurrentUser) {
        const fontSize = Math.max(12 / globalScale, 10);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(node.name, x, y + size + 6);
      }
    },
    [selectedNodeId, hoveredNode, imageCache]
  );

  // Custom link rendering
  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D) => {
      const sourceNode = link.source as unknown as GraphNode;
      const targetNode = link.target as unknown as GraphNode;
      
      if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return;

      const isHighlighted = 
        targetNode.id === selectedNodeId || 
        targetNode.id === hoveredNode?.id;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      
      // Line style based on connection strength and highlight state
      ctx.strokeStyle = isHighlighted 
        ? `rgba(255, 255, 255, ${0.5 + link.strength * 0.5})` 
        : `rgba(100, 100, 150, ${0.2 + link.strength * 0.3})`;
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.stroke();
    },
    [selectedNodeId, hoveredNode]
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node);
    document.body.style.cursor = node ? 'pointer' : 'default';
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
          paintNode(node as GraphNode, ctx, globalScale)
        }
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as GraphNode;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, n.nodeSize + 5, 0, 2 * Math.PI);
          ctx.fill();
        }}
        // Link configuration
        linkCanvasObject={(link, ctx) => paintLink(link as GraphLink, ctx)}
        linkDirectionalParticles={0}
        // Interactions
        onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        onNodeHover={(node) => handleNodeHover(node as GraphNode | null)}
        // Force simulation
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        // Enable zoom and pan
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />
      
      {/* Tooltip for hovered node */}
      {hoveredNode && !hoveredNode.isCurrentUser && (
        <div className="node-tooltip">
          <div className="tooltip-name">{hoveredNode.name}</div>
          {hoveredNode.skills.length > 0 && (
            <div className="tooltip-skill">
              {hoveredNode.skills[0].skillName}
              {hoveredNode.skills.length > 1 && ` +${hoveredNode.skills.length - 1} more`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

