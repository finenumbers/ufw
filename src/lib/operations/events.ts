export const OPERATION_STARTED_EVENT = "operation-started";

export function notifyOperationStarted(serverId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPERATION_STARTED_EVENT, {
      detail: { serverId },
    }),
  );
}

function getDismissedOperationKey(operationId: string) {
  return `ufw-operation-dismissed:${operationId}`;
}

export function isOperationDismissed(operationId: string) {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(getDismissedOperationKey(operationId)) === "1";
}

export function dismissOperation(operationId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getDismissedOperationKey(operationId), "1");
}
