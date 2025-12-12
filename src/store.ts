import { useSyncExternalStore } from "react";

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  const get = () => state;
  const getInitial = () => initialState;

  const set = (factory: (prev: T) => T) => {
    const nextState = factory(state);
    if (!Object.is(nextState, state)) {
      state = nextState;
      listeners.forEach(listener => listener());
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const use = () => {
    return useSyncExternalStore(subscribe, get, getInitial);
  };

  return {
    get,
    set,
    use
  };
}
