
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Assets from './components/Assets';
import AIDiagnostic from './components/AIDiagnostic';
import WorkOrders from './components/WorkOrders';
import MasterDataEditor from './components/MasterData';
import Inventory from './components/Inventory';
import PartsRequests from './components/PartsRequests';
import AnnualRequests from './components/AnnualRequests';
import { MasterData } from './types';

const INITIAL_MASTER_DATA: MasterData = {
  departments: ['Maintenance', 'Production', 'Facilities', 'IT Infrastructure', 'Logistics', 'Quality Control', 'Safety'],
  brands: ['Siemens', 'Carrier', 'Enerpac', 'Caterpillar', 'ABB', 'Schneider Electric', 'Bosch', 'General Electric'],
  assetTypes: ['Centrifugal Pump', 'Electric Motor', 'HVAC Unit', 'Air Compressor', 'Hydraulic Press', 'Conveyor System', 'Generator'],
  powerRatings: ['110V AC', '220V AC', '480V 3-Phase', '24V DC', 'Hydraulic', 'Pneumatic'],
  years: Array.from({ length: 16 }, (_, i) => (2025 - i).toString())
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [masterData, setMasterData] = useState<MasterData>(INITIAL_MASTER_DATA);

  const handleUpdateMasterData = (newData: MasterData) => {
    setMasterData(newData);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <Assets masterData={masterData} />;
      case 'workorders':
        return <WorkOrders />;
      case 'inventory':
        return <Inventory />;
      case 'requests':
        return <PartsRequests />;
      case 'annual':
        return <AnnualRequests />;
      case 'ai':
        return <AIDiagnostic />;
      case 'masterdata':
        return <MasterDataEditor masterData={masterData} onUpdate={handleUpdateMasterData} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
