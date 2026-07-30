import React from 'react';
import { DashboardLayout } from './layout/DashboardLayout';
import { SectionsView } from './SectionsView';
import { AccessGate } from './AccessGate';

export const SectionsPage: React.FC = () => <AccessGate><DashboardLayout currentPath="/sections"><SectionsView /></DashboardLayout></AccessGate>;
