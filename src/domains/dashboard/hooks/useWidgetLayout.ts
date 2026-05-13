
import { useState, useEffect, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useWindowSizeClass, WindowSizeClass } from '../../../hooks/useAdaptiveWidth';
import { User } from '../../../types';
import { DEFAULT_DASHBOARD_SETTINGS } from '../../../constants';
import { updateUserDashboardSettings } from '../../../services/clinicalFirestoreService';
import { DashboardSettings, WidgetSize, DashboardView } from '../types';

export function useWidgetLayout(user: User | null, availableWidgetIds: string[]) {
  const viewClass = useWindowSizeClass();
  const [isEditing, setIsEditing] = useState(false);
  
  const [allOrders, setAllOrders] = useState<Record<string, string[]>>({});
  const [allVisibility, setAllVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [allSizes, setAllSizes] = useState<Record<string, Record<string, WidgetSize>>>({});

  const role = user?.role || 'clinician';

  // Current view data
  const widgetOrder = useMemo(() => allOrders[viewClass] || [], [allOrders, viewClass]);
  const widgetVisibility = useMemo(() => allVisibility[viewClass] || {}, [allVisibility, viewClass]);
  const widgetSizes = useMemo(() => allSizes[viewClass] || {}, [allSizes, viewClass]);

  const availableWidgetIdsKey = availableWidgetIds.sort().join(',');

  // Sync state with user profile and defaults
  useEffect(() => {
    if (!user) return;
    
    const views: DashboardView[] = ['compact', 'medium', 'expanded'];
    const newOrders: Record<string, string[]> = {};
    const newVisibility: Record<string, Record<string, boolean>> = {};
    const newSizes: Record<string, Record<string, WidgetSize>> = {};

    views.forEach(v => {
      const saved = user.dashboardSettings?.[v];
      const roleDefaults = (DEFAULT_DASHBOARD_SETTINGS[role] || DEFAULT_DASHBOARD_SETTINGS.clinician)[v];
      
      if (saved) {
        const cleanedOrder = (saved.order || []).filter((id: string) => availableWidgetIds.includes(id));
        const missingIds = availableWidgetIds.filter(id => !cleanedOrder.includes(id));
        newOrders[v] = [...cleanedOrder, ...missingIds];
        newVisibility[v] = saved.visibility || availableWidgetIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
        newSizes[v] = (saved.sizes || {}) as Record<string, WidgetSize>;
      } else {
        newOrders[v] = (roleDefaults.order || []).filter(id => availableWidgetIds.includes(id));
        const missingIds = availableWidgetIds.filter(id => !newOrders[v].includes(id));
        newOrders[v] = [...newOrders[v], ...missingIds];
        
        newVisibility[v] = { ...roleDefaults.visibility };
        newSizes[v] = { ...roleDefaults.sizes } as Record<string, WidgetSize>;
      }
    });

    setAllOrders(newOrders);
    setAllVisibility(newVisibility);
    setAllSizes(newSizes);
  }, [user?.id, role, availableWidgetIdsKey]);

  const toggleVisibility = (id: string) => {
    setAllVisibility(prev => ({
      ...prev,
      [viewClass]: {
        ...(prev[viewClass] || {}),
        [id]: !prev[viewClass]?.[id]
      }
    }));
  };

  const toggleSize = (id: string) => {
    const cycle: Record<WidgetSize, WidgetSize> = {
      '1x1': '1x2',
      '1x2': '2x1',
      '2x1': '2x2',
      '2x2': '2x3',
      '2x3': '4x2',
      '4x2': '1x1',
    };
    
    setAllSizes(prev => {
      const currentViewSizes = prev[viewClass] || {};
      const current = currentViewSizes[id] || '1x1';
      return { 
        ...prev, 
        [viewClass]: {
          ...currentViewSizes,
          [id]: cycle[current]
        }
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAllOrders((prev) => {
        const items = prev[viewClass] || [];
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return {
          ...prev,
          [viewClass]: arrayMove(items, oldIndex, newIndex)
        };
      });
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;
    
    const settingsToSave: DashboardSettings = {
      compact: {
        order: allOrders.compact || [],
        visibility: allVisibility.compact || {},
        sizes: allSizes.compact || {}
      },
      medium: {
        order: allOrders.medium || [],
        visibility: allVisibility.medium || {},
        sizes: allSizes.medium || {}
      },
      expanded: {
        order: allOrders.expanded || [],
        visibility: allVisibility.expanded || {},
        sizes: allSizes.expanded || {}
      }
    };

    setIsEditing(false);
    try {
      await updateUserDashboardSettings(user.id, settingsToSave);
    } catch (error) {
      console.error("Failed to save dashboard settings:", error);
      setIsEditing(true);
    }
  };

  const resetToDefaults = async () => {
    if (!user?.id) return;
    await updateUserDashboardSettings(user.id, null);
    window.location.reload();
  };

  return {
    isEditing,
    setIsEditing,
    viewClass,
    widgetOrder,
    widgetVisibility,
    widgetSizes,
    toggleVisibility,
    toggleSize,
    handleDragEnd,
    saveSettings,
    resetToDefaults
  };
}
