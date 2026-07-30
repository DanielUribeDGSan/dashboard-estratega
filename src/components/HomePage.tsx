import React from 'react';
import { HomeView } from './HomeView';
import { DashboardLayout } from './layout/DashboardLayout';
import { AccessGate } from './AccessGate';

export const HomePage: React.FC = () => (
  <AccessGate>
    <DashboardLayout currentPath="/">
      <HomeView />
    </DashboardLayout>
  </AccessGate>
);
