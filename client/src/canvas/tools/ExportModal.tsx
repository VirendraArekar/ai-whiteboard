import React, { useState } from 'react';
import { Download, FileImage, FileCode2, FileJson } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CanvasElement } from '../../types';
import { getElementsBoundingBox } from '../utils/coordinates';
import { notify } from '../../utils/toast';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  selectedIds: string[];
  boardTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  selectedIds,
  boardTitle,
}) => {
  const [format, setFormat] = useState<'png' | 'svg' | 'json'>('png');
  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const targetElements =
    scope === 'selected' && selectedIds.length > 0
      ? elements.filter((el) => selectedIds.includes(el.id))
      : elements;

  const handleExport = async () => {
    if (targetElements.length === 0) {
      notify.error('No elements found to export.', 'Export Error');
      return;
    }

    setIsExporting(true);
    const filename = `${boardTitle.toLowerCase().replace(/\s+/g, '_')}_export.${format}`;

    try {
      const bbox = getElementsBoundingBox(targetElements);
      const padding = 40;
      const minX = (bbox?.minX || 0) - padding;
      const minY = (bbox?.minY || 0) - padding;
      const width = (bbox?.width || 800) + padding * 2;
      const height = (bbox?.height || 600) + padding * 2;

      if (format === 'json') {
        const jsonContent = JSON.stringify(
          {
            version: '1.0',
            app: 'AI Whiteboard',
            exportedAt: new Date().toISOString(),
            title: boardTitle,
            elements: targetElements,
          },
          null,
          2,
        );
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        notify.success(`Exported ${targetElements.length} elements as ${filename}`, 'JSON Export');
      } else if (format === 'svg') {
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">\n`;
        svgContent += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#F8F9FA"/>\n`;

        for (const el of targetElements) {
          if (el.type === 'sticky_note' || el.type === 'sticky') {
            svgContent += `<g transform="translate(${el.positionX}, ${el.positionY})">
              <rect width="${el.width}" height="${el.height}" rx="16" fill="${el.data?.color || '#FEF08A'}" stroke="#eab308" stroke-width="1"/>
              <text x="16" y="32" font-family="Caveat, cursive" font-size="${el.data?.fontSize || 16}" fill="#1F2937">${el.data?.text || ''}</text>
            </g>\n`;
          } else if (el.type === 'text') {
            svgContent += `<text x="${el.positionX}" y="${el.positionY + (el.data?.fontSize || 18)}" font-family="${el.data?.fontFamily || 'Inter'}" font-size="${el.data?.fontSize || 18}" fill="${el.data?.color || '#1A1A1A'}">${el.data?.text || ''}</text>\n`;
          } else if (el.type === 'shape') {
            svgContent += `<rect x="${el.positionX}" y="${el.positionY}" width="${el.width}" height="${el.height}" rx="6" fill="${el.data?.fill || '#ffffff'}" stroke="${el.data?.stroke || '#2D6A4F'}" stroke-width="${el.data?.strokeWidth || 2}"/>\n`;
            if (el.data?.text || el.data?.label) {
              svgContent += `<text x="${el.positionX + el.width / 2}" y="${el.positionY + el.height / 2 + 5}" text-anchor="middle" font-family="Inter" font-size="14" fill="${el.data?.stroke || '#2D6A4F'}">${el.data.text || el.data.label}</text>\n`;
            }
          }
        }
        svgContent += `</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        notify.success(`Exported vector SVG as ${filename}`, 'SVG Export');
      } else {
        // PNG export using Canvas API
        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // retina 2x
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
          ctx.translate(-minX, -minY);

          // Background
          ctx.fillStyle = '#F8F9FA';
          ctx.fillRect(minX, minY, width, height);

          // Draw elements
          for (const el of targetElements) {
            ctx.save();
            ctx.translate(el.positionX + el.width / 2, el.positionY + el.height / 2);
            ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
            ctx.translate(-el.width / 2, -el.height / 2);

            if (el.type === 'sticky_note' || el.type === 'sticky') {
              ctx.fillStyle = el.data?.color || '#FEF08A';
              ctx.beginPath();
              ctx.roundRect ? ctx.roundRect(0, 0, el.width, el.height, 12) : ctx.rect(0, 0, el.width, el.height);
              ctx.fill();
              ctx.fillStyle = '#1F2937';
              ctx.font = `${el.data?.fontSize || 16}px Caveat, cursive`;
              ctx.fillText(el.data?.text || '', 12, 30);
            } else if (el.type === 'text') {
              ctx.fillStyle = el.data?.color || '#1A1A1A';
              ctx.font = `${el.data?.fontSize || 18}px ${el.data?.fontFamily || 'Inter'}`;
              ctx.fillText(el.data?.text || '', 0, el.data?.fontSize || 18);
            } else {
              ctx.fillStyle = el.data?.fill || '#ffffff';
              ctx.strokeStyle = el.data?.stroke || '#2D6A4F';
              ctx.lineWidth = el.data?.strokeWidth || 2;
              ctx.beginPath();
              ctx.roundRect ? ctx.roundRect(0, 0, el.width, el.height, 6) : ctx.rect(0, 0, el.width, el.height);
              ctx.fill();
              ctx.stroke();

              const label = el.data?.text || el.data?.label;
              if (label) {
                ctx.fillStyle = el.data?.stroke || '#2D6A4F';
                ctx.font = '14px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(label, el.width / 2, el.height / 2 + 5);
              }
            }
            ctx.restore();
          }

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(url);
              notify.success(`Exported high-resolution image as ${filename}`, 'PNG Export');
            }
          }, 'image/png');
        }
      }

      onClose();
    } catch (err: any) {
      notify.error('Export failed: ' + err.message, 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Whiteboard"
      description="Download canvas as high-resolution PNG, vector SVG, or JSON backup"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            File Format
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => setFormat('png')}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                format === 'png'
                  ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <FileImage className="w-5 h-5 text-[#2D6A4F] dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold">PNG Image</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">High-DPI 2x</p>
              </div>
            </button>

            <button
              onClick={() => setFormat('svg')}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                format === 'svg'
                  ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <FileCode2 className="w-5 h-5 text-[#2D6A4F] dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold">Vector SVG</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Scalable</p>
              </div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                format === 'json'
                  ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              <FileJson className="w-5 h-5 text-[#2D6A4F] dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold">JSON Data</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Full Backup</p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Export Scope
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScope('all')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                scope === 'all'
                  ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              Entire Board ({elements.length})
            </button>
            <button
              onClick={() => setScope('selected')}
              disabled={selectedIds.length === 0}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                scope === 'selected'
                  ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              Selected Elements ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
