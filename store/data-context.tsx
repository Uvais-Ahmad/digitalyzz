"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
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

type DataAction =
  | { type: "SET_DATA"; entityType: EntityType; data: any[] }
  | { type: "CLEAR_DATA" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_CURRENT_FILE"; filename: string | null }
  | { type: "SET_VALIDATION_ERRORS"; errors: ValidationError[] }
  | { type: "CLEAR_VALIDATION_ERRORS" }
  | { type: "ADD_RULE"; rule: Rule }
  | { type: "UPDATE_RULE"; id: string; updates: Partial<Rule> }
  | { type: "REMOVE_RULE"; id: string }
  | { type: "TOGGLE_RULE"; id: string }
  | { type: "UPDATE_CLIENT"; id: string; updates: Partial<Client> }
  | { type: "UPDATE_WORKER"; id: string; updates: Partial<Worker> }
  | { type: "UPDATE_TASK"; id: string; updates: Partial<Task> }

const initialState: DataState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  rules: [],
  isLoading: false,
  currentFile: null,
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        [action.entityType]: action.data,
        isLoading: false,
      }
    case "CLEAR_DATA":
      return {
        ...state,
        clients: [],
        workers: [],
        tasks: [],
        validationErrors: [],
        currentFile: null,
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.loading }
    case "SET_CURRENT_FILE":
      return { ...state, currentFile: action.filename }
    case "SET_VALIDATION_ERRORS":
      return { ...state, validationErrors: action.errors }
    case "CLEAR_VALIDATION_ERRORS":
      return { ...state, validationErrors: [] }
    case "ADD_RULE":
      return { ...state, rules: [...state.rules, action.rule] }
    case "UPDATE_RULE":
      return {
        ...state,
        rules: state.rules.map((r) => (r.id === action.id ? { ...r, ...action.updates } : r)),
      }
    case "REMOVE_RULE":
      return { ...state, rules: state.rules.filter((r) => r.id !== action.id) }
    case "TOGGLE_RULE":
      return {
        ...state,
        rules: state.rules.map((r) => (r.id === action.id ? { ...r, enabled: !r.enabled } : r)),
      }
    case "UPDATE_CLIENT":
      return {
        ...state,
        clients: state.clients.map((c) => (c.ClientID === action.id ? { ...c, ...action.updates } : c)),
      }
    case "UPDATE_WORKER":
      return {
        ...state,
        workers: state.workers.map((w) => (w.WorkerID === action.id ? { ...w, ...action.updates } : w)),
      }
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.TaskID === action.id ? { ...t, ...action.updates } : t)),
      }
    default:
      return state
  }
}

const DataContext = createContext<DataStore | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState)

  const store: DataStore = {
    ...state,
    setData: (entityType, data) => dispatch({ type: "SET_DATA", entityType, data }),
    clearData: () => dispatch({ type: "CLEAR_DATA" }),
    setLoading: (loading) => dispatch({ type: "SET_LOADING", loading }),
    setCurrentFile: (filename) => dispatch({ type: "SET_CURRENT_FILE", filename }),
    setValidationErrors: (errors) => dispatch({ type: "SET_VALIDATION_ERRORS", errors }),
    clearValidationErrors: () => dispatch({ type: "CLEAR_VALIDATION_ERRORS" }),
    addRule: (rule) => dispatch({ type: "ADD_RULE", rule }),
    updateRule: (id, updates) => dispatch({ type: "UPDATE_RULE", id, updates }),
    removeRule: (id) => dispatch({ type: "REMOVE_RULE", id }),
    toggleRule: (id) => dispatch({ type: "TOGGLE_RULE", id }),
    updateClient: (id, updates) => dispatch({ type: "UPDATE_CLIENT", id, updates }),
    updateWorker: (id, updates) => dispatch({ type: "UPDATE_WORKER", id, updates }),
    updateTask: (id, updates) => dispatch({ type: "UPDATE_TASK", id, updates }),
  }

  return <DataContext.Provider value={store}>{children}</DataContext.Provider>
}

export function useDataStore(): DataStore {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useDataStore must be used within a DataProvider")
  }
  return context
}
