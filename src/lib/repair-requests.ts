export const REPAIR_PRIORITIES = ["low", "normal", "urgent"] as const;
export type RepairPriority = (typeof REPAIR_PRIORITIES)[number];

export const REPAIR_STATUSES = [
  "submitted",
  "acknowledged",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export function repairPriorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "Low";
    case "urgent":
      return "Urgent";
    default:
      return "Normal";
  }
}

export function repairStatusLabel(status: string): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "acknowledged":
      return "Acknowledged";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function isRepairPriority(value: string): value is RepairPriority {
  return (REPAIR_PRIORITIES as readonly string[]).includes(value);
}

export function isRepairStatus(value: string): value is RepairStatus {
  return (REPAIR_STATUSES as readonly string[]).includes(value);
}
