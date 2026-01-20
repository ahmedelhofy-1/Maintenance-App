
import { Asset, WorkOrder, Part, PartRequest, AnnualPartRequest } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'TRC-101',
    name: 'John Deere 8R 410',
    category: 'Tractors',
    department: 'Field Operations',
    brand: 'John Deere',
    model: '8R Series',
    yearModel: '2023',
    location: 'Barn - North Sector',
    status: 'Operational',
    power: '410 HP Diesel',
    serialNo: 'JD-8R-9920',
    lastService: '2024-02-15',
    nextService: '2024-05-15',
    health: 92,
    imageUrl: 'https://images.unsplash.com/photo-1594498653385-d5172b532c00?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'HV-202',
    name: 'Case IH Axial-Flow 9250',
    category: 'Harvesting',
    department: 'Grain Processing',
    brand: 'Case IH',
    model: '9250 Series',
    yearModel: '2022',
    location: 'Storage Bay 2',
    status: 'In Maintenance',
    power: '625 HP Diesel',
    serialNo: 'CIH-AF-0012',
    lastService: '2024-03-01',
    nextService: '2024-06-01',
    health: 45,
    imageUrl: 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&q=80&w=400'
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'MR-001',
    title: 'Hydraulic Hose Replacement',
    assetId: 'TRC-101',
    priority: 'Medium',
    status: 'MR Generated',
    maintenanceType: 'CM',
    assignedTo: 'Pete Miller',
    dueDate: '2024-04-10',
    description: 'Slow leak detected in the secondary hydraulic line.',
    partsAvailable: true,
    isOperational: true,
    sensorReadings: 'Pressure drop: 15%'
  },
  {
    id: 'MR-002',
    title: 'Engine Overhaul - Phase 1',
    assetId: 'HV-202',
    priority: 'High',
    status: 'Manager Review',
    maintenanceType: 'PM',
    assignedTo: 'Sarah Smith',
    dueDate: '2024-03-25',
    description: 'Full engine teardown and inspection after peak harvest season.',
    isEmergency: false,
    partsAvailable: false,
    isOperational: false,
    sensorReadings: 'Hours: 4200h'
  }
];

export const MOCK_PARTS: Part[] = [
  { id: 'PRT-001', name: 'Hydraulic Fluid SAE 10W', category: 'Lubricants', stock: 15, minStock: 5, maxStock: 100, unit: 'gallons', cost: 45.0, location: 'Shelf A-1' },
  { id: 'PRT-002', name: 'Axle Seal Kit', category: 'Seals', stock: 2, minStock: 3, maxStock: 20, unit: 'set', cost: 120.0, location: 'Bin 42' },
  { id: 'PRT-003', name: 'Universal Grease', category: 'Consumables', stock: 50, minStock: 10, maxStock: 200, unit: 'kg', cost: 12.5, location: 'Chemical Storage' },
  { id: 'PRT-004', name: 'High-Pressure Hose 1/2"', category: 'Hoses', stock: 8, minStock: 4, maxStock: 50, unit: 'meters', cost: 28.0, location: 'Shelf C-3' }
];

export const MOCK_PART_REQUESTS: PartRequest[] = [
  {
    id: 'REQ-501',
    workOrderId: 'MR-002',
    assetId: 'HV-202',
    requestedBy: 'Sarah Smith',
    requestDate: '2024-03-22',
    status: 'Pending',
    items: [
      { partId: 'PRT-002', quantity: 1 }
    ],
    notes: 'Required for main engine overhaul.'
  }
];

export const MOCK_ANNUAL_REQUESTS: AnnualPartRequest[] = [
  {
    id: 'ANN-2025-001',
    requestedBy: 'Farm Manager',
    storeLocation: 'Grain Sector Warehouse',
    requestDate: '2025-01-01',
    targetYear: '2025',
    status: 'Approved',
    items: [
      { partId: 'PRT-003', quantity: 500 }
    ],
    notes: 'Yearly lubricant allocation for tractor fleet.'
  }
];

export const fetchAssetHealthHistory = async (assetId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const seed = assetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const drift = Math.sin((seed + i) * 0.5) * 10;
    const currentHealth = Math.max(30, Math.min(100, 85 + drift));
    data.push({
      date: month.toLocaleString('default', { month: 'short' }),
      score: Math.round(currentHealth)
    });
  }
  return data;
};
