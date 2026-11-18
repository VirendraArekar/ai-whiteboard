import { describe, it, expect } from 'vitest';
import {
  screenToWorld,
  worldToScreen,
  getElementBoundingBox,
  getElementsBoundingBox,
  isPointInBox,
  boxesIntersect,
} from './coordinates';

describe('Coordinates & Bounding Box Utilities', () => {
  describe('screenToWorld & worldToScreen', () => {
    it('should transform coordinates correctly with zoom and pan', () => {
      const pan = { x: 100, y: 50 };
      const zoom = 2;

      const screenPoint = { x: 300, y: 250 };
      const worldPoint = screenToWorld(screenPoint.x, screenPoint.y, pan, zoom);

      expect(worldPoint.x).toBe(100); // (300 - 100) / 2
      expect(worldPoint.y).toBe(100); // (250 - 50) / 2

      const backToScreen = worldToScreen(worldPoint.x, worldPoint.y, pan, zoom);
      expect(backToScreen.x).toBe(screenPoint.x);
      expect(backToScreen.y).toBe(screenPoint.y);
    });
  });

  describe('getElementBoundingBox', () => {
    it('should calculate element bounding box properly', () => {
      const el = { positionX: 50, positionY: 70, width: 120, height: 80 };
      const box = getElementBoundingBox(el);

      expect(box.minX).toBe(50);
      expect(box.minY).toBe(70);
      expect(box.maxX).toBe(170);
      expect(box.maxY).toBe(150);
      expect(box.width).toBe(120);
      expect(box.height).toBe(80);
    });
  });

  describe('getElementsBoundingBox', () => {
    it('should calculate union bounding box across multiple elements', () => {
      const elements = [
        { positionX: 10, positionY: 20, width: 50, height: 50 },
        { positionX: 100, positionY: 200, width: 80, height: 60 },
      ];
      const union = getElementsBoundingBox(elements);

      expect(union).not.toBeNull();
      expect(union!.minX).toBe(10);
      expect(union!.minY).toBe(20);
      expect(union!.maxX).toBe(180);
      expect(union!.maxY).toBe(260);
      expect(union!.width).toBe(170);
      expect(union!.height).toBe(240);
    });

    it('should return null for empty elements array', () => {
      expect(getElementsBoundingBox([])).toBeNull();
    });
  });

  describe('isPointInBox & boxesIntersect', () => {
    const box = { minX: 10, minY: 10, maxX: 100, maxY: 100, width: 90, height: 90 };

    it('should return true for points inside bounding box', () => {
      expect(isPointInBox({ x: 50, y: 50 }, box)).toBe(true);
      expect(isPointInBox({ x: 10, y: 10 }, box)).toBe(true);
      expect(isPointInBox({ x: 100, y: 100 }, box)).toBe(true);
    });

    it('should return false for points outside bounding box', () => {
      expect(isPointInBox({ x: 5, y: 50 }, box)).toBe(false);
      expect(isPointInBox({ x: 105, y: 50 }, box)).toBe(false);
    });

    it('should correctly detect box intersections', () => {
      const boxA = { minX: 0, minY: 0, maxX: 50, maxY: 50, width: 50, height: 50 };
      const boxB = { minX: 25, minY: 25, maxX: 75, maxY: 75, width: 50, height: 50 };
      const boxC = { minX: 100, minY: 100, maxX: 150, maxY: 150, width: 50, height: 50 };

      expect(boxesIntersect(boxA, boxB)).toBe(true);
      expect(boxesIntersect(boxA, boxC)).toBe(false);
    });
  });
});
