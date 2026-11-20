import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../store/canvasStore';
import { CanvasElement } from '../../types';

// Distance squared from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegmentSquared(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

function getStrokeWorldPoints(el: CanvasElement): [number, number][] {
  const raw = el.data?.points || [];
  if (raw.length === 0) return [];
  const firstX = raw[0][0];
  const isLegacyWorld =
    el.positionX > 0 &&
    firstX >= el.positionX - 5 &&
    firstX <= el.positionX + el.width + 50;

  if (isLegacyWorld) {
    return raw.map(([x, y]: number[]) => [x, y]);
  }
  return raw.map(([rx, ry]: number[]) => [el.positionX + rx, el.positionY + ry]);
}

describe('Canvas Store & Drawing Behavior', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      elements: [],
      selectedIds: [],
      currentTool: 'select',
      strokeColor: '#2D6A4F',
      strokeWidth: 3,
      past: [],
      future: [],
    });
  });

  it('addElement with selectIt = false does NOT select the element (No selection box)', () => {
    const stroke: CanvasElement = {
      id: 'stroke-1',
      whiteboardId: 'b-1',
      type: 'freehand',
      positionX: 100,
      positionY: 100,
      width: 50,
      height: 50,
      rotation: 0,
      zIndex: 1,
      data: {
        points: [[0, 0, 0.5], [50, 50, 0.5]],
        stroke: '#E63946',
        strokeWidth: 4,
        tool: 'pen',
      },
    };

    useCanvasStore.getState().addElement(stroke, false);

    const state = useCanvasStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.selectedIds).toHaveLength(0); // MUST be empty, no box!
  });

  it('switching tools to pen, pencil, or eraser clears selectedIds automatically', () => {
    useCanvasStore.setState({ selectedIds: ['element-123'] });
    expect(useCanvasStore.getState().selectedIds).toEqual(['element-123']);

    useCanvasStore.getState().setCurrentTool('pen');
    expect(useCanvasStore.getState().selectedIds).toEqual([]);

    useCanvasStore.setState({ selectedIds: ['element-123'] });
    useCanvasStore.getState().setCurrentTool('eraser');
    expect(useCanvasStore.getState().selectedIds).toEqual([]);
  });

  it('updates strokeColor and strokeWidth for draw color switching', () => {
    useCanvasStore.getState().setStrokeColor('#E63946'); // Red
    useCanvasStore.getState().setStrokeWidth(8); // Thick

    const state = useCanvasStore.getState();
    expect(state.strokeColor).toBe('#E63946');
    expect(state.strokeWidth).toBe(8);
  });

  it('undo and redo restore elements accurately', () => {
    const el1: CanvasElement = {
      id: 'el-1',
      whiteboardId: 'b-1',
      type: 'sticky_note',
      positionX: 50,
      positionY: 50,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1,
      data: { text: 'Note 1' },
    };

    useCanvasStore.getState().addElement(el1, true);
    expect(useCanvasStore.getState().elements).toHaveLength(1);

    const undone = useCanvasStore.getState().undo();
    expect(undone).toHaveLength(0);
    expect(useCanvasStore.getState().elements).toHaveLength(0);

    const redone = useCanvasStore.getState().redo();
    expect(redone).toHaveLength(1);
    expect(useCanvasStore.getState().elements).toHaveLength(1);
  });
});

describe('Eraser Hit Testing Logic', () => {
  const diagonalStroke: CanvasElement = {
    id: 'stroke-diag',
    whiteboardId: 'b-1',
    type: 'freehand',
    positionX: 100,
    positionY: 100,
    width: 200,
    height: 200,
    rotation: 0,
    zIndex: 1,
    data: {
      // Diagonal line from world (100, 100) to (300, 300)
      points: [[0, 0, 0.5], [100, 100, 0.5], [200, 200, 0.5]],
      stroke: '#2D6A4F',
    },
  };

  it('detects hit when eraser is close to stroke segment (e.g. at (150, 150))', () => {
    const points = getStrokeWorldPoints(diagonalStroke);
    const eraserPoint = { x: 152, y: 151 };
    const eraserRadiusSq = 16 * 16;

    let hit = false;
    for (let i = 0; i < points.length - 1; i++) {
      const d2 = distToSegmentSquared(
        eraserPoint.x,
        eraserPoint.y,
        points[i][0],
        points[i][1],
        points[i + 1][0],
        points[i + 1][1],
      );
      if (d2 <= eraserRadiusSq) {
        hit = true;
        break;
      }
    }

    expect(hit).toBe(true);
  });

  it('does NOT falsely hit empty space within the bounding box (e.g. at (110, 290))', () => {
    const points = getStrokeWorldPoints(diagonalStroke);
    // (110, 290) is inside the [100, 100, 300, 300] bounding box, but far from the diagonal!
    const eraserPoint = { x: 110, y: 290 };
    const eraserRadiusSq = 16 * 16;

    let hit = false;
    for (let i = 0; i < points.length - 1; i++) {
      const d2 = distToSegmentSquared(
        eraserPoint.x,
        eraserPoint.y,
        points[i][0],
        points[i][1],
        points[i + 1][0],
        points[i + 1][1],
      );
      if (d2 <= eraserRadiusSq) {
        hit = true;
        break;
      }
    }

    expect(hit).toBe(false);
  });
});

describe('Area Eraser (Stroke Slicing)', () => {
  const horizontalStroke: CanvasElement = {
    id: 'stroke-h',
    whiteboardId: 'b-1',
    type: 'freehand',
    positionX: 100,
    positionY: 200,
    width: 200,
    height: 10,
    rotation: 0,
    zIndex: 1,
    data: {
      // Horizontal line from (100, 200) to (300, 200)
      points: [
        [0, 0, 0.5],
        [50, 0, 0.5],
        [100, 0, 0.5],
        [150, 0, 0.5],
        [200, 0, 0.5],
      ],
      stroke: '#2D6A4F',
    },
  };

  it('slices stroke in the middle into 2 separate sub-strokes when erasing middle area', async () => {
    const { sliceStrokeAtPoint } = await import('./strokeEraser');
    // Erase at world (200, 200) with radius 16
    const res = sliceStrokeAtPoint(horizontalStroke, 200, 200, 16);

    expect(res.modified).toBe(true);
    expect(res.survivingPieces.length).toBe(2);

    // Piece 1 is before the eraser
    expect(res.survivingPieces[0].positionX).toBe(100);
    expect(res.survivingPieces[0].id).toBe('stroke-h'); // Keeps ID

    // Piece 2 is after the eraser
    expect(res.survivingPieces[1].positionX).toBeGreaterThan(200);
  });

  it('trims end of stroke when erasing only the end portion', async () => {
    const { sliceStrokeAtPoint } = await import('./strokeEraser');
    // Erase at end of stroke: (290, 200) with radius 16
    const res = sliceStrokeAtPoint(horizontalStroke, 290, 200, 16);

    expect(res.modified).toBe(true);
    expect(res.survivingPieces.length).toBe(1);
    expect(res.survivingPieces[0].id).toBe('stroke-h');
    expect(res.survivingPieces[0].width).toBeLessThan(200);
  });

  it('does not modify stroke when eraser is outside its area', async () => {
    const { sliceStrokeAtPoint } = await import('./strokeEraser');
    // Erase far above: (200, 50)
    const res = sliceStrokeAtPoint(horizontalStroke, 200, 50, 16);

    expect(res.modified).toBe(false);
    expect(res.survivingPieces.length).toBe(1);
  });

  it('fully removes stroke when eraser covers the entire line', async () => {
    const { sliceStrokeAtPoint } = await import('./strokeEraser');
    // Erase with huge radius covering the whole line
    const res = sliceStrokeAtPoint(horizontalStroke, 200, 200, 300);

    expect(res.modified).toBe(true);
    expect(res.survivingPieces.length).toBe(0);
  });
});
