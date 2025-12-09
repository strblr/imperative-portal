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

Add the `<ImperativePortal />` element in your app, where you want your imperative nodes to be rendered:

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
import { imperativePortal } from "imperative-portal"

const handleClick = async () =>   {
  const promise = imperativePortal(
    <div>
      <h2>Hello World!</h2>
      <button onClick={() => promise.resolve()}>Close</button>
    </div>
  );
  await promise; // Resolved when "Close" is clicked
};
```

Calling `promise.resolve` or `promise.reject` settles the promise and unmounts the node.

## Confirm dialog example

You can get feedback from the imperative node via the promise:

```tsx
function confirm(message: string) {
  const promise = imperativePortal<boolean>(
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

const handleDelete = async () => {
  if (await confirm("Delete this item?")) {
    console.log("Deleted!");
  } else {
    console.log("Cancelled");
  }
};
```

## Input dialog example

You can collect anything from your imperative node:

```tsx
function NamePromptDialog({
  onResolve
}: {
  onResolve: (name: string | null) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog open onOpenChange={open => !open && onResolve(null)}>
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
          <Button onClick={() => onResolve(name.trim() || null)}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function promptName() {
  const promise = imperativePortal(
    <NamePromptDialog onResolve={name => promise.resolve(name)} />
  );
  return promise;
}

const name = await promptName();
if (name) {
  console.log(`Hello, ${name}!`);
} else {
  console.log("Name prompt cancelled");
}
```

## Advanced features

### Updating node

You can update the rendered node while it's still mounted:

```tsx
const promise = imperativePortal(<div>Loading...</div>);

// Later, update the content
promise.update(<div>Done!</div>);

// Close it
promise.resolve();
```

### Checking settlement status

```tsx
const promise = imperativePortal(<MyComponent />);

// Check if the portal has been closed
if (promise.settled) {
  console.log("Portal is closed");
}
```

## Multiple portal systems

Use `createImperativePortal` to create isolated portal systems that can be mounted at different locations:

```tsx
import { createImperativePortal } from "imperative-portal";

const [modalPortal, ModalPortal] = createImperativePortal();
const [toastPortal, ToastPortal] = createImperativePortal();

function App() {
  return (
    <div>
      <ModalPortal />
      <ToastPortal />
    </div>
  );
}

const showModal = () => modalPortal(<MyModal />);
const showToast = () => toastPortal(<MyToast />);
```

## API reference

### Function `createImperativePortal()`

Creates a new imperative portal system with its own store and rendering context. Returns an `[imperativePortal, ImperativePortal]` tuple.

### Function `imperativePortal<T>(node: ReactNode): ImperativePortalPromise<T>`

Renders a React node imperatively and returns a promise.

### Component `ImperativePortal`

A React component that renders all active imperative nodes. Typically placed near the root of your app.

### Interface `ImperativePortalPromise<T>`

Extends `Promise<T>` with additional properties:

- `settled: boolean` - Whether the promise has been resolved or rejected.
- `resolve(value: T): void` - Resolves the promise, unmounts the node.
- `reject(reason?: any): void` - Rejects the promise, unmounts the node.
- `update(node: ReactNode): void` - Updates the rendered node.
