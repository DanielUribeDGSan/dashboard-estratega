import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type DashboardExportContextValue = {
  exportData: any;
  setExportData: React.Dispatch<React.SetStateAction<any>>;
};

const DashboardExportContext = createContext<DashboardExportContextValue | null>(null);

export const DashboardExportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exportData, setExportData] = useState<any>(null);
  const value = useMemo(() => ({ exportData, setExportData }), [exportData]);
  return <DashboardExportContext.Provider value={value}>{children}</DashboardExportContext.Provider>;
};

export const useDashboardExport = () => {
  const context = useContext(DashboardExportContext);
  if (!context) throw new Error('DashboardExportProvider no está disponible');
  return context;
};

export const useRegisterDashboardExport = (data: any) => {
  const { setExportData } = useDashboardExport();
  useEffect(() => {
    setExportData(data ?? null);
    return () => setExportData(null);
  }, [data, setExportData]);
};
