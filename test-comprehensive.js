const { io } = require("socket.io-client");
const axios = require("axios");

const BASE_URL = "http://localhost:4000";
const SOCKET_URL = "http://localhost:4000";

// Test configuration
let user1Token = null;
let user2Token = null;
let user1Id = null;
let user2Id = null;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Create users and get tokens
async function setupUsers() {
  log("\n=== SETUP: Creating Test Users ===", "cyan");
  
  try {
    // Create User 1
    try {
      await axios.post(`${BASE_URL}/api/auth/signup`, {
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
      });
      log("✅ User 1 created", "green");
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        log("ℹ️  User 1 already exists", "yellow");
      } else {
        throw err;
      }
    }

    // Create User 2
    try {
      await axios.post(`${BASE_URL}/api/auth/signup`, {
        username: "testuser2",
        email: "test2@test.com",
        password: "password123",
      });
      log("✅ User 2 created", "green");
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        log("ℹ️  User 2 already exists", "yellow");
      } else {
        throw err;
      }
    }

    // Login User 1
    const login1 = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "test1@test.com",
      password: "password123",
    });
    user1Token = login1.data.token;
    log("✅ User 1 logged in", "green");

    // Login User 2
    const login2 = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "test2@test.com",
      password: "password123",
    });
    user2Token = login2.data.token;
    log("✅ User 2 logged in", "green");

    // Decode tokens to get user IDs (simple decode, no verification needed for testing)
    const jwt = require("jsonwebtoken");
    const decoded1 = jwt.decode(user1Token);
    const decoded2 = jwt.decode(user2Token);
    user1Id = decoded1.userId;
    user2Id = decoded2.userId;

    log(`📋 User 1 ID: ${user1Id}`, "blue");
    log(`📋 User 2 ID: ${user2Id}`, "blue");

    return true;
  } catch (err) {
    log(`❌ Setup failed: ${err.message}`, "red");
    if (err.response) {
      log(`   Response: ${JSON.stringify(err.response.data)}`, "red");
    }
    return false;
  }
}

// Test 2: Socket connection and message sending
function testSocketMessaging() {
  return new Promise((resolve) => {
    log("\n=== TEST 1: Socket Messaging ===", "cyan");

    const results = {
      user1Connected: false,
      user2Connected: false,
      messageSent: false,
      messageReceived: false,
      messageRead: false,
      senderNotified: false,
    };

    // User 1 Socket (Sender)
    const socket1 = io(SOCKET_URL, {
      auth: { token: user1Token },
    });

    let sentMessage = null;

    socket1.on("connect", () => {
      log("✅ User 1 (sender) connected", "green");
      results.user1Connected = true;

      // Send message after a short delay
      setTimeout(() => {
        socket1.emit("sendMessage", {
          receiverId: user2Id,
          content: "Test message for read receipt",
        });
        log("📤 User 1 sent message", "blue");
      }, 1000);
    });

    socket1.on("messageSent", (message) => {
      log("✅ User 1 received messageSent confirmation", "green");
      sentMessage = message;
      results.messageSent = true;
      log(`   Message ID: ${message.id}, isRead: ${message.isRead}`, "blue");
    });

    socket1.on("messageReadByReceiver", (message) => {
      log("✅ User 1 notified that message was read!", "green");
      log(`   Message ID: ${message.id}, isRead: ${message.isRead}`, "blue");
      results.senderNotified = true;
      results.messageRead = true;

      // Close sockets after test
      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        resolve(results);
      }, 1000);
    });

    socket1.on("error", (err) => {
      log(`❌ User 1 error: ${JSON.stringify(err)}`, "red");
    });

    // User 2 Socket (Receiver)
    const socket2 = io(SOCKET_URL, {
      auth: { token: user2Token },
    });

    socket2.on("connect", () => {
      log("✅ User 2 (receiver) connected", "green");
      results.user2Connected = true;
    });

    socket2.on("receiveMessage", (message) => {
      log("✅ User 2 received message", "green");
      log(`   Message ID: ${message.id}, isRead: ${message.isRead}`, "blue");
      results.messageReceived = true;

      // Mark message as read after receiving
      setTimeout(() => {
        socket2.emit("messageRead", { messageId: message.id });
        log("📖 User 2 marking message as read", "blue");
      }, 500);
    });

    socket2.on("messageReadConfirmed", (message) => {
      log("✅ User 2 received read confirmation", "green");
      log(`   Message ID: ${message.id}, isRead: ${message.isRead}`, "blue");
    });

    socket2.on("error", (err) => {
      log(`❌ User 2 error: ${JSON.stringify(err)}`, "red");
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!results.senderNotified) {
        log("⏱️  Test timeout - closing sockets", "yellow");
        socket1.disconnect();
        socket2.disconnect();
        resolve(results);
      }
    }, 10000);
  });
}

// Test 3: REST API - Get conversation
async function testGetConversation() {
  log("\n=== TEST 2: REST API - Get Conversation ===", "cyan");

  try {
    const response = await axios.get(
      `${BASE_URL}/api/messages/conversation/${user2Id}`,
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    const messages = response.data;
    log(`✅ Retrieved ${messages.length} messages`, "green");

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      log(`   Last message ID: ${lastMessage.id}`, "blue");
      log(`   Last message isRead: ${lastMessage.isRead}`, "blue");
      log(`   Last message content: ${lastMessage.content}`, "blue");

      // Check if the last message is marked as read
      if (lastMessage.isRead === true) {
        log("✅ Last message is correctly marked as read!", "green");
        return { success: true, isRead: true };
      } else {
        log("❌ Last message is NOT marked as read (should be true)", "red");
        return { success: false, isRead: false };
      }
    } else {
      log("⚠️  No messages found", "yellow");
      return { success: false, noMessages: true };
    }
  } catch (err) {
    log(`❌ Failed to get conversation: ${err.message}`, "red");
    if (err.response) {
      log(`   Response: ${JSON.stringify(err.response.data)}`, "red");
    }
    return { success: false, error: err.message };
  }
}

// Test 4: REST API - Get unread count
async function testGetUnreadCount() {
  log("\n=== TEST 3: REST API - Get Unread Count ===", "cyan");

  try {
    const response = await axios.get(`${BASE_URL}/api/messages/unread-count`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    log(`✅ Unread count: ${response.data.unreadCount}`, "green");
    return { success: true, count: response.data.unreadCount };
  } catch (err) {
    log(`❌ Failed to get unread count: ${err.message}`, "red");
    return { success: false, error: err.message };
  }
}

// Test 5: REST API - Mark as read
async function testMarkAsRead() {
  log("\n=== TEST 4: REST API - Mark Messages as Read ===", "cyan");

  try {
    // First, send a message via REST (we'll use socket for this, but mark via REST)
    // Actually, let's just test marking all messages from user1 as read
    const response = await axios.post(
      `${BASE_URL}/api/messages/mark-as-read`,
      { senderId: user1Id },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    log("✅ Messages marked as read via REST API", "green");
    return { success: true };
  } catch (err) {
    log(`❌ Failed to mark as read: ${err.message}`, "red");
    if (err.response) {
      log(`   Response: ${JSON.stringify(err.response.data)}`, "red");
    }
    return { success: false, error: err.message };
  }
}

// Main test runner
async function runTests() {
  log("\n🚀 Starting Comprehensive Backend Tests", "cyan");
  log("=" .repeat(50), "cyan");

  // Setup
  const setupSuccess = await setupUsers();
  if (!setupSuccess) {
    log("\n❌ Setup failed. Exiting.", "red");
    process.exit(1);
  }

  // Wait a bit for setup to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Run tests
  const socketResults = await testSocketMessaging();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const conversationResults = await testGetConversation();
  await new Promise((resolve) => setTimeout(resolve, 500));

  const unreadResults = await testGetUnreadCount();
  await new Promise((resolve) => setTimeout(resolve, 500));

  const markReadResults = await testMarkAsRead();

  // Summary
  log("\n" + "=".repeat(50), "cyan");
  log("📊 TEST SUMMARY", "cyan");
  log("=".repeat(50), "cyan");

  log(`\nSocket Tests:`, "blue");
  log(`  User 1 Connected: ${socketResults.user1Connected ? "✅" : "❌"}`, socketResults.user1Connected ? "green" : "red");
  log(`  User 2 Connected: ${socketResults.user2Connected ? "✅" : "❌"}`, socketResults.user2Connected ? "green" : "red");
  log(`  Message Sent: ${socketResults.messageSent ? "✅" : "❌"}`, socketResults.messageSent ? "green" : "red");
  log(`  Message Received: ${socketResults.messageReceived ? "✅" : "❌"}`, socketResults.messageReceived ? "green" : "red");
  log(`  Message Read: ${socketResults.messageRead ? "✅" : "❌"}`, socketResults.messageRead ? "green" : "red");
  log(`  Sender Notified: ${socketResults.senderNotified ? "✅" : "❌"}`, socketResults.senderNotified ? "green" : "red");

  log(`\nREST API Tests:`, "blue");
  log(`  Get Conversation: ${conversationResults.success ? "✅" : "❌"}`, conversationResults.success ? "green" : "red");
  if (conversationResults.isRead !== undefined) {
    log(`  isRead Status Correct: ${conversationResults.isRead ? "✅" : "❌"}`, conversationResults.isRead ? "green" : "red");
  }
  log(`  Get Unread Count: ${unreadResults.success ? "✅" : "❌"}`, unreadResults.success ? "green" : "red");
  log(`  Mark as Read: ${markReadResults.success ? "✅" : "❌"}`, markReadResults.success ? "green" : "red");

  const allPassed =
    socketResults.user1Connected &&
    socketResults.user2Connected &&
    socketResults.messageSent &&
    socketResults.messageReceived &&
    socketResults.senderNotified &&
    conversationResults.success &&
    (conversationResults.isRead === true || conversationResults.noMessages) &&
    unreadResults.success &&
    markReadResults.success;

  log("\n" + "=".repeat(50), "cyan");
  if (allPassed) {
    log("🎉 ALL TESTS PASSED!", "green");
  } else {
    log("⚠️  SOME TESTS FAILED", "yellow");
  }
  log("=".repeat(50), "cyan");

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((err) => {
  log(`\n❌ Fatal error: ${err.message}`, "red");
  process.exit(1);
});

