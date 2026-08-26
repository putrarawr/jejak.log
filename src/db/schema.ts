import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  username: varchar("username", { length: 32 }).notNull(),
  displayName: varchar("display_name", { length: 80 }),
  bio: text("bio"),
  themePreference: varchar("theme_preference", { length: 16 })
    .notNull()
    .default("light"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
  uniqueIndex("users_username_idx").on(t.username),
]);

export const placeTypes = pgTable("place_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 64 }).notNull(),
}, (t) => [
  uniqueIndex("place_types_user_label_idx").on(t.userId, t.label),
]);

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 64 }).notNull().default("custom"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  notes: text("notes"),
  visitedAt: timestamp("visited_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index("places_user_idx").on(t.userId),
  index("places_public_idx").on(t.isPublic),
]);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 8 }).notNull(),
  storageUrl: text("storage_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [index("media_place_idx").on(t.placeId)]);

export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [uniqueIndex("likes_place_user_idx").on(t.placeId, t.userId)]);

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  placeId: uuid("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [index("comments_place_idx").on(t.placeId)]);

export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("follows_follower_following_idx").on(
    t.followerId,
    t.followingId
  ),
]);

export type User = typeof users.$inferSelect;
export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type MediaType = typeof media.$inferSelect;
export type Comment = typeof comments.$inferSelect;
