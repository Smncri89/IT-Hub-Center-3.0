
import { eventBus } from '@/utils/eventBus';
import { Notification } from '@/types';

const messages = [
  "New critical incident reported: 'Email Server Down'.",
  "SLA for ticket TKT-001 is about to be breached.",
  "License for 'Adobe Creative Cloud' is expiring in 30 days.",
  "A new asset 'MacBook Pro 16\"' has been assigned to Agent Smith.",
  "Ticket TKT-002 status changed to 'In Progress'.",
  "Security alert: Multiple failed login attempts for admin@example.com."
];

const types: Notification['type'][] = ['info', 'warning', 'success', 'error'];

function simulateWebhookEvent() {
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  const randomType = types[Math.floor(Math.random() * types.length)];

  const notification: Omit<Notification, 'id'> = {
    type: randomType,
    message: randomMessage,
    timestamp: new Date().toISOString(),
    read: false,
  };

  eventBus.emit('notification', notification);
}

// Start simulating events every 15-30 seconds
function startSimulation() {
    const randomInterval = Math.random() * (30000 - 15000) + 15000;
    setTimeout(() => {
        simulateWebhookEvent();
        startSimulation();
    }, randomInterval);
}

startSimulation();
