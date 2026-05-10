import { createTableRepo } from './tableRepo'

export const repos = {
  projects: createTableRepo('projects'),
  phases: createTableRepo('phases'),
  timelineEntries: createTableRepo('timeline_entries'),
  expenses: createTableRepo('expenses'),
  materials: createTableRepo('materials'),
  laborers: createTableRepo('laborers'),
  vendors: createTableRepo('vendors'),
  siteProgress: createTableRepo('site_progress'),
  documents: createTableRepo('documents'),
  cashflow: createTableRepo('cashflow'),
  customLists: createTableRepo('custom_lists'),
  reminders: createTableRepo('reminders'),
  auditEvents: createTableRepo('audit_events'),
  boqItems: createTableRepo('boq_items'),
  purchaseOrders: createTableRepo('purchase_orders'),
  runningBills: createTableRepo('running_bills'),
  changeOrders: createTableRepo('change_orders'),
  snagItems: createTableRepo('snag_items'),
  paymentEvents: createTableRepo('payment_events'),
  reconciliationEntries: createTableRepo('bank_reconcile_entries'),
}

