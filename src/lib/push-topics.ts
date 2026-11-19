/**
 * What people can get notifications about. Turning notifications on switches on every topic; each can be switched off
 * on the Notifications page. Safe to use in the browser (no keys or server code here).
 */
export const TOPICS = [
  { id: "devotional", label: "Thought for the Day", note: "a short thought on weekday mornings" },
  { id: "announcements", label: "Announcements", note: "church news and events" },
] as const;
export type Topic = (typeof TOPICS)[number]["id"];
export const isTopic = (t: unknown): t is Topic => TOPICS.some((x) => x.id === t);
