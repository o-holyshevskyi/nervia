declare module 'd3-force-3d' {
    export function forceManyBody(): any;
    export function forceX(x?: number | ((d: any) => number)): any;
    export function forceY(y?: number | ((d: any) => number)): any;
    export function forceZ(z?: number | ((d: any) => number)): any;
    export function forceCollide(radius?: number | ((d: any) => number)): any;
    export function forceLink(links?: any[]): any;
}
