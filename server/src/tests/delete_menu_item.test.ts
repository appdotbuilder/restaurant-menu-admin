import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type DeleteMenuItemInput, type CreateMenuItemInput } from '../schema';
import { deleteMenuItem } from '../handlers/delete_menu_item';
import { eq } from 'drizzle-orm';

// Test input for creating menu items
const testMenuItem: CreateMenuItemInput = {
  name: 'Test Burger',
  description: 'A delicious test burger',
  price: 12.99,
  category: 'Main Course',
  availability: 'In Stock'
};

// Helper function to create a menu item for testing
const createTestMenuItem = async (itemData = testMenuItem) => {
  const result = await db.insert(menuItemsTable)
    .values({
      name: itemData.name,
      description: itemData.description,
      price: itemData.price.toString(), // Convert number to string for numeric column
      category: itemData.category,
      availability: itemData.availability || 'In Stock'
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing menu item', async () => {
    // Create a menu item first
    const createdItem = await createTestMenuItem();
    
    const deleteInput: DeleteMenuItemInput = {
      id: createdItem.id
    };

    // Delete the menu item
    const result = await deleteMenuItem(deleteInput);

    // Verify the deletion was successful
    expect(result.success).toBe(true);

    // Verify the item no longer exists in the database
    const deletedItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, createdItem.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent menu item', async () => {
    const deleteInput: DeleteMenuItemInput = {
      id: 99999 // Non-existent ID
    };

    // Attempt to delete non-existent item
    const result = await deleteMenuItem(deleteInput);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should handle deletion of multiple different menu items', async () => {
    // Create multiple menu items
    const item1 = await createTestMenuItem({
      name: 'Pizza',
      description: 'Delicious pizza',
      price: 15.99,
      category: 'Main Course',
      availability: 'In Stock'
    });

    const item2 = await createTestMenuItem({
      name: 'Ice Cream',
      description: 'Cold treat',
      price: 5.99,
      category: 'Dessert',
      availability: 'In Stock'
    });

    // Delete first item
    const result1 = await deleteMenuItem({ id: item1.id });
    expect(result1.success).toBe(true);

    // Verify first item is deleted but second still exists
    const remainingItems = await db.select()
      .from(menuItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toBe(item2.id);
    expect(remainingItems[0].name).toBe('Ice Cream');

    // Delete second item
    const result2 = await deleteMenuItem({ id: item2.id });
    expect(result2.success).toBe(true);

    // Verify all items are deleted
    const allItems = await db.select()
      .from(menuItemsTable)
      .execute();

    expect(allItems).toHaveLength(0);
  });

  it('should delete menu item with null description', async () => {
    // Create menu item with null description
    const itemWithNullDescription = await createTestMenuItem({
      name: 'Simple Dish',
      description: null,
      price: 8.50,
      category: 'Appetizer',
      availability: 'Out of Stock'
    });

    const deleteInput: DeleteMenuItemInput = {
      id: itemWithNullDescription.id
    };

    // Delete the menu item
    const result = await deleteMenuItem(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify item no longer exists
    const deletedItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, itemWithNullDescription.id))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should handle edge case of negative ID', async () => {
    const deleteInput: DeleteMenuItemInput = {
      id: -1 // Negative ID
    };

    // Attempt to delete with negative ID
    const result = await deleteMenuItem(deleteInput);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should handle edge case of zero ID', async () => {
    const deleteInput: DeleteMenuItemInput = {
      id: 0 // Zero ID
    };

    // Attempt to delete with zero ID
    const result = await deleteMenuItem(deleteInput);

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });
});