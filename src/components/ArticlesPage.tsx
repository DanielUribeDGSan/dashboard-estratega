import React from 'react';
import { ArticlesView } from './ArticlesView';
import { DashboardLayout } from './layout/DashboardLayout';
import { AccessGate } from './AccessGate';

export const ArticlesPage: React.FC = () => <AccessGate><DashboardLayout currentPath="/articles"><ArticlesView /></DashboardLayout></AccessGate>;
