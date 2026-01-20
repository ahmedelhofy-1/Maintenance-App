
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Assets from './components/Assets';
import AIDiagnostic from './components/AIDiagnostic';
import WorkOrders from './components/WorkOrders';
import Approvals from './components/Approvals';
import MasterDataEditor from './components/MasterData';
import Inventory from './components/Inventory';
import PartsRequests from './components/PartsRequests';
import AnnualRequests from './components/AnnualRequests';
import Login from './components/Login';
import { MasterData, User, Role, PagePermissions, ModuleKey } from './types';
import { MOCK_PARTS } from './constants';

const createPermissions = (r: boolean, a: boolean, e: boolean, d: boolean): PagePermissions => ({
  read: r, add: a, edit: e, delete: d
});

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: {
      dashboard: createPermissions(true, true, true, true),
      assets: createPermissions(true, true, true, true),
      workorders: createPermissions(true, true, true, true),
      approvals: createPermissions(true, true, true, true),
      inventory: createPermissions(true, true, true, true),
      requests: createPermissions(true, true, true, true),
      annual: createPermissions(true, true, true, true),
      ai: createPermissions(true, true, true, true),
      masterdata: createPermissions(true, true, true, true),
    }
  },
  {
    id: 'manager',
    name: 'Maintenance Manager',
    permissions: {
      dashboard: createPermissions(true, true, true, true),
      assets: createPermissions(true, true, true, true),
      workorders: createPermissions(true, true, true, true),
      approvals: createPermissions(true, true, true, true),
      inventory: createPermissions(true, true, true, false),
      requests: createPermissions(true, true, true, true),
      annual: createPermissions(true, true, true, true),
      ai: createPermissions(true, true, true, true),
      masterdata: createPermissions(true, false, false, false),
    }
  },
  {
    id: 'technician',
    name: 'Field Technician',
    permissions: {
      dashboard: createPermissions(true, false, false, false),
      assets: createPermissions(true, false, false, false),
      workorders: createPermissions(true, true, true, false),
      approvals: createPermissions(true, false, false, false),
      inventory: createPermissions(true, false, false, false),
      requests: createPermissions(true, true, false, false),
      annual: createPermissions(false, false, false, false),
      ai: createPermissions(true, true, true, true),
      masterdata: createPermissions(false, false, false, false),
    }
  }
];

const DEFAULT_USERS: User[] = [
  { id: 'Admin', name: 'System Administrator', email: 'Admin', mobile: '+1 555-0199', jobTitle: 'Chief Admin', roleId: 'admin', password: 'Admin' },
  { id: 'USR-002', name: 'Sarah Smith', email: 's.smith@factory.com', mobile: '+1 555-0188', jobTitle: 'Maintenance Lead', roleId: 'manager', password: 'manager' },
  { id: 'USR-003', name: 'Pete Miller', email: 'p.miller@factory.com', mobile: '+1 555-0177', jobTitle: 'Mechanic', roleId: 'technician', password: 'tech' }
];

const INITIAL_MASTER_DATA: MasterData = {
  departments: ['Maintenance', 'Production', 'Facilities', 'IT Infrastructure', 'Logistics', 'Quality Control', 'Safety'],
  brands: ['Siemens', 'Carrier', 'Enerpac', 'Caterpillar', 'ABB', 'Schneider Electric', 'Bosch', 'General Electric'],
  assetTypes: ['Centrifugal Pump', 'Electric Motor', 'HVAC Unit', 'Air Compressor', 'Hydraulic Press', 'Conveyor System', 'Generator'],
  powerRatings: ['110V AC', '220V AC', '480V 3-Phase', '24V DC', 'Hydraulic', 'Pneumatic'],
  years: Array.from({ length: 16 }, (_, i) => (2025 - i).toString()),
  parts: MOCK_PARTS,
  users: DEFAULT_USERS,
  roles: DEFAULT_ROLES,
  googleSheetsUrl: ''
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('mx_authenticated') === 'true';
  });
  
  const [masterData, setMasterData] = useState<MasterData>(() => {
    const saved = localStorage.getItem('mx_masterdata');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.parts) parsed.parts = INITIAL_MASTER_DATA.parts;
      if (!parsed.users) parsed.users = INITIAL_MASTER_DATA.users;
      if (!parsed.roles) parsed.roles = INITIAL_MASTER_DATA.roles;
      return parsed;
    }
    return INITIAL_MASTER_DATA;
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('mx_current_user') || DEFAULT_USERS[0].id;
  });

  const currentUser = useMemo(() => {
    return masterData.users.find(u => u.id === currentUserId) || masterData.users[0];
  }, [currentUserId, masterData.users]);

  const currentUserRole = useMemo(() => {
    return masterData.roles.find(r => r.id === currentUser.roleId) || masterData.roles[0];
  }, [currentUser, masterData.roles]);

  useEffect(() => {
    localStorage.setItem('mx_masterdata', JSON.stringify(masterData));
  }, [masterData]);

  useEffect(() => {
    localStorage.setItem('mx_current_user', currentUserId);
  }, [currentUserId]);

  const handleLogin = (user: User) => {
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    localStorage.setItem('mx_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mx_authenticated');
    setActiveTab('dashboard');
  };

  const handleUpdateMasterData = (newData: MasterData) => {
    setMasterData(newData);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} users={masterData.users} />;
  }

  const renderContent = () => {
    const permissions = currentUserRole.permissions[activeTab as ModuleKey] || createPermissions(false, false, false, false);
    
    if (!permissions.read && activeTab !== 'dashboard') {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
                <span className="text-6xl mb-4">🚫</span>
                <h2 className="text-xl font-black text-slate-900 uppercase">Access Denied</h2>
                <p className="text-slate-500">Your account does not have permission to view this module.</p>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard masterData={masterData} />;
      case 'assets':
        return <Assets masterData={masterData} permissions={permissions} />;
      case 'workorders':
        return <WorkOrders masterData={masterData} permissions={permissions} setActiveTab={setActiveTab} />;
      case 'approvals':
        return <Approvals masterData={masterData} permissions={permissions} />;
      case 'inventory':
        return <Inventory masterData={masterData} permissions={permissions} />;
      case 'requests':
        return <PartsRequests masterData={masterData} permissions={permissions} />;
      case 'annual':
        return <AnnualRequests masterData={masterData} permissions={permissions} />;
      case 'ai':
        return <AIDiagnostic permissions={permissions} />;
      case 'masterdata':
        return <MasterDataEditor masterData={masterData} onUpdate={handleUpdateMasterData} permissions={permissions} />;
      default:
        return <Dashboard masterData={masterData} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      currentUser={currentUser} 
      currentUserRole={currentUserRole}
      users={masterData.users}
      onUserSwitch={setCurrentUserId}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
