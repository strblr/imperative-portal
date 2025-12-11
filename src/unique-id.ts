let counter = 0;

export function uniqueId() {
  return "imperative-node-" + (counter++).toString(36);
}
