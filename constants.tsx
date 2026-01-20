
import { Asset, WorkOrder, Part, PartRequest } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'AST-001',
    name: 'Industrial HVAC Unit 4',
    category: 'HVAC',
    department: 'Facilities',
    brand: 'Carrier',
    model: 'WeatherMaker 8000',
    yearModel: '2021',
    location: 'Roof - Section A',
    status: 'Operational',
    power: '460V / 3PH',
    serialNo: 'CR-99201-X',
    lastService: '2024-02-15',
    nextService: '2024-05-15',
    health: 92,
    imageUrl: 'https://picsum.photos/seed/hvac/400/300'
  },
  {
    id: 'AST-002',
    name: 'Hydraulic Press P200',
    category: 'Production',
    department: 'Manufacturing',
    brand: 'Enerpac',
    model: 'VLP-Series 200T',
    yearModel: '2019',
    location: 'Floor 1 - Line B',
    status: 'In Maintenance',
    power: '220V / 30A',
    serialNo: 'EP-HP-200-88',
    lastService: '2024-03-01',
    nextService: '2024-06-01',
    health: 45,
    imageUrl: 'https://picsum.photos/seed/press/400/300'
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-101',
    title: 'Filter Replacement',
    assetId: 'AST-001',
    priority: 'Medium',
    status: 'Logged',
    maintenanceType: 'PM',
    assignedTo: 'John Doe',
    dueDate: '2024-04-10',
    description: 'Replace standard air filters and check coolant levels.',
    partsAvailable: true,
    isOperational: true
  },
  {
    id: 'WO-102',
    title: 'Hydraulic Leak Repair',
    assetId: 'AST-002',
    priority: 'High',
    status: 'Maintenance Work',
    maintenanceType: 'CM',
    assignedTo: 'Sarah Smith',
    dueDate: '2024-03-25',
    description: 'Repairing main seal leak on the hydraulic piston.',
    isEmergency: true,
    partsAvailable: false,
    isOperational: false
  }
];

export const MOCK_PARTS: Part[] = [
  { id: 'PRT-001', name: 'HEPA Air Filter', category: 'Filters', stock: 15, minStock: 5, unit: 'pcs', cost: 45.0, location: 'Shelf A-1' },
  { id: 'PRT-002', name: 'Hydraulic Seal Kit (200T)', category: 'Seals', stock: 2, minStock: 3, unit: 'set', cost: 120.0, location: 'Bin 42' },
  { id: 'PRT-003', name: 'Standard Lubricant Grease', category: 'Consumables', stock: 50, minStock: 10, unit: 'kg', cost: 12.5, location: 'Chemical Storage' },
  { id: 'PRT-004', name: 'V-Belt 5VX800', category: 'Belts', stock: 8, minStock: 4, unit: 'pcs', cost: 28.0, location: 'Shelf C-3' },
  { id: 'PRT-005', name: 'Bearing 6205-2RS', category: 'Bearings', stock: 0, minStock: 2, unit: 'pcs', cost: 18.75, location: 'Bin 12' }
];

export const MOCK_PART_REQUESTS: PartRequest[] = [
  {
    id: 'REQ-501',
    workOrderId: 'WO-102',
    assetId: 'AST-002',
    requestedBy: 'Sarah Smith',
    requestDate: '2024-03-22',
    status: 'Pending',
    items: [
      { partId: 'PRT-002', quantity: 1 }
    ],
    notes: 'Urgent repair for the main hydraulic press leak.'
  }
];

/**
 * Mock API service to fetch asset health history
 */
export const fetchAssetHealthHistory = async (assetId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Seed random values based on assetId to keep it consistent-ish for the session
  const seed = assetId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const data = [];
  let currentHealth = 100;
  
  // Generate 6 months of data
  for (let i = 5; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    
    // Simulate some degradation and repairs
    const drift = Math.sin((seed + i) * 0.5) * 10;
    currentHealth = Math.max(30, Math.min(100, 85 + drift));
    
    data.push({
      date: month.toLocaleString('default', { month: 'short' }),
      score: Math.round(currentHealth)
    });
  }
  
  return data;
};
