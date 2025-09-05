import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for menu categories and availability
export const menuCategoryEnum = pgEnum('menu_category', ['Appetizer', 'Main Course', 'Dessert', 'Drink']);
export const menuAvailabilityEnum = pgEnum('menu_availability', ['In Stock', 'Out of Stock']);

// Menu items table
export const menuItemsTable = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  category: menuCategoryEnum('category').notNull(),
  availability: menuAvailabilityEnum('availability').notNull().default('In Stock'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type MenuItem = typeof menuItemsTable.$inferSelect; // For SELECT operations
export type NewMenuItem = typeof menuItemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { menuItems: menuItemsTable };