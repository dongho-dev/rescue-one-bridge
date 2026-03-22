import type React from 'react';
import type { UserRole } from "../../types/database";

export type CurrentPage = 'dashboard' | 'patients' | 'beds' | 'staff' | 'equipment' | 'request' | 'paramedic-dashboard' | 'admin';

export interface NavigationItem {
  id: CurrentPage;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}
