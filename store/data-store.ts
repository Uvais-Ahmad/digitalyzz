import { create } from "zustand"
import type { DataState, Client, Worker, Task, ValidationError, Rule, EntityType } from "@/lib/types"

interface DataStore extends DataState {
  // File operations
  setData: (entityType: EntityType, data: any[]) => void
  clearData: () => void
  setLoading: (loading: boolean) => void
  setCurrentFile: (filename: string | null) => void

  // Validation
  setValidationErrors: (errors: ValidationError[]) => void
  clearValidationErrors: () => void

  // Rules
  addRule: (rule: Rule) => void
  updateRule: (id: string, updates: Partial<Rule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void

  // Data editing
  updateClient: (id: string, updates: Partial<Client>) => void
  updateWorker: (id: string, updates: Partial<Worker>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
}

export const useDataStore = create<DataStore>()((set) => ({
  // Initial state
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  rules: [],
  isLoading: false,
  currentFile: null,

  // File operations
  setData: (entityType, data) =>
    set((state) => ({
      ...state,
      [entityType]: data,
      isLoading: false,
    })),

  clearData: () =>
    set((state) => ({
      ...state,
      clients: [],
      workers: [],
      tasks: [],
      validationErrors: [],
      currentFile: null,
    })),

  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
    })),

  setCurrentFile: (filename) =>
    set((state) => ({
      ...state,
      currentFile: filename,
    })),

  // Validation
  setValidationErrors: (errors) =>
    set((state) => ({
      ...state,
      validationErrors: errors,
    })),

  clearValidationErrors: () =>
    set((state) => ({
      ...state,
      validationErrors: [],
    })),

  // Rules
  addRule: (rule) =>
    set((state) => ({
      ...state,
      rules: [...state.rules, rule],
    })),

  updateRule: (id, updates) =>
    set((state) => ({
      ...state,
      rules: state.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  removeRule: (id) =>
    set((state) => ({
      ...state,
      rules: state.rules.filter((r) => r.id !== id),
    })),

  toggleRule: (id) =>
    set((state) => ({
      ...state,
      rules: state.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    })),

  // Data editing
  updateClient: (id, updates) =>
    set((state) => ({
      ...state,
      clients: state.clients.map((c) => (c.ClientID === id ? { ...c, ...updates } : c)),
    })),

  updateWorker: (id, updates) =>
    set((state) => ({
      ...state,
      workers: state.workers.map((w) => (w.WorkerID === id ? { ...w, ...updates } : w)),
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      ...state,
      tasks: state.tasks.map((t) => (t.TaskID === id ? { ...t, ...updates } : t)),
    })),
}))
