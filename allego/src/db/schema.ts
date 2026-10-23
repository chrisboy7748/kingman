import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["femme", "homme"]);
export const activityLevelEnum = pgEnum("activity_level", [
  "sedentaire",
  "leger",
  "modere",
  "actif",
]);
export const mealEnum = pgEnum("meal", [
  "petit_dejeuner",
  "dejeuner",
  "diner",
  "collation",
]);
export const planEnum = pgEnum("plan", ["mensuel", "annuel"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  healthConsentAt: timestamp("health_consent_at", { withTimezone: true }).notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sex: sexEnum("sex").notNull(),
  birthDate: date("birth_date").notNull(),
  heightCm: integer("height_cm").notNull(),
  startWeightKg: numeric("start_weight_kg", { precision: 5, scale: 1, mode: "number" }).notNull(),
  targetWeightKg: numeric("target_weight_kg", { precision: 5, scale: 1, mode: "number" }).notNull(),
  activityLevel: activityLevelEnum("activity_level").notNull(),
  weeklyGoalKg: numeric("weekly_goal_kg", { precision: 3, scale: 2, mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1, mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("weight_entries_user_date").on(t.userId, t.date)],
);

export const foodEntries = pgTable(
  "food_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    meal: mealEnum("meal").notNull(),
    name: text("name").notNull(),
    calories: integer("calories").notNull(),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("food_entries_user_date").on(t.userId, t.date)],
);

export const activityEntries = pgTable(
  "activity_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    type: text("type").notNull(),
    durationMin: integer("duration_min").notNull(),
    caloriesBurned: integer("calories_burned").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_entries_user_date").on(t.userId, t.date)],
);

/** Abonnement PayPal. Le statut reprend celui de PayPal (ACTIVE, CANCELLED, …). */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paypalSubscriptionId: text("paypal_subscription_id").notNull().unique(),
    plan: planEnum("plan").notNull(),
    status: text("status").notNull(),
    /** Fin de la période déjà payée : l'accès reste ouvert jusque-là après une résiliation. */
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subscriptions_user").on(t.userId)],
);

export const payments = pgTable("payments", {
  /** ID de la transaction PayPal (sale id). */
  id: text("id").primaryKey(),
  paypalSubscriptionId: text("paypal_subscription_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
  currency: text("currency").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
});

/** Événements webhook déjà traités, pour ne jamais traiter deux fois le même. */
export const paypalEvents = pgTable("paypal_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
