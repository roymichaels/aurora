// Utilities for scheduling and firing task triggers.
// Triggers can deliver messages either via browser notifications or email.

export type TriggerDelivery = 'notification' | 'email';

export interface Trigger {
  /** Message to deliver when the trigger fires */
  message: string;
  /** Time when the trigger should fire */
  schedule: Date;
  /** Delivery mechanism */
  delivery: TriggerDelivery;
}

const PREFERENCE_KEY = 'settings.triggerDelivery';
const TRIGGERED_KEY = 'task.triggers.fired';
const scheduled: Record<string, number> = {};

function getPreference(): TriggerDelivery {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    return raw ? (JSON.parse(raw) as TriggerDelivery) : 'notification';
  } catch {
    return 'notification';
  }
}

function getTriggered(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(TRIGGERED_KEY) || '{}');
  } catch {
    return {};
  }
}

function markTriggered(id: string) {
  try {
    const fired = getTriggered();
    fired[id] = true;
    localStorage.setItem(TRIGGERED_KEY, JSON.stringify(fired));
  } catch {}
}

async function fireTrigger(trigger: Trigger, email?: string) {
  if (trigger.delivery === 'notification') {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification(trigger.message);
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') new Notification(trigger.message);
      }
    } else {
      // Fallback to alert if notifications unavailable
      alert(trigger.message);
    }
  } else if (trigger.delivery === 'email') {
    if (email) {
      const subject = encodeURIComponent('Task Reminder');
      const body = encodeURIComponent(trigger.message);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  }
}

export function scheduleTrigger(trigger: Trigger, email?: string, id?: string) {
  const delay = trigger.schedule.getTime() - Date.now();
  const run = () => {
    fireTrigger(trigger, email);
    if (id) markTriggered(id);
  };
  if (delay <= 0) {
    run();
  } else {
    const timeoutId = window.setTimeout(run, delay);
    if (id) scheduled[id] = timeoutId;
  }
}

export interface TaskLike {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
}

export function scheduleTaskTriggers(tasks: TaskLike[], opts?: { email?: string }) {
  const fired = getTriggered();
  const delivery = getPreference();
  tasks.forEach((t) => {
    if (!t.due_at || t.status === 'done') return;
    if (fired[t.id] || scheduled[t.id]) return;
    const dueDate = new Date(t.due_at);
    const trigger: Trigger = {
      message: `Task "${t.title}" is due`,
      schedule: dueDate,
      delivery,
    };
    scheduleTrigger(trigger, opts?.email, t.id);
  });
}

export { getPreference as getTriggerPreference };
