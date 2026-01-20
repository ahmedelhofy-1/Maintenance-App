
export type AssetStatus = 'Operational' | 'Down' | 'In Maintenance' | 'Restricted';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceType = 'PM' | 'CM'; // Preventive vs Corrective
export type WorkOrderStatus = 
  | 'Logged' 
  | 'Prioritized' 
  | 'Maintenance Work' 
  | 'Testing' 
  | 'Record Update' 
  | 'Completed';

export interface MasterData {
  departments: string[];
  brands: string[];
  assetTypes: string[];
  powerRatings: string[];
  years: string[];
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  department: string;
  brand: string;
  model: string;
  yearModel: string;
  location: string;
  status: AssetStatus;
  power: string;
  serialNo: string;
  lastService: string;
  nextService: string;
  health: number;
  imageUrl?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  assetId: string;
  priority: Priority;
  status: WorkOrderStatus;
  maintenanceType: MaintenanceType;
  assignedTo: string;
  dueDate: string;
  description: string;
  isEmergency?: boolean;
  partsAvailable: boolean;
  isOperational?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
