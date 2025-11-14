// Firebase Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

console.log('🔧 [SERVICE WORKER] Loading service worker...');

firebase.initializeApp({
  apiKey: "AIzaSyDK5fo00Yly9Byw3vYj3xnFHV9TTRTJE-Y",
  authDomain: "flowchat-a513e.firebaseapp.com",
  projectId: "flowchat-a513e",
  storageBucket: "flowchat-a513e.firebasestorage.app",
  messagingSenderId: "258098836357",
  appId: "1:258098836357:web:b853394f3bb9206d0f0aec"
});

console.log('🔧 [SERVICE WORKER] Firebase initialized');

const messaging = firebase.messaging();

// Track processed message IDs to prevent duplicates
const processedMessages = new Set();
let notificationCounter = 0;

console.log('🔧 [SERVICE WORKER] Setting up background message handler...');

// Handle background messages - ONLY when app is in background
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SERVICE WORKER] Background message received:', payload);
  
  const messageId = payload.data?.messageId;
  
  if (messageId && processedMessages.has(messageId)) {
    console.log('🔔 [SERVICE WORKER] Duplicate detected, skipping:', messageId);
    return;
  }
  
  if (messageId) {
    processedMessages.add(messageId);
  }

  // Get title and body from data payload instead of notification field
  const notificationTitle = payload.data?.notificationTitle || 'New Message';
  const notificationBody = payload.data?.notificationBody || 'You have a new message';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data,
    tag: messageId || `notification-${Date.now()}`,
    requireInteraction: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('🔧 [SERVICE WORKER] Background message handler registered');

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 [SERVICE WORKER] Notification click received');
  console.log('🔔 [SERVICE WORKER] Event:', event);
  console.log('🔔 [SERVICE WORKER] Notification data:', event.notification.data);
  
  event.notification.close();
  console.log('🔔 [SERVICE WORKER] Notification closed');

  const payload = event.notification.data;
  
  if (payload) {
    let targetUrl = '/';
    
    if (payload.type === 'new_message' && payload.senderId) {
      targetUrl = `/chat/${payload.senderId}`;
    } else if (payload.type === 'new_group_message' && payload.groupId) {
      targetUrl = `/group/${payload.groupId}`;
    }
    
    console.log('🔔 [SERVICE WORKER] Target URL:', targetUrl);
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        console.log('🔔 [SERVICE WORKER] Found clients:', windowClients.length);
        
        for (let client of windowClients) {
          console.log('🔔 [SERVICE WORKER] Client URL:', client.url);
          if ('focus' in client) {
            console.log('🔔 [SERVICE WORKER] Focusing existing client');
            return client.focus().then(() => {
              if (client.postMessage) {
                client.postMessage({
                  type: 'NOTIFICATION_CLICKED',
                  data: payload
                });
                console.log('🔔 [SERVICE WORKER] Posted message to client');
              }
              return client;
            });
          }
        }
        
        if (clients.openWindow) {
          console.log('🔔 [SERVICE WORKER] Opening new window:', targetUrl);
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

console.log('🔧 [SERVICE WORKER] Notification click handler registered');
console.log('🔧 [SERVICE WORKER] Service worker setup complete');