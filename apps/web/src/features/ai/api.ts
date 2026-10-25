import { copilotService } from './services/copilot.service';

export const askCopilot = (payload: { query: string; context?: { siteId?: string; module?: string; recordId?: string } }) => {
  return copilotService.ask(payload.query, payload.context?.module);
};

export const fetchAiStatus = () => {
  return copilotService.getStatus();
};

export { copilotService };
