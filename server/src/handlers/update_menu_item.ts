import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMenuItemInput, type MenuItem } from '../schema';

export async function updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItem | null> {
  try {
    // First check if the menu item exists
    const existingItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      return null;
    }

    // Prepare update values - only include fields that were provided
    const updateValues: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateValues.name = input.name;
    }

    if (input.description !== undefined) {
      updateValues.description = input.description;
    }

    if (input.price !== undefined) {
      updateValues.price = input.price.toString(); // Convert number to string for numeric column
    }

    if (input.category !== undefined) {
      updateValues.category = input.category;
    }

    if (input.availability !== undefined) {
      updateValues.availability = input.availability;
    }

    // Update the menu item
    const result = await db.update(menuItemsTable)
      .set(updateValues)
      .where(eq(menuItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const updatedItem = result[0];
    return {
      ...updatedItem,
      price: parseFloat(updatedItem.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Menu item update failed:', error);
    throw error;
  }
}