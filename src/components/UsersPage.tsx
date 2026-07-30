import React from 'react';
import { DashboardLayout } from './layout/DashboardLayout';
import { UsersView } from './UsersView';
import { AccessGate } from './AccessGate';

export const UsersPage: React.FC = () => <AccessGate><DashboardLayout currentPath="/users"><UsersView /></DashboardLayout></AccessGate>;
