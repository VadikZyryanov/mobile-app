// Lightweight toast hook inspired by shadcn/ui. Single shared store via React state.
import * as React from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

type State = { toasts: ToasterToast[] };
type Action =
  | { type: 'ADD'; toast: ToasterToast }
  | { type: 'DISMISS'; id: string }
  | { type: 'REMOVE'; id: string };

const listeners = new Set<(state: State) => void>();
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case 'DISMISS':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export function toast(input: ToastInput) {
  const id = genId();
  const next: ToasterToast = { id, ...input };
  dispatch({ type: 'ADD', toast: next });
  return { id, dismiss: () => dispatch({ type: 'DISMISS', id }) };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (id: string) => dispatch({ type: 'DISMISS', id }),
  };
}
