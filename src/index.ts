import {
  createElement,
  createContext,
  useContext,
  type ReactNode,
  type ReactElement
} from "react";
import { create } from "zustand";
import { uniqueId } from "./unique-id";
import { elementKey } from "./element-key";

export interface ImperativeNodePromise<T> extends Promise<T> {
  settled: boolean;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  update: (node: ReactNode) => void;
}

// Context

const ImperativeNodeContext = createContext<ImperativeNodePromise<any> | null>(
  null
);

export function useImperativeNode<T = void>(): ImperativeNodePromise<T> {
  const context = useContext(ImperativeNodeContext);
  if (!context) {
    throw new Error(
      "useImperativeNode must be used within an imperative portal"
    );
  }
  return context;
}

// createImperativePortal

export function createImperativePortal() {
  const useStore = create(() => ({ nodes: [] as ReactElement[] }));

  const ImperativePortal = ({
    wrap = nodes => nodes
  }: {
    wrap?: (nodes: ReactNode) => ReactNode;
  }) => wrap(useStore(store => store.nodes));

  const show = <T = void>(node: ReactNode): ImperativeNodePromise<T> => {
    const key = uniqueId();
    const handlers = Promise.withResolvers<T>();

    const render = (node: ReactNode) => {
      return createElement(
        ImperativeNodeContext.Provider,
        { key, value: promise },
        node
      );
    };

    const resolve = (value: T) => {
      handlers.resolve(value);
      settle();
    };

    const reject = (reason?: any) => {
      handlers.reject(reason);
      settle();
    };

    const settle = () => {
      useStore.setState(({ nodes }) => ({
        nodes: nodes.filter(n => elementKey(n) !== key)
      }));
      promise.settled = true;
    };

    const update = (node: ReactNode) => {
      useStore.setState(({ nodes }) => ({
        nodes: nodes.map(n => (elementKey(n) === key ? render(node) : n))
      }));
    };

    const promise = Object.assign(handlers.promise, {
      settled: false,
      resolve,
      reject,
      update
    });

    useStore.setState(({ nodes }) => ({
      nodes: [...nodes, render(node)]
    }));

    return promise;
  };

  return [ImperativePortal, show] as const;
}

// Default instance

const [ImperativePortal, show] = createImperativePortal();

export { ImperativePortal, show };
