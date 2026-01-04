# Realtime Chat Backend

A robust, real-time chat application backend built with Node.js, Express, Socket.IO, and MySQL. Features include real-time messaging, read receipts, typing indicators, online status tracking, and comprehensive REST API endpoints.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using WebSockets (Socket.IO)
- **Read Receipts**: Track when messages are read with real-time notifications
- **Typing Indicators**: See when users are typing
- **Online Status**: Track user online/offline status
- **REST API**: Complete RESTful API for message management
- **Authentication**: JWT-based authentication system
- **Message History**: Retrieve conversation history via API
- **Unread Count**: Track unread messages per conversation
- **Database Persistence**: All messages and read statuses are persisted in MySQL

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-chat-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=realtime_chat
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Create the database**
   ```sql
   CREATE DATABASE realtime_chat;
   ```

5. **Start the server**
   ```bash
   node src/server.js
   ```
   
   Or with nodemon for development:
   ```bash
   npx nodemon src/server.js
   ```

   The server will automatically sync the database schema on startup.

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### POST `/api/auth/login`
Login and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Messages (Requires Authentication)

All message endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### GET `/api/messages/conversation/:otherUserId`
Get conversation history between current user and another user.

**Response:**
```json
[
  {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "content": "Hello!",
    "isRead": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "sender": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "receiver": {
      "id": 2,
      "username": "janedoe",
      "email": "jane@example.com"
    }
  }
]
```

#### GET `/api/messages/conversations`
Get all conversations for the current user with last message and unread count.

**Response:**
```json
[
  {
    "partner": {
      "id": 2,
      "username": "janedoe",
      "email": "jane@example.com",
      "isOnline": true,
      "lastSeen": "2024-01-15T10:30:00.000Z"
    },
    "lastMessage": {
      "id": 1,
      "content": "Hello!",
      "isRead": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "unreadCount": 0
  }
]
```

#### GET `/api/messages/unread-count`
Get total unread message count for current user.

**Response:**
```json
{
  "unreadCount": 5
}
```

#### POST `/api/messages/mark-as-read`
Mark messages as read.

**Request Body (Option 1 - Mark specific messages):**
```json
{
  "messageIds": [1, 2, 3]
}
```

**Request Body (Option 2 - Mark all from a sender):**
```json
{
  "senderId": 2
}
```

**Response:**
```json
{
  "message": "Messages marked as read"
}
```

## 🔌 Socket.IO Events

### Client → Server Events

#### `sendMessage`
Send a message to another user.

```javascript
socket.emit("sendMessage", {
  receiverId: 2,
  content: "Hello!"
});
```

#### `messageRead`
Mark a single message as read.

```javascript
socket.emit("messageRead", {
  messageId: 1
});
```

#### `markAllAsRead`
Mark all messages from a specific sender as read.

```javascript
socket.emit("markAllAsRead", {
  senderId: 2
});
```

#### `typing`
Notify that user is typing.

```javascript
socket.emit("typing", {
  receiverId: 2
});
```

#### `stopTyping`
Notify that user stopped typing.

```javascript
socket.emit("stopTyping", {
  receiverId: 2
});
```

### Server → Client Events

#### `messageSent`
Confirmation that message was sent (sent to sender).

```javascript
socket.on("messageSent", (message) => {
  console.log("Message sent:", message);
  // message contains: id, senderId, receiverId, content, isRead, createdAt, etc.
});
```

#### `receiveMessage`
New message received (sent to receiver).

```javascript
socket.on("receiveMessage", (message) => {
  console.log("New message:", message);
});
```

#### `messageReadConfirmed`
Confirmation that message was marked as read (sent to receiver).

```javascript
socket.on("messageReadConfirmed", (message) => {
  console.log("Message marked as read:", message);
});
```

#### `messageReadByReceiver`
Notification that message was read (sent to sender).

```javascript
socket.on("messageReadByReceiver", (message) => {
  console.log("Your message was read:", message);
});
```

#### `messagesReadByReceiver`
Notification that multiple messages were read (sent to sender).

```javascript
socket.on("messagesReadByReceiver", (data) => {
  console.log(`${data.count} messages were read by user ${data.receiverId}`);
});
```

#### `allMessagesRead`
Confirmation that all messages were marked as read.

```javascript
socket.on("allMessagesRead", (data) => {
  console.log(`All messages from user ${data.senderId} marked as read`);
});
```

#### `typing`
User is typing notification.

```javascript
socket.on("typing", (data) => {
  console.log(`User ${data.senderId} is typing`);
});
```

#### `stopTyping`
User stopped typing notification.

```javascript
socket.on("stopTyping", (data) => {
  console.log(`User ${data.senderId} stopped typing`);
});
```

#### `error`
Error notification.

```javascript
socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

## 🔐 Socket Authentication

Connect to Socket.IO with JWT token:

```javascript
const socket = io("http://localhost:4000", {
  auth: {
    token: "your_jwt_token_here"
  }
});
```

## 📁 Project Structure

```
realtime-chat-backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # HTTP server and Socket.IO setup
│   ├── socket.js              # Socket.IO event handlers
│   ├── config/
│   │   └── database.js        # Sequelize database configuration
│   ├── models/
│   │   ├── index.js           # Model associations
│   │   ├── User.js            # User model
│   │   └── Message.js         # Message model
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── messageController.js # Message API logic
│   ├── routes/
│   │   ├── authRoutes.js      # Authentication routes
│   │   └── messageRoutes.js   # Message routes
│   └── middleware/
│       └── authMiddleware.js  # JWT authentication middleware
├── test-client.js             # Test client for User A
├── test-client-b.js           # Test client for User B
├── test-comprehensive.js      # Comprehensive test suite
├── package.json
└── README.md
```

## 🧪 Testing

### Running Tests

1. **Start the server**
   ```bash
   node src/server.js
   ```

2. **Run comprehensive tests** (in another terminal)
   ```bash
   node test-comprehensive.js
   ```

The test suite will:
- Create test users
- Test socket connections
- Test message sending and receiving
- Test read receipts
- Test REST API endpoints
- Verify `isRead` status persistence

### Manual Testing with Test Clients

1. **Get JWT tokens** by logging in via API:
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Update test clients** with valid tokens in `test-client.js` and `test-client-b.js`

3. **Run test clients**:
   ```bash
   # Terminal 1
   node test-client-b.js
   
   # Terminal 2
   node test-client.js
   ```

## 📊 Database Schema

### Users Table
- `id` (INTEGER, Primary Key, Auto Increment)
- `username` (STRING, Unique, Not Null)
- `email` (STRING, Unique, Not Null)
- `password` (STRING, Not Null) - Hashed with bcrypt
- `isOnline` (BOOLEAN, Default: false)
- `lastSeen` (DATE, Nullable)
- `createdAt` (DATE)
- `updatedAt` (DATE)

### Messages Table
- `id` (INTEGER, Primary Key, Auto Increment)
- `senderId` (INTEGER, Foreign Key → Users.id)
- `receiverId` (INTEGER, Foreign Key → Users.id)
- `content` (TEXT, Not Null)
- `isRead` (BOOLEAN, Default: false)
- `createdAt` (DATE)
- `updatedAt` (DATE)

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Socket.IO authentication middleware
- Protected REST API routes
- Input validation
- SQL injection protection (via Sequelize ORM)

## 🚦 Usage Example

### Complete Flow Example

```javascript
const { io } = require("socket.io-client");
const axios = require("axios");

const BASE_URL = "http://localhost:4000";

// 1. Register/Login
const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
  email: "user@example.com",
  password: "password123"
});
const token = loginResponse.data.token;

// 2. Connect Socket
const socket = io(BASE_URL, {
  auth: { token }
});

socket.on("connect", () => {
  console.log("Connected!");
  
  // 3. Send message
  socket.emit("sendMessage", {
    receiverId: 2,
    content: "Hello!"
  });
});

// 4. Listen for messages
socket.on("receiveMessage", (message) => {
  console.log("Received:", message.content);
  
  // 5. Mark as read
  socket.emit("messageRead", { messageId: message.id });
});

// 6. Get conversation history
const conversation = await axios.get(
  `${BASE_URL}/api/messages/conversation/2`,
  { headers: { Authorization: `Bearer ${token}` } }
);
console.log("Conversation:", conversation.data);
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file has correct database credentials
- Ensure database exists: `CREATE DATABASE realtime_chat;`

### Socket Connection Issues
- Verify server is running on correct port
- Check JWT token is valid and not expired
- Ensure CORS is properly configured

### Read Receipt Not Working
- Verify `messageRead` event is being emitted with correct `messageId`
- Check that `receiverId` matches the authenticated user
- Ensure database update is successful (check server logs)

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Node.js, Express, Socket.IO, and MySQL**

