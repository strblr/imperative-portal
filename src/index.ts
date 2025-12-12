import {
  createElement,
  createContext,
  useContext,
  type ReactNode,
  type FunctionComponent
} from "react";
import { createStore } from "./store";
import { uniqueId } from "./unique-id";

export interface ImperativeNode<T> {
  key: string;
  node: ReactNode;
  promise: ImperativePromise<T>;
}

export interface ImperativePromise<T> extends Promise<T> {
  settled: boolean;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  update: (node: ReactNode) => void;
}

// createImperativePortal

export function createImperativePortal() {
  const store = createStore<ImperativeNode<any>[]>([]);

  const useImperativePortal = store.use;

  const ImperativePortal: FunctionComponent<{
    wrap?: (nodes: ReactNode[]) => ReactNode;
  }> = ({ wrap = nodes => nodes }) => {
    const nodes = useImperativePortal();
    return wrap(nodes.map(n => n.node));
  };

  const show = <T = void>(node: ReactNode): ImperativePromise<T> => {
    const key = uniqueId();
    const handlers = Promise.withResolvers<T>();

    const createNode = (node: ReactNode) => {
      const provider = createElement(
        ImperativePromiseContext.Provider,
        { key, value: promise },
        node
      );
      return { key, node: provider, promise };
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
      if (promise.settled) return;
      store.set(nodes => nodes.filter(n => n.key !== key));
      promise.settled = true;
    };

    const update = (node: ReactNode) => {
      store.set(nodes =>
        nodes.map(n => (n.key === key ? createNode(node) : n))
      );
    };

    const promise = Object.assign(handlers.promise, {
      settled: false,
      resolve,
      reject,
      update
    });

    store.set(nodes => [...nodes, createNode(node)]);
    return promise;
  };

  return [ImperativePortal, show, useImperativePortal] as const;
}

// Context

const ImperativePromiseContext = createContext<ImperativePromise<any> | null>(
  null
);

export function useImperativePromise<T = void>(): ImperativePromise<T> {
  const context = useContext(ImperativePromiseContext);
  if (!context) {
    throw new Error(
      "useImperativePromise must be used within an imperative portal"
    );
  }
  return context;
}

// Default instance

const [ImperativePortal, show, useImperativePortal] = createImperativePortal();

export { ImperativePortal, show, useImperativePortal };
