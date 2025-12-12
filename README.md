# imperative-portal

A lightweight React library for rendering components imperatively with promise-based control. Perfect for modals, dialogs, notifications, and any UI that needs programmatic lifecycle management.

## Table of Contents

- [Motivation](#motivation)
- [Setup](#setup)
- [Basic example](#basic-example)
- [Confirm dialog example](#confirm-dialog-example)
- [useImperativePromise hook](#useimperativepromise-hook)
- [Input dialog example](#input-dialog-example)
- [Node update](#node-update)
- [Advanced features](#advanced-features)
  - [Checking settlement status](#checking-settlement-status)
  - [Wrap prop](#wrap-prop)
  - [Advanced customization](#advanced-customization)
- [Multiple portal systems](#multiple-portal-systems)
- [API reference](#api-reference)
- [Types](#types)

## Motivation

React encourages declarative UI patterns, but sometimes you want to render components imperatively - triggered by user actions, API calls, or other side effects that wouldn't fit nicely into your component tree without heavy boilerplate.

Common use cases include:

- Modals and dialogs that need to be shown programmatically
- Toast notifications and alerts
- Confirmation dialogs
- Input dialogs
- Loading spinners or progress indicators
- Any UI that appears/disappears based on imperative logic

Traditional approaches often involve:

- Managing local or global state for UI visibility
- Using complex portal-based setups

`imperative-portal` simplifies this by providing a clean API where you think of React nodes as promises.

## Setup

```bash
npm install imperative-portal
```

Import the root component:

```typescript
import { ImperativePortal } from "imperative-portal";
```

Add the `<ImperativePortal />` element in your app, where you want your imperative nodes to be rendered. Typically near the root or even in a regular [portal](https://react.dev/reference/react-dom/createPortal), but it's up to you.

**Note**: If you need some React contexts inside the imperative nodes, put `<ImperativePortal />` as a descendant of their providers.

```tsx
function App() {
  return (
    <div>
      <ImperativePortal />
    </div>
  );
}
```

## Basic example

Open any React node programmatically:

```typescript
import { show } from "imperative-portal"

const promise = show(
  <div>
    <h2>Hello World!</h2>
    <button onClick={() => promise.resolve()}>Close</button>
  </div>
);

setTimeout(() => promise.resolve(), 5000)

await promise; // Resolved when "Close" is clicked, or 5 seconds have passed
```

Calling `promise.resolve` or `promise.reject` settles the promise and **unmounts the node**.

## Confirm dialog example

You can get back data from the imperative node via the promise:

```tsx
function confirm(message: string) {
  const promise = show<boolean>(
    <Dialog open onOpenChange={open => !open && promise.resolve(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => promise.resolve(true)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return promise;
}

if (await confirm("Delete this item?")) {
  console.log("Deleted!");
} else {
  console.log("Cancelled");
}
```

## useImperativePromise hook

For components that need to control their lifecycle from within, you can use closures through props as shown above, but simpler would be to use the `useImperativePromise` hook:

Using props:

```tsx
import { show, useImperativePromise } from "imperative-portal";

function SelfManagedDialog() {
  const promise = useImperativePromise();
  return (
    <Dialog open onOpenChange={open => !open && promise.reject()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Self-managed dialog</DialogTitle>
          <DialogDescription>
            This dialog controls its lifecycle from within without props
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => promise.resolve()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

try {
  await show(<SelfManagedDialog />);
} catch {
  console.log("Cancelled");
}
```

## Input dialog example

Here's an advanced example that captures user input from a text field:

```tsx
function NamePromptDialog() {
  const promise = useImperativePromise<string>();
  const [name, setName] = useState("");
  return (
    <Dialog open onOpenChange={open => !open && promise.reject()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your name</DialogTitle>
          <DialogDescription>Please enter your name.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name..."
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => promise.resolve(name)}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

try {
  const name = await show<string>(<NamePromptDialog />);
  console.log(`Hello, ${name}!`);
} catch {
  console.log("Name prompt cancelled");
}
```

## Node update

You can update the rendered node while it's still mounted:

```tsx
const promise = show(<div>Loading...</div>);

// Later, update the content
promise.update(<div>Done!</div>);

// Close it
promise.resolve();
```

You can also use a render function for dynamic content:

```tsx
const renderProgress = (value: number) => (
  <div>
    <div>Progress: {value}%</div>
    <progress value={value} max={100} />
  </div>
);

const promise = show(renderProgress(0));

// Later, update with new progress value
promise.update(renderProgress(50));

// Complete the progress
promise.update(renderProgress(100));

// Close it
promise.resolve();
```

## Advanced features

### Checking settlement status

```tsx
const promise = show(<MyComponent />);

// Check if the node has been closed
if (promise.settled) {
  console.log("Portal is closed");
}
```

### Wrap prop

The `ImperativePortal` component accepts an optional `wrap` prop that allows you to wrap active imperative nodes with custom JSX. Useful for basic customization.

```tsx
import { AnimatePresence } from "motion/react";

function App() {
  return (
    <ImperativePortal
      wrap={nodes => <AnimatePresence>{nodes}</AnimatePresence>}
    />
  );
}
```

### Advanced customization

For more advanced rendering scenarios that require access to individual node keys, promises or elements, use the `useImperativePortal` hook to create a custom imperative portal component:

```tsx
import { useImperativePortal } from "imperative-portal";
import { AnimatePresence, motion } from "motion/react";

function ImperativePortal() {
  const nodes = useImperativePortal();
  return (
    <AnimatePresence>
      {nodes.length > 0 && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => nodes.forEach(n => n.promise.reject())}
        />
      )}
      {nodes.map((n, i) => (
        <motion.div
          key={n.key}
          initial={{ opacity: 0, scale: 0.8, y: 20 + i * 10 }}
          animate={{ opacity: 1, scale: 1, y: i * 10 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 + i * 10 }}
        >
          {n.node}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

function App() {
  return (
    <div>
      <ImperativePortal />
    </div>
  );
}
```

**Note**: When wrapping individual nodes like in this example, make sure to include the `key={n.key}` prop on your wrapper element for proper React reconciliation.

## Multiple portal systems

Use `createImperativePortal` to create isolated portal systems that can be mounted at different locations:

```tsx
import { createImperativePortal } from "imperative-portal";

const [ModalPortal, showModal, useModalPortal] = createImperativePortal();
const [ToastPortal, showToast, useToastPortal] = createImperativePortal();

function App() {
  return (
    <div>
      <ModalPortal />
      <ToastPortal />
    </div>
  );
}

showModal(<MyModal />);
showToast(<MyToast />);
```

## API reference

### Component `ImperativePortal`

A React component that renders all active imperative nodes. Typically placed near the root of your app. Takes an optional `wrap` prop for basic customization.

### Function `show<T>(node: ReactNode): ImperativePromise<T>`

Renders a React node imperatively and returns a promise that tracks and controls the lifecycle of the node.

### Hook `useImperativePortal(): ImperativeNode<any>[]`

A React hook that returns the array of all active imperative nodes in the portal system. Each node is an object containing `key`, `node` (the React node), and `promise` properties. Useful for advanced customization.

### Hook `useImperativePromise<T>(): ImperativePromise<T>`

A React hook that provides access to the imperative portal promise from **within** a rendered imperative node. Must be used within components that are rendered via the `show` function. Enables self-contained imperative components that can control their own lifecycle.

### Function `createImperativePortal()`

Creates a new imperative portal system with its own store. Returns an `[ImperativePortal, show, useImperativePortal]` tuple.

## Types

### `ImperativePromise<T>`

Extends `Promise<T>` with additional properties:

- `settled: boolean` - Whether the promise has been resolved or rejected.
- `resolve(value: T): void` - Resolves the promise, unmounts the node.
- `reject(reason?: any): void` - Rejects the promise, unmounts the node.
- `update(node: ReactNode): void` - Updates the node.

### `ImperativeNode<T>`

- `key: string` - A unique identifier for the node, used for React reconciliation.
- `node: ReactNode` - The React node.
- `promise: ImperativePromise<T>` - The promise that controls the node's lifecycle.
