import { subscribe, unsubscribe } from "../../shared/lib/eventBus";

export interface StreamEvent {
  type: string;
  data: any;
  timestamp: number;
}

export const streamService = {
  subscribe,
  unsubscribe,
};
