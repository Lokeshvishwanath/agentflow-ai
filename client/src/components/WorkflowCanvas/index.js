import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState, Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Mail, MessageSquare, Hash, Table, Zap, GitBranch, Play, Square } from 'lucide-react';
import useWorkflowStore from '../../store/workflowStore';

const iconMap = {
  trigger: Play, ai: Zap, gmail: Mail, slack: MessageSquare,
  discord: Hash, 'google-sheets': Table, condition: GitBranch, output: Square,
};
const colorMap = {
  trigger: '#10b981', ai: '#0ea5e9', gmail: '#ef4444', slack: '#a855f7',
  discord: '#6366f1', 'google-sheets': '#22c55e', condition: '#f59e0b', output: '#64748b',
};

const CustomNode = ({ data, selected }) => {
  const Icon = iconMap[data.nodeType] || Zap;
  const color = colorMap[data.nodeType] || '#0ea5e9';
  return (
    <div className={`bg-slate-800 border-2 rounded-xl px-4 py-3 min-w-[140px] shadow-lg transition-all ${selected ? 'border-sky-400 shadow-sky-500/20' : 'border-slate-600'}`}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon size={12} style={{ color }} />
        </div>
        <span className="text-xs font-medium text-white truncate max-w-[100px]">{data.label}</span>
      </div>
      {data.nodeType && <p className="text-[10px] text-slate-500 mt-1 capitalize">{data.nodeType}</p>}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };
let nodeIdCounter = 100;

export default function WorkflowCanvas({ readOnly = false }) {
  const { nodes, edges, setNodes, setEdges, setSelectedNode } = useWorkflowStore();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);
  const reactFlowWrapper = useRef(null);

  // Sync store → React Flow when store changes externally (e.g. AI generation)
  useEffect(() => { setRfNodes(nodes); }, [nodes]);
  useEffect(() => { setRfEdges(edges); }, [edges]);

  const onConnect = useCallback((params) => {
    setRfEdges((eds) => {
      const newEdges = addEdge({ ...params, animated: true, style: { stroke: '#0ea5e9' } }, eds);
      setEdges(newEdges);
      return newEdges;
    });
  }, [setEdges, setRfEdges]);

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), [setSelectedNode]);

  const onPaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const onNodesChangeHandler = useCallback((changes) => {
    onNodesChange(changes);
    setRfNodes((nds) => {
      setNodes(nds);
      return nds;
    });
  }, [onNodesChange, setNodes, setRfNodes]);

  const onEdgesChangeHandler = useCallback((changes) => {
    onEdgesChange(changes);
    setRfEdges((eds) => {
      setEdges(eds);
      return eds;
    });
  }, [onEdgesChange, setEdges, setRfEdges]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (!nodeType || !reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = { x: e.clientX - bounds.left - 70, y: e.clientY - bounds.top - 30 };
    const id = `node_${++nodeIdCounter}`;
    const newNode = {
      id, type: 'custom', position,
      data: { label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1), nodeType, config: {} },
    };
    setRfNodes((nds) => {
      const updated = [...nds, newNode];
      setNodes(updated);
      return updated;
    });
  }, [setNodes, setRfNodes]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full bg-slate-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={readOnly ? undefined : onDrop}
        onDragOver={readOnly ? undefined : onDragOver}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        className="bg-slate-950"
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
        <MiniMap nodeColor={(n) => colorMap[n.data?.nodeType] || '#64748b'} className="!bg-slate-800 !border-slate-700" />
        {rfNodes.length === 0 && (
          <Panel position="top-center">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl px-6 py-4 text-center mt-8">
              <p className="text-slate-400 text-sm">Drag nodes from the palette or use AI Builder to generate a workflow</p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
