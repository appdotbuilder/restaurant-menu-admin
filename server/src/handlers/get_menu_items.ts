import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type MenuItem } from '../schema';

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // Select all menu items from the database
    const results = await db.select()
      .from(menuItemsTable)
      .execute();

    // Convert numeric price fields back to numbers before returning
    return results.map(item => ({
      ...item,
      price: parseFloat(item.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}