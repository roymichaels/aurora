import Dexie, { type Table } from "dexie";
import {
  addRxPlugin,
  createRxDatabase,
  type RxCollection,
  type RxDatabase,
  type RxJsonSchema,
} from "rxdb";
import { RxDBAttachmentsPlugin } from "rxdb/plugins/attachments";
import { RxDBEncryptionPlugin } from "rxdb/plugins/encryption-crypto-js";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import type { Observable } from "rxjs";
import { getDataKey } from "@/state/keyManager";

export interface RoadmapTask {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string | null;
  status: string;
  due_at?: string | null;
  completed_at?: string | null;
  position?: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Stat {
  id: string;
  level: number;
  xp: number;
  streak: number;
  lastCheckIn?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a gamification achievement earned by the user.
 */
export interface Achievement {
  id: string;
  name: string;
  description?: string | null;
  earned_at: string;
  created_at: string;
  updated_at: string;
}

export class AuroraDB extends Dexie {
  tasks!: Table<RoadmapTask, string>;
  stats!: Table<Stat, string>;
  achievements!: Table<Achievement, string>;

  constructor() {
    super("aurora");
    this.version(1).stores({
      tasks: "&id,updated_at",
      stats: "&id",
      achievements: "&id,earned_at",
    });
  }
}

export const db = new AuroraDB();

// ----- RxDB setup for journal, focus sessions, simple tasks and goals -----
addRxPlugin(RxDBAttachmentsPlugin);
addRxPlugin(RxDBEncryptionPlugin);

export interface JournalEntry {
  id: string;
  content: string;
  mood?: string;
  ts: number;
  tags?: string[];
}

export interface FocusSession {
  id: string;
  started: number;
  ended?: number;
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  status: string;
}

const journalSchema: RxJsonSchema<JournalEntry> = {
  title: "journal schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    content: { type: "string" },
    mood: { type: "string" },
    ts: { type: "number" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["id", "content", "ts"],
};

const focusSessionSchema: RxJsonSchema<FocusSession> = {
  title: "focus session schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    started: { type: "number" },
    ended: { type: "number" },
  },
  required: ["id", "started"],
};

const taskSchema: RxJsonSchema<TaskItem> = {
  title: "task schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    done: { type: "boolean" },
  },
  required: ["id", "title", "done"],
};

const goalSchema: RxJsonSchema<GoalItem> = {
  title: "goal schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string" },
  },
  required: ["id", "title", "status"],
};

export type Collections = {
  journal: RxCollection<JournalEntry>;
  focus_sessions: RxCollection<FocusSession>;
  tasks: RxCollection<TaskItem>;
  goals: RxCollection<GoalItem>;
};

let dbPromise: Promise<RxDatabase<Collections>> | null = null;

export async function createDatabase(): Promise<RxDatabase<Collections>> {
  if (!dbPromise) {
    const key = getDataKey();
    if (!key) throw new Error("Data key not set");
    const password = btoa(String.fromCharCode(...key));
    dbPromise = createRxDatabase<Collections>({
      name: "brain",
      storage: getRxStorageDexie(),
      password,
    }).then(async (db) => {
      await db.addCollections({
        journal: { schema: journalSchema },
        focus_sessions: { schema: focusSessionSchema },
        tasks: { schema: taskSchema },
        goals: { schema: goalSchema },
      });
      return db;
    });
  }
  return dbPromise;
}

// Journal helpers
export async function addJournal(entry: JournalEntry) {
  const db = await createDatabase();
  return db.journal.insert(entry);
}

export async function getJournal(id: string) {
  const db = await createDatabase();
  return db.journal.findOne(id).exec();
}

export async function updateJournal(id: string, data: Partial<JournalEntry>) {
  const doc = await getJournal(id);
  return doc?.update({ $set: data });
}

export async function removeJournal(id: string) {
  const doc = await getJournal(id);
  return doc?.remove();
}

export async function journal$(): Promise<Observable<JournalEntry[]>> {
  const db = await createDatabase();
  // @ts-ignore - rxdb observable type
  return db.journal.find().$;
}

// Focus session helpers
export async function addFocusSession(entry: FocusSession) {
  const db = await createDatabase();
  return db.focus_sessions.insert(entry);
}

export async function updateFocusSession(
  id: string,
  data: Partial<FocusSession>,
) {
  const db = await createDatabase();
  const doc = await db.focus_sessions.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeFocusSession(id: string) {
  const db = await createDatabase();
  const doc = await db.focus_sessions.findOne(id).exec();
  return doc?.remove();
}

export async function focusSessions$(): Promise<Observable<FocusSession[]>> {
  const db = await createDatabase();
  // @ts-ignore
  return db.focus_sessions.find().$;
}

// Simple task helpers
export async function addTask(entry: TaskItem) {
  const db = await createDatabase();
  return db.tasks.insert(entry);
}

export async function updateTask(id: string, data: Partial<TaskItem>) {
  const db = await createDatabase();
  const doc = await db.tasks.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeTask(id: string) {
  const db = await createDatabase();
  const doc = await db.tasks.findOne(id).exec();
  return doc?.remove();
}

export async function tasks$(): Promise<Observable<TaskItem[]>> {
  const db = await createDatabase();
  // @ts-ignore
  return db.tasks.find().$;
}

// Goal helpers
export async function addGoal(entry: GoalItem) {
  const db = await createDatabase();
  return db.goals.insert(entry);
}

export async function updateGoal(id: string, data: Partial<GoalItem>) {
  const db = await createDatabase();
  const doc = await db.goals.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeGoal(id: string) {
  const db = await createDatabase();
  const doc = await db.goals.findOne(id).exec();
  return doc?.remove();
}

export async function goals$(): Promise<Observable<GoalItem[]>> {
  const db = await createDatabase();
  // @ts-ignore
  return db.goals.find().$;
}

