# Enhanced Chat Application Backend API v2.0

## Overview

Enterprise-grade chat application backend built with Express.js, TypeScript, Prisma ORM, and WebSocket for real-time messaging. Fully optimized for React Native frontend integration with comprehensive features including group chats, file sharing, user preferences, and contact management.

## 🚀 Features

- **Advanced Authentication**: JWT-based with OTP email verification
- **Real-time Messaging**: WebSocket with message persistence and read receipts
- **Group & Direct Chats**: Support for both one-on-one and group conversations
- **File Sharing**: Support for images, files, audio, and video messages
- **User Management**: Profiles, preferences, contacts, and blocking
- **Message Features**: Edit, delete, reply, and read status tracking
- **Online Status**: Real-time user presence and last seen
- **Contact Management**: Add, organize, and block contacts
- **User Preferences**: Customizable themes, notifications, and settings

## 📡 API Endpoints

### Authentication

```http
POST /auth/sendOtp           # Send OTP to email
POST /auth/verifyOtp         # Verify OTP and get JWT token
```

### User Management

```http
GET    /users/profile             # Get current user profile
PUT    /users/profile             # Update user profile
GET    /users/search              # Search users by username/email/phone
GET    /users/status/:userId      # Get user online status
PUT    /users/online-status       # Update online status
PUT    /users/change-password     # Change user password
```

### Chat Management

```http
POST   /chats/                    # Create new chat (direct/group)
GET    /chats/                    # Get user's chats with last messages
GET    /chats/:chatId             # Get chat details
PUT    /chats/:chatId             # Update chat info (name, description, avatar)
POST   /chats/:chatId/participants           # Add participant to group chat
DELETE /chats/:chatId/participants/:userId   # Remove participant from chat
```

### Message Operations

```http
GET    /chats/:chatId/messages               # Get chat messages (paginated)
POST   /chats/:chatId/messages               # Send new message
PUT    /chats/:chatId/messages/read          # Mark all messages as read
PUT    /chats/messages/:messageId            # Edit message
DELETE /chats/messages/:messageId            # Delete message
GET    /chats/messages/:messageId/read-status # Get message read status
```

### User Preferences & Contacts

```http
GET    /preferences/                    # Get user preferences
PUT    /preferences/                    # Update user preferences
POST   /preferences/contacts           # Add contact
GET    /preferences/contacts           # Get user contacts
GET    /preferences/contacts/blocked   # Get blocked contacts
PUT    /preferences/contacts/:id       # Update contact
DELETE /preferences/contacts/:id       # Remove contact
```

### System

```http
GET    /health                   # Health check and server status
```

## 🔌 WebSocket Connection

### Connection

Connect with JWT authentication:

```javascript
const ws = new WebSocket(`ws://localhost:3000?token=${jwtToken}`);
```

### Message Types

Send different types of messages:

**Text Message:**

```json
{
  "type": "onetoone",
  "chatId": 123,
  "message": "Hello there!"
}
```

**File Message (via REST API):**

```json
{
  "content": "Check out this image!",
  "messageType": "image",
  "fileUrl": "https://example.com/image.jpg",
  "fileName": "vacation.jpg",
  "fileSize": 1024000
}
```

**Reply Message:**

```json
{
  "content": "Thanks for sharing!",
  "replyToMessageId": 456
}
```

## 🔧 Environment Setup

Create `.env` file:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/chatapp_enhanced"
JWT_SECRET="your-super-secret-jwt-key"
MAILUSERNAME="your-email@gmail.com"
MAILPASSWORD="your-gmail-app-password"
PORT=3000
NODE_ENV="development"
```

## 🚀 Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Setup database:**

```bash
npx prisma migrate dev --name enhanced_schema
npx prisma generate
```

3. **Start development server:**

```bash
npm run dev
```

## 📱 React Native Integration Examples

### Authentication Flow

```javascript
// Send OTP
const sendOTP = async (email) => {
  const response = await fetch(`${API_BASE}/auth/sendOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (email, otp) => {
  const response = await fetch(`${API_BASE}/auth/verifyOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (data.token) {
    await AsyncStorage.setItem("authToken", data.token);
  }
  return data;
};
```

### Chat Management

```javascript
// Get user chats
const getUserChats = async () => {
  const token = await AsyncStorage.getItem("authToken");
  const response = await fetch(`${API_BASE}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Create new chat
const createChat = async (participantId) => {
  const token = await AsyncStorage.getItem("authToken");
  const response = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ participantId, chatType: "direct" }),
  });
  return response.json();
};
```

### Real-time Messaging

```javascript
import { useEffect, useState } from "react";

const useWebSocket = (token) => {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (token) {
      const websocket = new WebSocket(`ws://localhost:3000?token=${token}`);

      websocket.onopen = () => {
        console.log("Connected to chat server");
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => [...prev, data.data]);
        }
      };

      websocket.onclose = () => {
        console.log("Disconnected from chat server");
        setWs(null);
      };

      return () => websocket.close();
    }
  }, [token]);

  const sendMessage = (chatId, message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "onetoone",
          chatId,
          message,
        })
      );
    }
  };

  return { sendMessage, messages };
};
```

## 🏗️ Production Ready Features

- ✅ **Comprehensive Error Handling**
- ✅ **Input Validation & Sanitization**
- ✅ **Database Transactions**
- ✅ **Real-time Messaging**
- ✅ **File Upload Support**
- ✅ **User Privacy Controls**
- ✅ **Contact Management**
- ✅ **Group Chat Administration**
- ✅ **Message Read Receipts**
- ✅ **Online Status Tracking**
- ✅ **Comprehensive Logging**
- ✅ **Health Check Endpoints**
- ✅ **TypeScript Type Safety**
- ✅ **Database Migrations**

## 🧪 Testing

Test WebSocket connection:

```bash
node test-websocket.js
```

Test API endpoints:

```bash
# Import postman_collection.json into Postman
curl -X GET http://localhost:3000/health
```

---

Your enhanced chat application backend is now **enterprise-ready** with comprehensive features for modern messaging applications! 🎉
