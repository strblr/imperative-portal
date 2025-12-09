let counter = 0;

export function uniqueId() {
  return (counter++).toString(36);
}
