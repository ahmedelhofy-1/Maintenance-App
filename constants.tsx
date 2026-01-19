
import { Asset, WorkOrder } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'AST-001',
    name: 'Industrial HVAC Unit 4',
    category: 'HVAC',
    location: 'Roof - Section A',
    status: 'Operational',
    lastService: '2024-02-15',
    nextService: '2024-05-15',
    health: 92,
    imageUrl: 'https://picsum.photos/seed/hvac/400/300'
  },
  {
    id: 'AST-002',
    name: 'Hydraulic Press P200',
    category: 'Production',
    location: 'Floor 1 - Line B',
    status: 'In Maintenance',
    lastService: '2024-03-01',
    nextService: '2024-06-01',
    health: 45,
    imageUrl: 'https://picsum.photos/seed/press/400/300'
  },
  {
    id: 'AST-003',
    name: 'Main Server Rack R1',
    category: 'IT Infrastructure',
    location: 'Data Center 1',
    status: 'Operational',
    lastService: '2024-01-20',
    nextService: '2024-07-20',
    health: 98,
    imageUrl: 'https://picsum.photos/seed/server/400/300'
  },
  {
    id: 'AST-004',
    name: 'Electric Forklift #08',
    category: 'Logistics',
    location: 'Warehouse C',
    status: 'Down',
    lastService: '2023-12-10',
    nextService: '2024-03-10',
    health: 12,
    imageUrl: 'https://picsum.photos/seed/forklift/400/300'
  }
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-101',
    title: 'Filter Replacement',
    assetId: 'AST-001',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: 'John Doe',
    dueDate: '2024-04-10',
    description: 'Replace standard air filters and check coolant levels.'
  },
  {
    id: 'WO-102',
    title: 'Hydraulic Leak Repair',
    assetId: 'AST-002',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Sarah Smith',
    dueDate: '2024-03-25',
    description: 'Repairing main seal leak on the hydraulic piston.'
  },
  {
    id: 'WO-103',
    title: 'Battery Diagnostics',
    assetId: 'AST-004',
    priority: 'Critical',
    status: 'Pending',
    assignedTo: 'Mike Ross',
    dueDate: '2024-03-22',
    description: 'Forklift won\'t start. Battery showing zero voltage.'
  }
];
