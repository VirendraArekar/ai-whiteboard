import React from 'react';
import { ElementProps } from './StickyNoteElement';

export const ChartElement: React.FC<
  ElementProps & { onEditChart?: (element: any) => void }
> = ({ element, onEditChart }) => {
  const chartType = element.data?.chartType || 'bar';
  const title = element.data?.title || 'Data Chart';
  const labels: string[] = element.data?.labels || ['Q1', 'Q2', 'Q3', 'Q4'];
  const datasets = element.data?.datasets || [
    {
      label: 'Series 1',
      data: [35, 60, 45, 80],
      backgroundColor: ['#2D6A4F', '#40916C', '#52B788', '#74C69D'],
    },
  ];

  const primaryData: number[] = datasets[0]?.data || [10, 20, 30, 40];
  const colors: string[] = datasets[0]?.backgroundColor || [
    '#2D6A4F',
    '#40916C',
    '#52B788',
    '#74C69D',
    '#95D5B2',
  ];

  const maxVal = Math.max(...primaryData, 1);
  const w = element.width;
  const h = element.height;

  const renderChartContent = () => {
    switch (chartType) {
      case 'pie':
      case 'donut': {
        const total = primaryData.reduce((sum, val) => sum + val, 0) || 1;
        let cumulativeAngle = 0;
        const radius = Math.min(w, h) * 0.32;
        const innerRadius = chartType === 'donut' ? radius * 0.55 : 0;
        const centerX = w / 2;
        const centerY = h / 2 + 10;

        return (
          <g>
            {primaryData.map((val, idx) => {
              const sliceAngle = (val / total) * 2 * Math.PI;
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + sliceAngle;
              cumulativeAngle += sliceAngle;

              const x1 = centerX + radius * Math.cos(startAngle);
              const y1 = centerY + radius * Math.sin(startAngle);
              const x2 = centerX + radius * Math.cos(endAngle);
              const y2 = centerY + radius * Math.sin(endAngle);

              const ix1 = centerX + innerRadius * Math.cos(endAngle);
              const iy1 = centerY + innerRadius * Math.sin(endAngle);
              const ix2 = centerX + innerRadius * Math.cos(startAngle);
              const iy2 = centerY + innerRadius * Math.sin(startAngle);

              const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

              const d =
                chartType === 'donut'
                  ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`
                  : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={idx}
                  d={d}
                  fill={colors[idx % colors.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        );
      }

      case 'line': {
        const plotH = h - 70;
        const plotW = w - 60;
        const startX = 40;
        const startY = h - 35;

        const points = primaryData.map((val, idx) => {
          const x = startX + (idx / Math.max(primaryData.length - 1, 1)) * plotW;
          const y = startY - (val / maxVal) * plotH;
          return { x, y, val };
        });

        const linePath = points.reduce(
          (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
          '',
        );

        return (
          <g>
            <path
              d={linePath}
              fill="none"
              stroke="#2D6A4F"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={4.5} fill="#ffffff" stroke="#2D6A4F" strokeWidth={2} />
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#1B4332"
                  fontWeight="bold"
                >
                  {p.val}
                </text>
              </g>
            ))}
          </g>
        );
      }

      case 'bar':
      default: {
        const plotH = h - 75;
        const plotW = w - 50;
        const barWidth = Math.max(12, (plotW / primaryData.length) * 0.6);
        const gap = plotW / primaryData.length;

        return (
          <g>
            {primaryData.map((val, idx) => {
              const barH = (val / maxVal) * plotH;
              const x = 35 + idx * gap + (gap - barWidth) / 2;
              const y = h - 35 - barH;

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx={4}
                    fill={colors[idx % colors.length]}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1F2937"
                    fontWeight="bold"
                  >
                    {val}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={h - 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6B7280"
                  >
                    {labels[idx] || `Item ${idx + 1}`}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }
    }
  };

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditChart?.(element);
      }}
      className="w-full h-full bg-white rounded-3xl border border-gray-200 shadow-md p-4 flex flex-col justify-between select-none overflow-hidden cursor-pointer hover:border-[#2D6A4F]/50 transition-colors"
    >
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <h4 className="font-heading font-bold text-xs text-gray-900 truncate">{title}</h4>
        <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#E8F5E9] px-2 py-0.5 rounded-full uppercase tracking-wider">
          {chartType}
        </span>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <svg className="w-full h-full overflow-visible">{renderChartContent()}</svg>
      </div>
    </div>
  );
};
