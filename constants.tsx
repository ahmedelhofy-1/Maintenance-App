
import { Asset, WorkOrder } from './types';

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
