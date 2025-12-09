import {
  Fragment,
  createElement,
  type ReactNode,
  type ReactElement
} from "react";
import { create } from "zustand";
import { uniqueId } from "./unique-id";
import { elementKey } from "./element-key";

interface ImperativePortalStore {
  fragments: ReactElement[];
  show: <T>(node: ReactNode) => ImperativePortalPromise<T>;
}

export interface ImperativePortalPromise<T> extends Promise<T> {
  settled: boolean;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  update: (node: ReactNode) => void;
}

export function createImperativePortal() {
  const useImperativePortalStore = create<ImperativePortalStore>(
    (set, get) => ({
      fragments: [],
      show: <T>(node: ReactNode) => {
        const key = uniqueId();
        const handlers = Promise.withResolvers<T>();

        const resolve = (value: T) => {
          handlers.resolve(value);
          settle();
        };

        const reject = (reason?: any) => {
          handlers.reject(reason);
          settle();
        };

        const settle = () => {
          set({
            fragments: get().fragments.filter(f => elementKey(f) !== key)
          });
          promise.settled = true;
        };

        const update = (node: ReactNode) => {
          const fragment = createElement(Fragment, { key }, node);
          set({
            fragments: get().fragments.map(f =>
              elementKey(f) === key ? fragment : f
            )
          });
        };

        const promise = Object.assign(handlers.promise, {
          settled: false,
          resolve,
          reject,
          update
        });

        const fragment = createElement(Fragment, { key }, node);
        set({ fragments: [...get().fragments, fragment] });

        return promise;
      }
    })
  );

  const imperativePortal = useImperativePortalStore.getState().show;

  function ImperativePortal() {
    return useImperativePortalStore(store => store.fragments);
  }

  return [imperativePortal, ImperativePortal] as const;
}

const [imperativePortal, ImperativePortal] = createImperativePortal();

export { imperativePortal, ImperativePortal };
