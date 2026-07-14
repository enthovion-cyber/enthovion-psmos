export function validateEntitlementCheck(input: { entitlementKey?: string; moduleKey?: string; limitKey?: string }) {
  return input.entitlementKey || input.moduleKey || input.limitKey ? [] : ['Entitlement, module, or limit key is required.'];
}
