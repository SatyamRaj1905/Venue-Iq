import type { NodeId } from "./types";

export interface RouteQueueEntry {
  readonly distance: number;
  readonly nodeId: NodeId;
}

function compareEntries(left: RouteQueueEntry, right: RouteQueueEntry): number {
  if (left.distance !== right.distance) {
    return left.distance - right.distance;
  }
  if (left.nodeId === right.nodeId) {
    return 0;
  }
  return left.nodeId < right.nodeId ? -1 : 1;
}

/** Binary min-heap with stable node-id ordering for equal route costs. */
export class RoutePriorityQueue {
  readonly #entries: RouteQueueEntry[] = [];

  public push(entry: RouteQueueEntry): void {
    this.#entries.push(entry);
    let index = this.#entries.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.#entries[parentIndex];
      if (parent === undefined || compareEntries(parent, entry) <= 0) {
        break;
      }
      this.#entries[index] = parent;
      index = parentIndex;
    }
    this.#entries[index] = entry;
  }

  public pop(): RouteQueueEntry | undefined {
    const first = this.#entries[0];
    const last = this.#entries.pop();
    if (first === undefined || last === undefined || this.#entries.length === 0) {
      return first;
    }

    let index = 0;
    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = leftIndex + 1;
      const left = this.#entries[leftIndex];
      const right = this.#entries[rightIndex];
      if (left === undefined) {
        break;
      }
      const childIndex =
        right !== undefined && compareEntries(right, left) < 0 ? rightIndex : leftIndex;
      const child = this.#entries[childIndex];
      if (child === undefined || compareEntries(last, child) <= 0) {
        break;
      }
      this.#entries[index] = child;
      index = childIndex;
    }
    this.#entries[index] = last;
    return first;
  }
}
