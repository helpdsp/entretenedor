import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type NodeStatus = 'not_started' | 'in_progress' | 'completed' | 'breaking_change';

export interface TrackNodeData extends Record<string, unknown> {
  label: string;
  status: NodeStatus;
  description?: string;
}

export type TrackNode = Node<TrackNodeData, 'trackNode'>;

const TrackNode: React.FC<NodeProps<TrackNode>> = ({ data }) => {
  const { label, status } = data;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'breaking_change':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'in_progress':
        return 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] electric-glow';
      case 'breaking_change':
        return 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      default:
        return 'border-white/10';
    }
  };

  return (
    <div className={clsx(
      'px-4 py-3 rounded-xl glass-morphism min-w-[180px] transition-all duration-300',
      getStatusStyles()
    )}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        <div className="flex-grow">
          <p className="text-sm font-semibold text-white/90">{label}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">{status.replace('_', ' ')}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

export default memo(TrackNode);
