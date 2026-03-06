declare module "d3-force-3d" {
  export function forceManyBody(): unknown;
  export function forceX<TNode = unknown>(x?: number | ((d: TNode) => number)): unknown;
  export function forceY<TNode = unknown>(y?: number | ((d: TNode) => number)): unknown;
  export function forceZ<TNode = unknown>(z?: number | ((d: TNode) => number)): unknown;
  export function forceCollide<TNode = unknown>(radius?: number | ((d: TNode) => number)): unknown;
  export function forceLink<TLink = unknown>(links?: TLink[]): unknown;
}
