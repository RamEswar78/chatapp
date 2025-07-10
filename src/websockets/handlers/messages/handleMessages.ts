import { WebSocket } from "ws";
import { Message } from "../../../models/message";
import { getUserSocket } from "../UserHandler";
export function handleMessage(
    message: string,
    ws: WebSocket,
): void {
  try {
    // Parse the incoming message
    const parsedMessage: Message = JSON.parse(message);

    // Handle different types of messages based on the type property
    switch (parsedMessage.type) {
      case "onetoone":
        // Handle chat messages
        console.log(`Chat message from ${parsedMessage.SenderName}: ${parsedMessage.message}`);
        const recieversoocket = getUserSocket(parsedMessage.RecieverName);
        if (!recieversoocket) {
          console.log("user not connected now please try later");
          ws.send('{"error":"User not connected now, please try later"}');
          return;
        }
        recieversoocket.send(JSON.stringify({ parsedMessage }));
        break;

      case "group":
        // Handle notifications
        console.log(`Notification for ${parsedMessage.SenderName}: ${parsedMessage.message}`);
        // ws.send(
        //   JSON.stringify({
        //     type: "notification",
        //     content: parsedMessage.message,
        //   })
        // );
        break;

      default:
        console.error(`Unknown message type: ${parsedMessage.type}`);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    ws.send(JSON.stringify({ error: "Invalid message format" }));
  }
}
