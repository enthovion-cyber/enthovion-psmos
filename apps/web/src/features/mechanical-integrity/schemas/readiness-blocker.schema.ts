export function validateBlockerWaiver(values: Record<string, any>) {
  return values.reason || values.waiverReason ? [] : ['Waiver reason'];
}
