export type AgentToastPayload = {
  title: string;
  body?: string;
  tone?: "default" | "success";
};

type Listener = (payload: AgentToastPayload) => void;

const listeners = new Set<Listener>();

export function showAgentToast(payload: AgentToastPayload) {
  listeners.forEach((l) => l(payload));
}

export function subscribeAgentToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    void listeners.delete(listener);
  };
}
