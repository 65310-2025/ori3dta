import { Edge, Point } from "../types/cp";
import { getOtherVertex } from "./cp";

export interface EdgeLike {
  vertex1: Point;
  vertex2: Point;
}

export const edgeLength = (e: EdgeLike) => {
  const dx = e.vertex1.x - e.vertex2.x;
  const dy = e.vertex1.y - e.vertex2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Compute the cross product of \vec{AB} and \vec{AC}
export const cross = (a: Point, b: Point, c: Point) => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

// Compute the intersection of lines (not line segments!) AB and CD, assumes lines are not parallel
export const getIntersection = (a: Point, b: Point, c: Point, d: Point) => {
  const a1 = b.y - a.y;
  const b1 = a.x - b.x;
  const c1 = a.x * a1 + a.y * b1;
  const a2 = d.y - c.y;
  const b2 = c.x - d.x;
  const c2 = c.x * a2 + c.y * b2;
  const det = a1 * b2 - a2 * b1;
  return { x: (b2 * c1 - b1 * c2) / det, y: (a1 * c2 - a2 * c1) / det };
};

// Determine whether C is on segment AB (assumes A, B, and C are collinear)
export const onSegment = (a: Point, b: Point, c: Point) => {
  return (
    c.x <= Math.max(a.x, b.x) &&
    c.x >= Math.min(a.x, b.x) &&
    c.y <= Math.max(a.y, b.y) &&
    c.y >= Math.min(a.y, b.y)
  );
};

export const intersectSegments = (
  a: Point,
  b: Point,
  c: Point,
  d: Point,
): Point | null | undefined => {
  const c1 = cross(a, b, c);
  const c2 = cross(a, b, d);
  const c3 = cross(c, d, a);
  const c4 = cross(c, d, b);

  if (Math.sign(c1 * c2) === -1 && Math.sign(c3 * c4) === -1) {
    return getIntersection(a, b, c, d);
  }
  if (c1 === 0 && c2 === 0 && (onSegment(a, b, c) || onSegment(a, b, d))) {
    return undefined;
  }
  if (c1 === 0 && onSegment(a, b, c)) {
    return c;
  }
  if (c2 === 0 && onSegment(a, b, d)) {
    return d;
  }
  if (c3 === 0 && onSegment(c, d, a)) {
    return a;
  }
  if (c4 === 0 && onSegment(c, d, b)) {
    return b;
  }
  return null;
};

export const getEdgeAngle = (e: Edge, reference: Point): number => {
  const other = getOtherVertex(e, reference);
  return Math.atan2(other.y - reference.y, other.x - reference.x);
};

// Distance from C to line AB
export const lineDistance = (e: EdgeLike, c: Point) => {
  const { vertex1: a, vertex2: b } = e;
  const c1 = b.y - a.y;
  const c2 = a.x - b.x;
  const c3 = c1 * a.x + c2 * a.y;
  return Math.abs(c.x * c1 + c.y * c2 - c3) / Math.sqrt(c1 * c1 + c2 * c2);
};

// Project C onto line AB
export const projectToLine = (e: EdgeLike, c: Point) => {
  const { vertex1: a, vertex2: b } = e;
  const c1 = b.x - a.x;
  const c2 = b.y - a.y;
  const dot = c1 * (c.x - a.x) + c2 * (c.y - a.y);
  const norm = c1 * c1 + c2 * c2;
  return {
    x: (c1 * dot) / norm + a.x,
    y: (c2 * dot) / norm + a.y,
  };
};
