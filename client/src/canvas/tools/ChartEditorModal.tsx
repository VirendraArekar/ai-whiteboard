import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CanvasElement } from '../../types';

export interface ChartEditorModalProps {
  element: CanvasElement | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedData: any) => void;
}

export const ChartEditorModal: React.FC<ChartEditorModalProps> = ({
  element,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [labelsStr, setLabelsStr] = useState('');
  const [valuesStr, setValuesStr] = useState('');

  useEffect(() => {
    if (element) {
      setTitle(element.data?.title || 'Data Chart');
      setChartType(element.data?.chartType || 'bar');
      setLabelsStr((element.data?.labels || ['Q1', 'Q2', 'Q3', 'Q4']).join(', '));
      const dataset = element.data?.datasets?.[0]?.data || [25, 45, 60, 80];
      setValuesStr(dataset.join(', '));
    }
  }, [element]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!element) return;

    const labels = labelsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const data = valuesStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    const updatedData = {
      ...element.data,
      title: title.trim(),
      chartType,
      labels,
      datasets: [
        {
          label: title.trim(),
          data,
          backgroundColor: element.data?.datasets?.[0]?.backgroundColor || [
            '#2D6A4F',
            '#40916C',
            '#52B788',
            '#74C69D',
            '#95D5B2',
          ],
        },
      ],
    };

    onSave(element.id, updatedData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Chart Data"
      description="Customize series values, labels, and chart type"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Chart Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Chart Visualization Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'bar', label: 'Bar' },
              { id: 'line', label: 'Line' },
              { id: 'pie', label: 'Pie' },
              { id: 'donut', label: 'Donut' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setChartType(t.id)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  chartType === t.id
                    ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Categories / Labels (comma-separated)"
          value={labelsStr}
          onChange={(e) => setLabelsStr(e.target.value)}
          placeholder="Jan, Feb, Mar, Apr"
          required
        />

        <Input
          label="Data Values (comma-separated numbers)"
          value={valuesStr}
          onChange={(e) => setValuesStr(e.target.value)}
          placeholder="12, 34, 56, 78"
          required
        />

        <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Chart
          </Button>
        </div>
      </form>
    </Modal>
  );
};
