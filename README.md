# imperative-portal

A React library for rendering components imperatively with promise-based control. Perfect for modals, dialogs, notifications, and any UI that needs programmatic lifecycle management.

## Installation

```bash
npm install imperative-portal
```

## Setup

Import the root component:

```typescript
import { ImperativePortal } from "imperative-portal";
```

Add the `<ImperativePortal />` element in your app, where you want your imperative nodes to be rendered. Typically near the root or even in a regular [portal](https://react.dev/reference/react-dom/createPortal), but it's up to you.

```tsx
function App() {
  return (
    <div>
      <ImperativePortal />
    </div>
  );
}
```

**Note**: If you need some React contexts inside the imperative nodes, put `<ImperativePortal />` as a descendant of their providers.

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

await promise; // Resolved when "Close" is clicked
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

## useImperativeNode hook

For components that need to control their lifecycle from within, you can use closures through props as shown above, but simpler would be to use the `useImperativeNode` hook:

Using props:

```tsx
import { useImperativeNode } from "imperative-portal";

function SelfManagedDialog() {
  const promise = useImperativeNode();
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
  const promise = useImperativeNode<string>();
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

## Advanced features

### Updating node

You can update the rendered node while it's still mounted:

```tsx
const promise = show(<div>Loading...</div>);

// Later, update the content
promise.update(<div>Done!</div>);

// Close it
promise.resolve();
```

### Checking settlement status

```tsx
const promise = show(<MyComponent />);

// Check if the portal has been closed
if (promise.settled) {
  console.log("Portal is closed");
}
```

### Wrap prop

The `ImperativePortal` component accepts an optional `wrap` prop that allows you to wrap all rendered imperative nodes with additional JSX.

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

## Multiple portal systems

Use `createImperativePortal` to create isolated portal systems that can be mounted at different locations:

```tsx
import { createImperativePortal } from "imperative-portal";

const [ModalPortal, showModal] = createImperativePortal();
const [ToastPortal, showToast] = createImperativePortal();

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

### Function `createImperativePortal()`

Creates a new imperative portal system with its own store and rendering context. Returns an `[ImperativePortal, show]` tuple.

### Component `ImperativePortal`

A React component that renders all active imperative nodes. Typically placed near the root of your app. Takes an optional `wrap` prop.

### Function `show<T>(node: ReactNode): ImperativeNodePromise<T>`

Renders a React node imperatively and returns a promise that tracks and controls the lifecycle of the node.

### Hook `useImperativeNode<T>(): ImperativeNodePromise<T>`

A React hook that provides access to the imperative portal promise from within a rendered imperative node. Must be used within components that are rendered via the `show` function. Enables self-contained imperative components that can control their own lifecycle.

### Interface `ImperativeNodePromise<T>`

Extends `Promise<T>` with additional properties:

- `settled: boolean` - Whether the promise has been resolved or rejected.
- `resolve(value: T): void` - Resolves the promise, unmounts the node.
- `reject(reason?: any): void` - Rejects the promise, unmounts the node.
- `update(node: ReactNode): void` - Updates the node.
