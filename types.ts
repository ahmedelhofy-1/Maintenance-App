
export type AssetStatus = 'Operational' | 'Down' | 'In Maintenance' | 'Restricted';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type WorkOrderStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed';

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: AssetStatus;
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
  assignedTo: string;
  dueDate: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
