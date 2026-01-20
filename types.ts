
export type AssetStatus = 'Operational' | 'Down' | 'In Maintenance' | 'Restricted';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceType = 'PM' | 'CM'; // Preventive vs Corrective

export type WorkOrderStatus = 
  | 'MR Generated' 
  | 'Manager Review' 
  | 'Parts Planning' 
  | 'Scheduled' 
  | 'Execution' 
  | 'Closing' 
  | 'Completed';

export interface MasterData {
  departments: string[];
  brands: string[];
  assetTypes: string[];
  powerRatings: string[];
  years: string[];
  googleSheetsUrl?: string; // Integration URL
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
  loggedHours?: number;
  totalCost?: number;
  photosAttached?: string[];
  sensorReadings?: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  cost: number;
  location: string;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Issued' | 'Cancelled';

export interface PartRequestItem {
  partId: string;
  quantity: number;
}

export interface PartRequest {
  id: string;
  workOrderId?: string;
  assetId: string;
  requestedBy: string;
  requestDate: string;
  status: RequestStatus;
  items: PartRequestItem[];
  notes?: string;
}

export interface AnnualPartRequest {
  id: string;
  requestedBy: string;
  storeLocation: string;
  requestDate: string;
  targetYear: string;
  status: RequestStatus;
  items: PartRequestItem[];
  notes?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
