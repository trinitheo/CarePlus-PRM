
export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '4x2';
export type DashboardView = 'compact' | 'medium' | 'expanded';

export interface WidgetSettings {
  order: string[];
  visibility: Record<string, boolean>;
  sizes: Record<string, WidgetSize>;
}

export type DashboardSettings = Record<DashboardView, WidgetSettings>;
