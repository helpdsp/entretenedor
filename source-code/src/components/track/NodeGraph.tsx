import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
  Connection,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TrackNode, { TrackNodeData, TrackNode as TrackNodeType } from './TrackNode';
import AtomDrawer from './AtomDrawer';

const nodeTypes = {
  trackNode: TrackNode,
};

// Initial nodes with specialized content for Sprint 5 players
const initialNodes: TrackNodeType[] = [
  {
    id: 'video-atom',
    type: 'trackNode',
    data: { 
      label: 'Video: Framework Overview', 
      status: 'in_progress', 
      description: 'Introduction to the core architecture and design principles.',
      type: 'video',
      content: {
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Classic placeholder
        duration_seconds: 300
      }
    },
    position: { x: 250, y: 50 },
  },
  {
    id: 'playbook-atom',
    type: 'trackNode',
    data: { 
      label: 'Docs: Style Guide', 
      status: 'not_started', 
      description: 'The official visual and structural documentation for the project.',
      type: 'playbook',
      content: {
        markdown: `
## Vision Framework Style Guide

Welcome to the official documentation. This guide covers the **Glassmorphism** aesthetic and **High Density** layout principles.

### 1. Color Palette
We use a primarily dark palette with vibrant accents:
- **Violet-600**: Primary Actions
- **Cyan-500**: Secondary / Technical Info
- **Emerald-500**: Success / Progress

### 2. Glassmorphism
Apply \`glass-morphism\` utility class to any container. 
Requires: \`backdrop-blur-md\`, \`bg-white/5\`, \`border-white/10\`.

### 3. High Density
Maintain a **compact** but breathable UI. Use \`gap-3\` and \`p-4\` as base spacing.

> "The details are not the details. They make the design." - Charles Eames
        `
      }
    },
    position: { x: 250, y: 180 },
  },
  {
    id: 'quiz-atom',
    type: 'trackNode',
    data: { 
      label: 'Quiz: Architecture', 
      status: 'not_started', 
      description: 'Test your knowledge on the system design.',
      type: 'quiz',
      content: {
        passing_score: 75,
        questions: [
          {
            id: 'q1',
            text: 'Which library is used for the Node Graph visualization?',
            options: ['D3.js', 'React Flow', 'Chart.js', 'Framer Motion'],
            correctIndex: 1,
            explanation: 'React Flow (@xyflow/react) is our primary tool for graph rendering.'
          },
          {
            id: 'q2',
            text: 'What is the primary aesthetic used in the UI?',
            options: ['Neumorphism', 'Material Design', 'Glassmorphism', 'Flat Design'],
            correctIndex: 2,
            explanation: 'We use high-density Glassmorphism for a modern, futuristic look.'
          }
        ]
      }
    },
    position: { x: 100, y: 310 },
  },
  {
    id: 'flashcard-atom',
    type: 'trackNode',
    data: { 
      label: 'Flashcards: Terminology', 
      status: 'not_started', 
      description: 'Quick review of key terms.',
      type: 'flashcard',
      content: {
        cards: [
          {
            id: 'c1',
            front: 'Atom',
            back: 'The smallest unit of learning content in the system.',
            hint: 'Relates to Atomic Design.'
          },
          {
            id: 'c2',
            front: 'Cell',
            back: 'A group of atoms that form a cohesive learning lesson.',
            hint: 'Reusable across tracks.'
          }
        ]
      }
    },
    position: { x: 400, y: 310 },
  },
  {
    id: 'task-atom',
    type: 'trackNode',
    data: { 
      label: 'Task: Implement Player', 
      status: 'not_started', 
      description: 'Complete the implementation of a new content player.',
      type: 'task',
      content: {
        instructions_html: `
          <p>Implement a new <strong>AudioPlayer</strong> component that supports:</p>
          <ul>
            <li>Waveform visualization</li>
            <li>Playback speed control</li>
            <li>Timestamp markers</li>
          </ul>
          <p>Make sure to use <em>Framer Motion</em> for the animations.</p>
        `,
        resources: [
          { name: 'UI Inspiration', url: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=800&auto=format&fit=crop&q=60', type: 'file' },
          { name: 'React Flow Docs', url: 'https://reactflow.dev/docs/introduction/', type: 'link' }
        ]
      }
    },
    position: { x: 250, y: 440 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'video-atom', target: 'playbook-atom', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
  { id: 'e2-3', source: 'playbook-atom', target: 'quiz-atom', style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 } },
  { id: 'e2-4', source: 'playbook-atom', target: 'flashcard-atom', style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 } },
  { id: 'e3-5', source: 'quiz-atom', target: 'task-atom', style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 } },
  { id: 'e4-5', source: 'flashcard-atom', target: 'task-atom', style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 } },
];

const NodeGraph: React.FC = () => {
  const [nodes, setNodes] = useState<TrackNodeType[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAtom, setSelectedAtom] = useState<any>(null);

  const onNodesChange: OnNodesChange<TrackNodeType> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges<TrackNodeType>(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedAtom({
      id: node.id,
      title: (node.data as any).label,
      description: (node.data as any).description,
      status: (node.data as any).status,
      type: (node.data as any).type,
      content: (node.data as any).content,
    });
    setIsDrawerOpen(true);
  }, []);

  const flowStyles = {
    background: '#0A0A0A',
    width: '100%',
    height: '100%',
  };

  return (
    <div className="w-full h-full relative group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        style={flowStyles}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls 
          className="glass-morphism border-white/10 fill-white" 
          showInteractive={false}
        />
        
        <Panel position="top-left" className="m-4">
          <div className="p-4 glass-morphism rounded-2xl border border-white/10">
            <h1 className="text-xl font-bold text-white mb-1">Sprint 5: Content Players</h1>
            <p className="text-xs text-white/40">Select a node to test the specific Atom Player</p>
          </div>
        </Panel>
      </ReactFlow>

      <AtomDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        atom={selectedAtom}
      />
    </div>
  );
};

export default NodeGraph;
