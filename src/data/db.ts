import {
  addRxPlugin,
  createRxDatabase,
  type RxCollection,
  type RxDatabase,
  type RxJsonSchema,
} from "rxdb";
import { RxDBAttachmentsPlugin } from "rxdb/plugins/attachments";
import { wrappedKeyEncryptionCryptoJsStorage } from "rxdb/plugins/encryption-crypto-js";
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

// ---- Schemas --------------------------------------------------------------

const roadmapTaskSchema: RxJsonSchema<RoadmapTask> = {
  title: "roadmap task schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    roadmap_id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    status: { type: "string" },
    due_at: { type: "string" },
    completed_at: { type: "string" },
    position: { type: "number" },
    user_id: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "roadmap_id", "title", "status", "user_id", "created_at", "updated_at"],
};

const statSchema: RxJsonSchema<Stat> = {
  title: "stat schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    level: { type: "number" },
    xp: { type: "number" },
    streak: { type: "number" },
    lastCheckIn: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "level", "xp", "streak", "created_at", "updated_at"],
};

const achievementSchema: RxJsonSchema<Achievement> = {
  title: "achievement schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    earned_at: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
  required: ["id", "name", "earned_at", "created_at", "updated_at"],
};

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
  roadmap_tasks: RxCollection<RoadmapTask>;
  stats: RxCollection<Stat>;
  achievements: RxCollection<Achievement>;
  journal: RxCollection<JournalEntry>;
  focus_sessions: RxCollection<FocusSession>;
  simple_tasks: RxCollection<TaskItem>;
  goals: RxCollection<GoalItem>;
};

addRxPlugin(RxDBAttachmentsPlugin);

let dbPromise: Promise<RxDatabase<Collections>> | null = null;

async function getDatabase(): Promise<RxDatabase<Collections>> {
  if (!dbPromise) {
    const key = getDataKey();
    if (!key) throw new Error("Data key not set");
    const password = btoa(String.fromCharCode(...key));
    const storage = wrappedKeyEncryptionCryptoJsStorage({
      storage: getRxStorageDexie(),
    });
    dbPromise = createRxDatabase<Collections>({
      name: "brain",
      storage,
      password,
    }).then(async (db) => {
      await db.addCollections({
        roadmap_tasks: { schema: roadmapTaskSchema },
        stats: { schema: statSchema },
        achievements: { schema: achievementSchema },
        journal: { schema: journalSchema },
        focus_sessions: { schema: focusSessionSchema },
        simple_tasks: { schema: taskSchema },
        goals: { schema: goalSchema },
      });
      return db;
    });
  }
  return dbPromise;
}

export { getDatabase as createDatabase };

export const db = {
  open: async () => {
    await getDatabase();
  },
  tasks: {
    async put(task: RoadmapTask) {
      const db = await getDatabase();
      await db.roadmap_tasks.upsert(task);
    },
    async get(id: string) {
      const db = await getDatabase();
      const doc = await db.roadmap_tasks.findOne(id).exec();
      return doc?.toJSON();
    },
    async toArray() {
      const db = await getDatabase();
      const docs = await db.roadmap_tasks.find().exec();
      return docs.map((d) => d.toJSON());
    },
  },
  stats: {
    async put(stat: Stat) {
      const db = await getDatabase();
      await db.stats.upsert(stat);
    },
    async get(id: string) {
      const db = await getDatabase();
      const doc = await db.stats.findOne(id).exec();
      return doc?.toJSON();
    },
    async toArray() {
      const db = await getDatabase();
      const docs = await db.stats.find().exec();
      return docs.map((d) => d.toJSON());
    },
  },
  achievements: {
    async add(ach: Achievement) {
      const db = await getDatabase();
      return db.achievements.insert(ach);
    },
    async toArray() {
      const db = await getDatabase();
      const docs = await db.achievements.find().exec();
      return docs.map((d) => d.toJSON());
    },
  },
};

// ---- Journal helpers ------------------------------------------------------

export async function addJournal(entry: JournalEntry) {
  const db = await getDatabase();
  return db.journal.insert(entry);
}

export async function getJournal(id: string) {
  const db = await getDatabase();
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
  const db = await getDatabase();
  // @ts-ignore - rxdb observable type
  return db.journal.find().$;
}

// ---- Focus session helpers -----------------------------------------------

export async function addFocusSession(entry: FocusSession) {
  const db = await getDatabase();
  return db.focus_sessions.insert(entry);
}

export async function updateFocusSession(
  id: string,
  data: Partial<FocusSession>,
) {
  const db = await getDatabase();
  const doc = await db.focus_sessions.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeFocusSession(id: string) {
  const db = await getDatabase();
  const doc = await db.focus_sessions.findOne(id).exec();
  return doc?.remove();
}

export async function focusSessions$(): Promise<Observable<FocusSession[]>> {
  const db = await getDatabase();
  // @ts-ignore
  return db.focus_sessions.find().$;
}

// ---- Simple task helpers --------------------------------------------------

export async function addTask(entry: TaskItem) {
  const db = await getDatabase();
  return db.simple_tasks.insert(entry);
}

export async function updateTask(id: string, data: Partial<TaskItem>) {
  const db = await getDatabase();
  const doc = await db.simple_tasks.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeTask(id: string) {
  const db = await getDatabase();
  const doc = await db.simple_tasks.findOne(id).exec();
  return doc?.remove();
}

export async function tasks$(): Promise<Observable<TaskItem[]>> {
  const db = await getDatabase();
  // @ts-ignore
  return db.simple_tasks.find().$;
}

// ---- Goal helpers ---------------------------------------------------------

export async function addGoal(entry: GoalItem) {
  const db = await getDatabase();
  return db.goals.insert(entry);
}

export async function updateGoal(id: string, data: Partial<GoalItem>) {
  const db = await getDatabase();
  const doc = await db.goals.findOne(id).exec();
  return doc?.update({ $set: data });
}

export async function removeGoal(id: string) {
  const db = await getDatabase();
  const doc = await db.goals.findOne(id).exec();
  return doc?.remove();
}

export async function goals$(): Promise<Observable<GoalItem[]>> {
  const db = await getDatabase();
  // @ts-ignore
  return db.goals.find().$;
}

