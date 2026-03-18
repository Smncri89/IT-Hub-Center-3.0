
type Callback = (...args: any[]) => void;
// FIX: Add Unsubscribe type and update `on` method to return an unsubscribe function.
// This enables a cleaner pattern for removing listeners and fixes a bug where `on` was assumed to return a function.
type Unsubscribe = () => void;

interface Events {
  [key: string]: Callback[];
}

class EventBus {
  private events: Events;

  constructor() {
    this.events = {};
  }

  on(event: string, callback: Callback): Unsubscribe {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback: Callback): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event].filter(
      (cb) => cb !== callback
    );
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event].forEach((callback) => {
      callback(...args);
    });
  }
}

export const eventBus = new EventBus();