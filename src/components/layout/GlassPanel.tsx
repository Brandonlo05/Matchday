import type { CSSProperties, ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'article' | 'button';
  onClick?: () => void;
}

export function GlassPanel({
  children,
  className = '',
  style,
  as: Tag = 'div',
  onClick,
}: GlassPanelProps) {
  return (
    <Tag
      onClick={onClick}
      className={`glass-panel ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
