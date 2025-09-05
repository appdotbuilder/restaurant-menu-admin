import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type MenuItem } from '../schema';
import { eq } from 'drizzle-orm';

export async function getMenuItemById(id: number): Promise<MenuItem | null> {
  try {
    const results = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const menuItem = results[0];
    return {
      ...menuItem,
      price: parseFloat(menuItem.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Failed to get menu item by ID:', error);
    throw error;
  }
}