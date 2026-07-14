export const upgradeService = {
  moduleReason(moduleKey: string) {
    return `The ${moduleKey} module is not included in your current company plan.`;
  },
  limitReason(limitKey: string) {
    return `The ${limitKey} limit has been reached for your current company plan.`;
  }
};
