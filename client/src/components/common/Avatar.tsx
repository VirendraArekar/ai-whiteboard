import React from 'react';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  showOnline?: boolean;
  roleBadge?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  color,
  showOnline = false,
  roleBadge,
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getBackgroundColor = (str: string) => {
    if (color) return color;
    const colors = [
      '#2D6A4F',
      '#1B4332',
      '#40916C',
      '#E76F51',
      '#457B9D',
      '#9B5DE5',
      '#F15BB5',
      '#3A86FF',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="relative inline-flex shrink-0 select-none">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-white shadow-xs`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-xs`}
          style={{ backgroundColor: getBackgroundColor(name) }}
          title={name}
        >
          {getInitials(name)}
        </div>
      )}

      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-white" />
      )}

      {roleBadge && (
        <span className="absolute -top-1 -right-1 text-[9px] font-extrabold uppercase px-1 py-0.2 bg-gray-800 text-white rounded-md tracking-wider">
          {roleBadge[0]}
        </span>
      )}
    </div>
  );
};
