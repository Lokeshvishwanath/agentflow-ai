import { create } from 'zustand';
import api from '../services/api';

const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isLoading: false,
  error: null,

  fetchWorkflows: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/workflows', { params });
      set({ workflows: data.workflows, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchWorkflow: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/workflows/${id}`);
      set({ currentWorkflow: data.workflow, nodes: data.workflow.nodes || [], edges: data.workflow.edges || [], isLoading: false });
      return data.workflow;
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  saveWorkflow: async (id, payload) => {
    const { data } = await api.put(`/workflows/${id}`, payload);
    set({ currentWorkflow: data.workflow });
    return data.workflow;
  },

  generateWorkflow: async (prompt) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/workflows/generate', { prompt });
      set({ nodes: data.workflow.nodes || [], edges: data.workflow.edges || [], isLoading: false });
      return data.workflow;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  updateNodeData: (nodeId, data) => set((s) => ({
    nodes: s.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n),
  })),
  clearCanvas: () => set({ nodes: [], edges: [], selectedNode: null, currentWorkflow: null }),
}));

export default useWorkflowStore;
