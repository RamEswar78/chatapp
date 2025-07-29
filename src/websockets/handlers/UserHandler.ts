export const UserSockets = new Map<string, WebSocket>();
export const SocketUsers = new Map<WebSocket, number>(); // Map socket to userId
import WebSocket from "ws";

export function addUserSocket(userId: string, socket: WebSocket): void {
  UserSockets.set(userId, socket);
  SocketUsers.set(socket, parseInt(userId));
}

export function removeUserSocket(userId: string): void {
  const socket = UserSockets.get(userId);
  if (socket) {
    SocketUsers.delete(socket);
  }
  UserSockets.delete(userId);
}

export function getUserSocket(userId: string | number): WebSocket | undefined {
  return UserSockets.get(userId.toString());
}

export function getUserId(socket: WebSocket): number | undefined {
  return SocketUsers.get(socket);
}

export function removeSocketUser(socket: WebSocket): void {
  const userId = SocketUsers.get(socket);
  if (userId) {
    UserSockets.delete(userId.toString());
    SocketUsers.delete(socket);
  }
}
