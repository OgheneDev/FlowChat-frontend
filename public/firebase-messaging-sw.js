// Firebase Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDK5fo00Yly9Byw3vYj3xnFHV9TTRTJE-Y",
  authDomain: "flowchat-a513e.firebaseapp.com",
  projectId: "flowchat-a513e",
  storageBucket: "flowchat-a513e.firebasestorage.app",
  messagingSenderId: "258098836357",
  appId: "1:258098836357:web:b853394f3bb9206d0f0aec"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data,
    tag: 'chat-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  const payload = event.notification.data;
  
  if (payload) {
    // Handle different notification types
    let targetUrl = '/';
    
    if (payload.type === 'new_message' && payload.senderId) {
      targetUrl = `/chat/${payload.senderId}`;
    } else if (payload.type === 'new_group_message' && payload.groupId) {
      targetUrl = `/group/${payload.groupId}`;
    }
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if app is already open
        for (let client of windowClients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});