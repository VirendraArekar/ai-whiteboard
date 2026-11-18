import { CanvasElement } from '../../types';

export interface CollaborationEmitter {
  emitElementCreate: (element: any) => void;
  emitElementDelete: (elementId: string) => void;
  emitBulkUpdate: (elements: any[]) => void;
}

export function syncHistoryChange(
  beforeElements: CanvasElement[],
  afterElements: CanvasElement[],
  emitter: CollaborationEmitter,
) {
  const beforeMap = new Map(beforeElements.map((e) => [e.id, e]));
  const afterMap = new Map(afterElements.map((e) => [e.id, e]));

  // 1. Elements deleted in after state
  const deleted = beforeElements.filter((e) => !afterMap.has(e.id));
  deleted.forEach((d) => emitter.emitElementDelete(d.id));

  // 2. Elements created in after state
  const created = afterElements.filter((e) => !beforeMap.has(e.id));
  created.forEach((c) => emitter.emitElementCreate(c));

  // 3. Elements modified between before and after
  const modified: CanvasElement[] = [];
  for (const afterEl of afterElements) {
    const beforeEl = beforeMap.get(afterEl.id);
    if (beforeEl) {
      if (
        beforeEl.positionX !== afterEl.positionX ||
        beforeEl.positionY !== afterEl.positionY ||
        beforeEl.width !== afterEl.width ||
        beforeEl.height !== afterEl.height ||
        beforeEl.rotation !== afterEl.rotation ||
        beforeEl.zIndex !== afterEl.zIndex ||
        JSON.stringify(beforeEl.data) !== JSON.stringify(afterEl.data)
      ) {
        modified.push(afterEl);
      }
    }
  }

  if (modified.length > 0) {
    emitter.emitBulkUpdate(modified);
  }
}
