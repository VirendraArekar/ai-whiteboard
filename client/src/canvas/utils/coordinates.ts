export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  pan: Point,
  zoom: number,
): Point {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  pan: Point,
  zoom: number,
): Point {
  return {
    x: worldX * zoom + pan.x,
    y: worldY * zoom + pan.y,
  };
}

export function getElementBoundingBox(el: {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}): BoundingBox {
  return {
    minX: el.positionX,
    minY: el.positionY,
    maxX: el.positionX + el.width,
    maxY: el.positionY + el.height,
    width: el.width,
    height: el.height,
  };
}

export function getElementsBoundingBox(
  elements: Array<{
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>,
): BoundingBox | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.positionX);
    minY = Math.min(minY, el.positionY);
    maxX = Math.max(maxX, el.positionX + el.width);
    maxY = Math.max(maxY, el.positionY + el.height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isPointInBox(p: Point, box: BoundingBox): boolean {
  return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}
