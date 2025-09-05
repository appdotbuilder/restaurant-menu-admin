import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type DeleteMenuItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMenuItem = async (input: DeleteMenuItemInput): Promise<{ success: boolean }> => {
  try {
    // Delete the menu item by ID
    const result = await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Menu item deletion failed:', error);
    throw error;
  }
};