import React, { useRef, useEffect, useState } from 'react';
import { DAGData } from '../../types';
import { VisualCard } from './VisualCard';
import { GitBranch } from 'lucide-react';

interface DAGVisualProps {
  dagData?: DAGData;
  onVisualizationHover?: (elementId: string, visualizationType: string) => () => void;
  onVisualizationClick?: (elementId: string, visualizationType: string) => void;
}

const FONT = "500 14px Inter, sans-serif"; // match your node text styling

function measureTextWidth(text: string, font = FONT) {
  // Use a single canvas for better performance
  const canvas = measureTextWidth.canvas || (measureTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  if (!context) return 100;
  context.font = font;
  return context.measureText(text).width;
}
measureTextWidth.canvas = undefined as undefined | HTMLCanvasElement;

export const DAGVisual: React.FC<DAGVisualProps> = ({
  dagData,
  onVisualizationHover,
  onVisualizationClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(700); // fallback width
  const cleanupFunctions = useRef<Record<string, (() => void) | null>>({});
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!dagData || !dagData.nodes || !dagData.edges) return null;

  const nodeGroups: Record<string, { group: string; color: string }> = {
    deviation: { group: 'Flight Data', color: 'blue' },
    speed: { group: 'Flight Data', color: 'blue' },
    communication: { group: 'Communications', color: 'green' },
    geography: { group: 'Environmental', color: 'yellow' },
    threat: { group: 'Assessment', color: 'red' }
  };

  const groupStyles: Record<string, { bg: string; border: string; text: string }> = {
    'Flight Data': { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-300' },
    Communications: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-300' },
    Environmental: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-300' },
    Assessment: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-300' },
    Other: { bg: 'bg-slate-600/20', border: 'border-slate-500', text: 'text-white' }
  };

  const nodeInfo: Record<string, { desc: string; why: string; whatIf?: string }> = {
    deviation: {
      desc: 'Aircraft path differs from planned course.',
      why: 'Large deviations may signal intent to avoid detection.',
      whatIf: 'Reducing this would lower threat assessment.'
    },
    speed: {
      desc: 'Measured increase in aircraft speed.',
      why: 'Sudden speed changes often accompany evasive actions.'
    },
    communication: {
      desc: 'Failure to respond to ATC calls.',
      why: 'Unresponsive aircraft raise suspicion of hostile activity.'
    },
    geography: {
      desc: 'Direction of approach relative to sensitive sites.',
      why: 'Certain vectors are historically correlated with threats.'
    },
    threat: {
      desc: 'Overall threat determination based on factors.',
      why: 'Represents combined influence of all causal nodes.'
    }
  };

  // Calculate dynamic node widths
  const horizontalPadding = 32; // px left+right
  const minNodeWidth = 100;
  const maxNodeWidth = 220;
  const nodeHeight = 60;
  const vCenter = 130;
  const vStagger = 24;

  // For each node, measure label width and add padding
  const nodeDims = dagData.nodes.map(node => {
    const labelWidth = measureTextWidth(node.label);
    const width = Math.min(maxNodeWidth, Math.max(minNodeWidth, labelWidth + horizontalPadding));
    return { id: node.id, width, label: node.label };
  });

  // Positions: lay out horizontally, spacing by sum of previous widths plus gap
  const minGap = 36;
  let positions: Record<string, { x: number; y: number; width: number }> = {};
  let x = 36; // start with a left margin
  nodeDims.forEach((node, i) => {
    positions[node.id] = {
      x: x + node.width / 2,
      y: vCenter + (i % 2 === 0 ? -vStagger : vStagger),
      width: node.width
    };
    x += node.width + minGap;
  });

  const totalWidth = x; // last x includes the right margin
  const needsScroll = totalWidth > containerWidth;
  const scrollStyle = needsScroll
    ? { overflowX: 'auto', overflowY: 'hidden' as const }
    : {};

  // User analytics: handle hover/click with logging
  const handleMouseEnterNode = (nodeId: string) => {
    setHover(nodeId);
    const cleanup = onVisualizationHover?.(nodeId, 'dag_node');
    if (cleanup) cleanupFunctions.current[nodeId] = cleanup;
  };

  const handleMouseLeaveNode = (nodeId: string) => {
    setHover(null);
    const cleanup = cleanupFunctions.current[nodeId];
    if (cleanup) {
      cleanup();
      cleanupFunctions.current[nodeId] = null;
    }
  };

  const handleNodeClick = (nodeId: string) => {
    onVisualizationClick?.(nodeId, 'dag_node');
  };

  return (
    <VisualCard>
      <div className="flex items-center mb-6">
        <GitBranch className="w-6 h-6 text-yellow-400 mr-3" />
        <h3 className="text-lg font-semibold text-yellow-300">
          Causal Decision Graph
        </h3>
      </div>
      <div className="flex gap-4 mb-4 text-xs text-gray-400">
        {Array.from(new Set(Object.values(nodeGroups).map(g => g.group))).map(g => (
          <div key={g} className="flex items-center space-x-1">
            <span className={`w-3 h-3 rounded-full ${groupStyles[g]?.bg || ''} border ${groupStyles[g]?.border || ''}`}></span>
            <span>{g}</span>
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        className="relative rounded-lg bg-slate-900/30 p-4"
        style={{ minHeight: 260, ...scrollStyle }}
      >
        <div
          style={{
            position: 'relative',
            width: needsScroll ? totalWidth : '100%',
            height: 2 * (vCenter + vStagger),
            minHeight: 240
          }}
        >
          {/* SVG Edges */}
          <svg
            width={totalWidth}
            height={2 * (vCenter + vStagger)}
            className="absolute top-0 left-0 pointer-events-none z-0"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#64748b"
                  className="transition-colors duration-300"
                />
              </marker>
            </defs>
            {dagData.edges.map((edge, i) => {
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x + from.width / 2}
                  y1={from.y}
                  x2={to.x - to.width / 2}
                  y2={to.y}
                  stroke="#64748b"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  className="transition-colors duration-300 hover:stroke-blue-400"
                />
              );
            })}
          </svg>
          {/* Nodes */}
          {dagData.nodes.map((node) => {
            const pos = positions[node.id];
            const group = nodeGroups[node.id]?.group || 'Other';
            const styles = groupStyles[group];
            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{
                  left: pos.x - pos.width / 2,
                  top: pos.y - nodeHeight / 2,
                  width: pos.width,
                  height: nodeHeight
                }}
                onMouseEnter={() => handleMouseEnterNode(node.id)}
                onMouseLeave={() => handleMouseLeaveNode(node.id)}
                onClick={() => handleNodeClick(node.id)}
              >
                <div
                  className={`px-4 py-3 rounded-lg text-center text-sm font-medium shadow-lg flex items-center justify-center h-full border-2 ${styles?.bg} ${styles?.border} transition-all duration-300`}
                >
                  <GitBranch className={`w-4 h-4 mr-2 ${styles?.text}`} />
                  <span className="whitespace-nowrap text-white">{node.label}</span>
                </div>
                {hover === node.id && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-slate-800/80 border border-slate-600/50 p-2 rounded text-xs text-gray-200 shadow-lg z-20">
                    <p className="font-semibold text-white mb-1">{node.label}</p>
                    <p className="mb-1">{nodeInfo[node.id]?.desc}</p>
                    <p className="text-gray-400 mb-1">{nodeInfo[node.id]?.why}</p>
                    {nodeInfo[node.id]?.whatIf && (
                      <p className="text-gray-500 italic">What if: {nodeInfo[node.id]?.whatIf}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </VisualCard>
  );
};
