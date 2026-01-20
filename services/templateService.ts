
import * as XLSX from 'xlsx';

export const downloadTemplate = (headers: string[], fileName: string) => {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `${fileName}_Template.xlsx`);
};

export const templates = {
  assets: [
    'Asset Name', 'Department', 'Brand', 'Model', 'Year', 'Location', 'Power Rating', 'Serial No'
  ],
  masterParts: [
    'Part ID', 'Description', 'Min Level Stock', 'Max Level Stock', 'Related Equipment Category', 'Unit', 'Unit Cost', 'Storage Location'
  ],
  inventory: [
    'Part ID', 'Part Name', 'Stock Level', 'Min Stock Level', 'Max Stock Level', 'Unit', 'Unit Cost', 'Storage Location'
  ],
  partsRequests: [
    'Asset ID', 'Work Order ID', 'Requested By', 'Part ID', 'Quantity', 'Notes'
  ],
  annualRequests: [
    'Requested By', 'Store Location', 'Target Year', 'Part ID', 'Part Name', 'Quantity', 'Notes'
  ]
};
