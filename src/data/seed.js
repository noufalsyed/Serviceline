// Demo dataset. Sample data only — no real customer information.
// Dates are anchored around TODAY (see lib/dates.js) so the dashboard has
// something meaningful to show: a few overdue, a few due this week.

export const CHECKLISTS = {
  'Fire Extinguisher': [
    'Physical condition',
    'Cylinder / body',
    'Pressure gauge',
    'Safety pin',
    'Tamper seal',
    'Hose & nozzle',
    'Label legible',
    'Mounting bracket',
    'Access clearance'
  ],
  'Fire Alarm Equipment': [
    'Panel healthy, no faults',
    'Battery voltage',
    'Detector sample test',
    'Sounder audibility',
    'Manual call point test',
    'Event log reviewed'
  ],
  'Emergency Light': [
    'Lamp operation',
    'Charging indicator',
    'Duration test (3 hr)',
    'Battery condition',
    'Diffuser & housing'
  ],
  'Fire Pump': [
    'No-flow churn test',
    'Suction pressure',
    'Discharge pressure',
    'Engine oil & coolant',
    'Battery condition',
    'Jockey pump cut-in',
    'Packing gland leak-off'
  ],
  Generator: [
    'Oil level & condition',
    'Coolant level',
    'Fuel level',
    'Battery voltage',
    'Load test',
    'Exhaust & silencer',
    'Control panel alarms'
  ],
  UPS: [
    'Input / output voltage',
    'Battery block check',
    'Runtime test',
    'Cooling fans',
    'Alarm log reviewed'
  ],
  DEFAULT: [
    'General condition',
    'Operational test',
    'Leaks / abnormal noise',
    'Safety guards & labels',
    'Housekeeping around unit'
  ]
}

export function checklistFor(category) {
  return CHECKLISTS[category] || CHECKLISTS.DEFAULT
}

export const CATEGORIES = [
  'Fire Extinguisher',
  'Fire Alarm Equipment',
  'Fire Pump',
  'Emergency Light',
  'Fire Hose / Reel',
  'Generator',
  'UPS',
  'HVAC / Air Conditioning',
  'Pump',
  'Compressor',
  'Electrical Equipment',
  'Machinery',
  'Vehicle',
  'IT Equipment'
]

const customers = [
  { id: 'C-A', name: 'Al-Rajhi Industrial', contact: 'Khalid Al-Rajhi', phone: '+966 13 800 1200' },
  { id: 'C-B', name: 'Gulf Petrochem Co.', contact: 'Operations Desk', phone: '+966 11 455 9000' },
  { id: 'C-C', name: 'Nesma Facilities Mgmt', contact: 'F.M. Control Room', phone: '+966 13 340 7788' }
]

const sites = [
  { id: 'S-A1', customerId: 'C-A', name: 'Dammam Plant', city: 'Dammam' },
  { id: 'S-A2', customerId: 'C-A', name: 'Jubail Warehouse', city: 'Jubail' },
  { id: 'S-A3', customerId: 'C-A', name: 'Khobar Office', city: 'Al Khobar' },
  { id: 'S-B1', customerId: 'C-B', name: 'Riyadh Branch', city: 'Riyadh' },
  { id: 'S-B2', customerId: 'C-B', name: 'Dammam Branch', city: 'Dammam' },
  { id: 'S-C1', customerId: 'C-C', name: 'Industrial Site 7', city: 'Jubail' },
  { id: 'S-C2', customerId: 'C-C', name: 'Central Warehouse', city: 'Dammam' }
]

const base = {
  manufacturer: '', model: '', serial: '', assetTag: '',
  building: '', floor: '', area: '',
  installDate: '', warrantyEnd: '', expiryDate: '',
  lastServiceDate: '', nextServiceDate: '',
  lastInspectionDate: '', nextInspectionDate: '',
  status: 'Operational', remarks: '', photos: []
}
const eq = (o) => ({ ...base, ...o })

const equipment = [
  eq({
    id: 'FE-000125', category: 'Fire Extinguisher', type: 'CO₂ 6 kg',
    name: 'Extinguisher — Control Room A', manufacturer: 'Naffco', model: 'NAF-CO2-6',
    serial: 'CO2-22-4471', assetTag: 'ARI-FE-125', customerId: 'C-A', siteId: 'S-A1',
    building: 'Admin Block', floor: 'Ground', area: 'Control Room',
    installDate: '2022-03-02', expiryDate: '2027-03-02',
    lastServiceDate: '2026-06-02', nextServiceDate: '2026-09-13',
    lastInspectionDate: '2026-06-02', nextInspectionDate: '2026-09-13',
    remarks: 'Wall-mounted beside the main distribution panel.'
  }),
  eq({
    id: 'FE-000126', category: 'Fire Extinguisher', type: 'DCP 9 kg',
    name: 'Extinguisher — Warehouse Bay 3', manufacturer: 'Naffco', model: 'NAF-DCP-9',
    serial: 'DCP-21-8890', assetTag: 'ARI-FE-126', customerId: 'C-A', siteId: 'S-A1',
    building: 'Warehouse', floor: 'Ground', area: 'Bay 3',
    installDate: '2021-11-10', expiryDate: '2026-11-10',
    lastServiceDate: '2026-02-18', nextServiceDate: '2026-08-20'
  }),
  eq({
    id: 'FE-000127', category: 'Fire Extinguisher', type: 'DCP 6 kg',
    name: 'Extinguisher — Loading Dock', manufacturer: 'Firetec', model: 'FT-D6',
    serial: 'D6-23-1120', assetTag: 'ARI-FE-127', customerId: 'C-A', siteId: 'S-A2',
    building: 'Dispatch', floor: 'Ground', area: 'Dock 1',
    installDate: '2023-01-15', expiryDate: '2028-01-15',
    lastServiceDate: '2026-06-01', nextServiceDate: '2026-12-01'
  }),
  eq({
    id: 'FA-000031', category: 'Fire Alarm Equipment', type: 'Addressable panel',
    name: 'Fire Alarm Panel — Main', manufacturer: 'Honeywell', model: 'NFS2-3030',
    serial: 'FA-19-0031', assetTag: 'ARI-FA-031', customerId: 'C-A', siteId: 'S-A1',
    building: 'Admin Block', floor: 'Ground', area: 'Reception',
    installDate: '2019-06-01', lastServiceDate: '2026-04-05', nextServiceDate: '2026-10-05'
  }),
  eq({
    id: 'EL-000044', category: 'Emergency Light', type: 'LED maintained',
    name: 'Emergency Light — Stair Core 2', manufacturer: 'Beghelli', model: 'BG-LED-M',
    serial: 'EL-20-0440', assetTag: 'ARI-EL-044', customerId: 'C-A', siteId: 'S-A3',
    building: 'Office Tower', floor: '2nd', area: 'Stair Core 2',
    installDate: '2020-09-20', lastServiceDate: '2026-03-06', nextServiceDate: '2026-09-06'
  }),
  eq({
    id: 'FH-000012', category: 'Fire Hose / Reel', type: 'Swinging reel 30 m',
    name: 'Hose Reel — Corridor C', manufacturer: 'Naffco', model: 'NAF-HR-30',
    serial: 'HR-22-0120', assetTag: 'ARI-FH-012', customerId: 'C-A', siteId: 'S-A2',
    building: 'Warehouse', floor: 'Ground', area: 'Corridor C',
    installDate: '2022-05-05', lastServiceDate: '2026-05-15', nextServiceDate: '2026-11-15'
  }),
  eq({
    id: 'FP-000003', category: 'Fire Pump', type: 'Diesel 1500 GPM',
    name: 'Fire Pump — Pump House', manufacturer: 'Clarke', model: 'JU6H-UF52',
    serial: 'FP-18-0003', assetTag: 'ARI-FP-003', customerId: 'C-A', siteId: 'S-A1',
    building: 'Pump House', floor: 'Ground', area: 'Bay 1',
    installDate: '2018-02-11', status: 'Under Maintenance',
    lastServiceDate: '2026-07-20', nextServiceDate: '2026-09-25',
    remarks: 'Awaiting jockey pump pressure switch — PO 4471.'
  }),
  eq({
    id: 'GN-000008', category: 'Generator', type: '500 kVA standby',
    name: 'Diesel Generator — DG1', manufacturer: 'Cummins', model: 'C500 D5',
    serial: 'GN-17-0080', assetTag: 'GPC-GN-008', customerId: 'C-B', siteId: 'S-B1',
    building: 'Utility Yard', floor: 'Ground', area: 'DG Room',
    installDate: '2017-08-01', warrantyEnd: '2020-08-01',
    lastServiceDate: '2026-06-30', nextServiceDate: '2026-09-30'
  }),
  eq({
    id: 'UP-000015', category: 'UPS', type: '20 kVA online',
    name: 'UPS — Server Room', manufacturer: 'Eaton', model: '93PS-20',
    serial: 'UP-21-0150', assetTag: 'GPC-UP-015', customerId: 'C-B', siteId: 'S-B1',
    building: 'IT Block', floor: '1st', area: 'Server Room',
    installDate: '2021-04-12', warrantyEnd: '2026-04-12',
    lastServiceDate: '2026-06-09', nextServiceDate: '2026-09-09'
  }),
  eq({
    id: 'HV-000021', category: 'HVAC / Air Conditioning', type: 'Package unit 15 TR',
    name: 'HVAC — Roof PU-2', manufacturer: 'Trane', model: 'Voyager 15',
    serial: 'HV-22-0210', assetTag: 'GPC-HV-021', customerId: 'C-B', siteId: 'S-B2',
    building: 'Branch Office', floor: 'Roof', area: 'PU-2',
    installDate: '2022-07-19', lastServiceDate: '2026-07-20', nextServiceDate: '2026-10-20'
  }),
  eq({
    id: 'CM-000005', category: 'Compressor', type: 'Screw 50 HP',
    name: 'Air Compressor — Utility', manufacturer: 'Atlas Copco', model: 'GA37',
    serial: 'CM-20-0050', assetTag: 'NFM-CM-005', customerId: 'C-C', siteId: 'S-C1',
    building: 'Utility', floor: 'Ground', area: 'Compressor Room',
    installDate: '2020-03-30', lastServiceDate: '2026-02-28', nextServiceDate: '2026-08-28'
  }),
  eq({
    id: 'FE-000200', category: 'Fire Extinguisher', type: 'DCP 6 kg',
    name: 'Extinguisher — Office Pantry', manufacturer: 'Firetec', model: 'FT-D6',
    serial: 'D6-21-0200', assetTag: 'GPC-FE-200', customerId: 'C-B', siteId: 'S-B2',
    building: 'Branch Office', floor: '1st', area: 'Pantry',
    installDate: '2021-09-15', expiryDate: '2026-09-15',
    lastServiceDate: '2026-03-15', nextServiceDate: '2027-03-15'
  }),
  eq({
    id: 'FE-000201', category: 'Fire Extinguisher', type: 'CO₂ 2 kg',
    name: 'Extinguisher — Electrical Room', manufacturer: 'Naffco', model: 'NAF-CO2-2',
    serial: 'CO2-23-0201', assetTag: 'NFM-FE-201', customerId: 'C-C', siteId: 'S-C2',
    building: 'Warehouse', floor: 'Ground', area: 'Electrical Room',
    installDate: '2023-02-01', expiryDate: '2028-02-01', status: 'Failed',
    lastServiceDate: '2026-08-30', nextServiceDate: '2026-09-08',
    remarks: 'Failed last inspection — low charge, tagged out of service.'
  }),
  eq({
    id: 'PU-000009', category: 'Pump', type: 'Booster 10 HP',
    name: 'Booster Pump — Water', manufacturer: 'Grundfos', model: 'CR15',
    serial: 'PU-22-0090', assetTag: 'NFM-PU-009', customerId: 'C-C', siteId: 'S-C1',
    building: 'Pump Room', floor: 'Ground', area: 'Skid 2',
    installDate: '2022-10-10', lastServiceDate: '2026-06-05', nextServiceDate: '2026-12-05'
  }),
  eq({
    id: 'IT-000077', category: 'IT Equipment', type: 'Rack UPS 6 kVA',
    name: 'Server Rack UPS — Rack 4', manufacturer: 'APC', model: 'SRT6KXLI',
    serial: 'IT-23-0770', assetTag: 'GPC-IT-077', customerId: 'C-B', siteId: 'S-B1',
    building: 'IT Block', floor: '1st', area: 'Rack 4',
    installDate: '2023-05-22', warrantyEnd: '2026-05-22',
    lastServiceDate: '2026-05-01', nextServiceDate: '2026-11-01'
  })
]

let n = 0
const sr = (equipmentId, date, type, engineer, result, remarks, checklist) => ({
  id: `SR-${String(++n).padStart(4, '0')}`,
  equipmentId, date, type, engineer, result,
  remarks: remarks || '',
  checklist: checklist || null,
  photos: []
})

const records = [
  sr('FE-000125', '2026-06-02', 'Inspection', 'Ahmed Al-Otaibi', 'Passed', 'Monthly visual inspection. Gauge in the green band, seal intact.'),
  sr('FE-000125', '2026-03-02', 'Maintenance', 'Mohammed Farooq', 'Completed', 'Annual maintenance — cylinder weighed, O-ring replaced, bracket repainted.'),
  sr('FE-000125', '2025-12-01', 'Inspection', 'Ahmed Al-Otaibi', 'Passed', 'Quarterly inspection, no defects found.'),
  sr('FE-000126', '2026-02-18', 'Inspection', 'Ahmed Al-Otaibi', 'Passed', 'Visual check OK. Hydrostatic test falls due in 2026.'),
  sr('FE-000126', '2025-08-20', 'Maintenance', 'Ahmed Al-Otaibi', 'Completed', 'Six-month service, refilled to specification.'),
  sr('FP-000003', '2026-07-20', 'Maintenance', 'Mohammed Farooq', 'In Progress', 'Weekly churn test completed. Jockey pump pressure switch faulty — part on order.'),
  sr('FP-000003', '2026-06-22', 'Inspection', 'Mohammed Farooq', 'Passed', 'Weekly no-flow test, ran 30 minutes, temperatures normal.'),
  sr('GN-000008', '2026-06-30', 'Maintenance', 'Mohammed Farooq', 'Completed', '250-hour service: oil and filters, coolant top-up, battery load test 12.6 V.'),
  sr('GN-000008', '2026-03-28', 'Inspection', 'Mohammed Farooq', 'Passed', 'Monthly load-bank test at 80 % for one hour.'),
  sr('UP-000015', '2026-06-09', 'Maintenance', 'Mohammed Farooq', 'Completed', 'Battery block impedance check — two blocks flagged for replacement next visit.'),
  sr('EL-000044', '2026-03-06', 'Inspection', 'Ahmed Al-Otaibi', 'Passed', 'Three-hour duration discharge test passed.'),
  sr('CM-000005', '2026-02-28', 'Maintenance', 'Mohammed Farooq', 'Completed', '4000-hour service, air/oil separator replaced.'),
  sr('FE-000201', '2026-08-30', 'Inspection', 'Mohammed Farooq', 'Failed', 'Cylinder pressure below minimum. Tagged out of service, replacement requested.', {
    'Physical condition': 'pass', 'Cylinder / body': 'pass', 'Pressure gauge': 'fail',
    'Safety pin': 'pass', 'Tamper seal': 'fail', 'Hose & nozzle': 'pass',
    'Label legible': 'pass', 'Mounting bracket': 'pass', 'Access clearance': 'pass'
  })
]

/**
 * Demo credentials. These are shown on the sign-in screen because this is a
 * public demonstration; they are hashed with PBKDF2 before being stored, and
 * the plaintext never reaches the database. A real deployment issues
 * credentials privately and forces a change on first sign-in.
 */
export const DEMO_PASSWORDS = {
  'admin': 'Admin2026',
  'sara.i': 'Manager2026',
  'ahmed.a': 'Engineer2026',
  'mohammed.f': 'Farooq2026',
  'khalid.r': 'Client2026',
  'layla.n': 'Viewer2026'
}

const users = [
  { id: 'USR-001', login: 'admin', name: 'Nabil Haddad', role: 'Administrator', active: true, permissions: null, scopeCustomer: null, scopeSites: null },
  { id: 'USR-002', login: 'sara.i', name: 'Sara Ibrahim', role: 'Manager', active: true, permissions: null, scopeCustomer: null, scopeSites: null },
  { id: 'USR-003', login: 'ahmed.a', name: 'Ahmed Al-Otaibi', role: 'Service Engineer', active: true, permissions: null, scopeCustomer: null, scopeSites: ['S-A1', 'S-A2', 'S-A3'] },
  { id: 'USR-004', login: 'mohammed.f', name: 'Mohammed Farooq', role: 'Service Engineer', active: true, permissions: null, scopeCustomer: null, scopeSites: ['S-B1', 'S-B2', 'S-C1', 'S-C2'] },
  { id: 'USR-005', login: 'khalid.r', name: 'Khalid Al-Rajhi', role: 'Client User', active: true, permissions: null, scopeCustomer: 'C-A', scopeSites: null },
  { id: 'USR-006', login: 'layla.n', name: 'Layla Nasser', role: 'Viewer', active: true, permissions: null, scopeCustomer: 'C-B', scopeSites: null }
]

const requests = [
  {
    id: 'RQ-0001', equipmentId: 'CM-000005', by: 'Khalid Al-Rajhi', date: '2026-09-02',
    note: 'Compressor tripping on high temperature intermittently — please inspect.',
    status: 'Open'
  }
]

const audit = [
  { id: 'A-0003', ts: '05 Sep 2026, 16:10', user: 'Mohammed Farooq', action: 'Service record added', entity: 'FP-000003', detail: 'Maintenance · In Progress' },
  { id: 'A-0002', ts: '02 Sep 2026, 09:22', user: 'Khalid Al-Rajhi', action: 'Service request raised', entity: 'CM-000005', detail: 'Compressor high-temperature trips' },
  { id: 'A-0001', ts: '30 Aug 2026, 14:05', user: 'Mohammed Farooq', action: 'Inspection failed', entity: 'FE-000201', detail: 'Tagged out of service' }
]

export function seed() {
  return {
    version: 2,
    customers: structuredClone(customers),
    sites: structuredClone(sites),
    equipment: structuredClone(equipment),
    records: structuredClone(records),
    users: structuredClone(users),
    requests: structuredClone(requests),
    audit: structuredClone(audit),
    backups: [],
    settings: { backupSchedule: 'off', lastBackupAt: null }
  }
}
