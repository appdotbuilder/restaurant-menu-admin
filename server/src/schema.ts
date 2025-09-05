import { z } from 'zod';

// Menu item category enum
export const menuCategorySchema = z.enum(['Appetizer', 'Main Course', 'Dessert', 'Drink']);
export type MenuCategory = z.infer<typeof menuCategorySchema>;

// Menu item availability enum
export const menuAvailabilitySchema = z.enum(['In Stock', 'Out of Stock']);
export type MenuAvailability = z.infer<typeof menuAvailabilitySchema>;

// Menu item schema
export const menuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // Can be null if no description provided
  price: z.number().positive(), // Price must be positive
  category: menuCategorySchema,
  availability: menuAvailabilitySchema,
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type MenuItem = z.infer<typeof menuItemSchema>;

// Input schema for creating menu items
export const createMenuItemInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(), // Explicit null allowed, undefined not allowed
  price: z.number().positive('Price must be positive'),
  category: menuCategorySchema,
  availability: menuAvailabilitySchema.default('In Stock') // Default to In Stock
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;

// Input schema for updating menu items
export const updateMenuItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(), // Can be null or undefined
  price: z.number().positive('Price must be positive').optional(),
  category: menuCategorySchema.optional(),
  availability: menuAvailabilitySchema.optional()
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;

// Input schema for deleting menu items
export const deleteMenuItemInputSchema = z.object({
  id: z.number()
});

export type DeleteMenuItemInput = z.infer<typeof deleteMenuItemInputSchema>;