export const OPERATION_STARTED_EVENT = "operation-started";
export const OPERATION_ENDED_EVENT = "operation-ended";

export function notifyOperationStarted(serverId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPERATION_STARTED_EVENT, {
      detail: { serverId },
    }),
  );
}

export function notifyOperationEnded(serverId?: string, operationType?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPERATION_ENDED_EVENT, {
      detail: { serverId, operationType },
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
