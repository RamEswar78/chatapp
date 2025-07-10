export const UserSockets = new Map<string, WebSocket>();
import WebSocket from "ws";

export function addUserSocket(userId: string, socket: WebSocket): void {
  UserSockets.set(userId, socket);
}

export function removeUserSocket(userId: string): void {
  UserSockets.delete(userId);
}

export function getUserSocket(userId: string): WebSocket | undefined {
  return UserSockets.get(userId);
}
