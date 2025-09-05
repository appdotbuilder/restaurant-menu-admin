import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMenuItemInput, type CreateMenuItemInput } from '../schema';
import { updateMenuItem } from '../handlers/update_menu_item';

// Helper function to create a test menu item
const createTestMenuItem = async (): Promise<number> => {
  const testItem: CreateMenuItemInput = {
    name: 'Original Item',
    description: 'Original description',
    price: 15.99,
    category: 'Main Course',
    availability: 'In Stock'
  };

  const result = await db.insert(menuItemsTable)
    .values({
      name: testItem.name,
      description: testItem.description,
      price: testItem.price.toString(),
      category: testItem.category,
      availability: testItem.availability
    })
    .returning({ id: menuItemsTable.id })
    .execute();

  return result[0].id;
};

describe('updateMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a menu item with all fields', async () => {
    const itemId = await createTestMenuItem();

    const updateInput: UpdateMenuItemInput = {
      id: itemId,
      name: 'Updated Item',
      description: 'Updated description',
      price: 19.99,
      category: 'Dessert',
      availability: 'Out of Stock'
    };

    const result = await updateMenuItem(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(itemId);
    expect(result!.name).toEqual('Updated Item');
    expect(result!.description).toEqual('Updated description');
    expect(result!.price).toEqual(19.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.category).toEqual('Dessert');
    expect(result!.availability).toEqual('Out of Stock');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const itemId = await createTestMenuItem();

    const updateInput: UpdateMenuItemInput = {
      id: itemId,
      name: 'Partially Updated',
      price: 25.50
    };

    const result = await updateMenuItem(updateInput);

    // Verify updated fields
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partially Updated');
    expect(result!.price).toEqual(25.50);
    expect(typeof result!.price).toEqual('number');

    // Verify unchanged fields
    expect(result!.description).toEqual('Original description');
    expect(result!.category).toEqual('Main Course');
    expect(result!.availability).toEqual('In Stock');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update description to null', async () => {
    const itemId = await createTestMenuItem();

    const updateInput: UpdateMenuItemInput = {
      id: itemId,
      description: null
    };

    const result = await updateMenuItem(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toEqual('Original Item'); // Should remain unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const itemId = await createTestMenuItem();
    
    // Get original timestamp
    const originalItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, itemId))
      .execute();
    
    const originalUpdatedAt = originalItem[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMenuItemInput = {
      id: itemId,
      name: 'Name Change'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save updated item to database', async () => {
    const itemId = await createTestMenuItem();

    const updateInput: UpdateMenuItemInput = {
      id: itemId,
      name: 'Database Test',
      price: 12.34,
      category: 'Appetizer'
    };

    await updateMenuItem(updateInput);

    // Verify in database
    const savedItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, itemId))
      .execute();

    expect(savedItem).toHaveLength(1);
    expect(savedItem[0].name).toEqual('Database Test');
    expect(parseFloat(savedItem[0].price)).toEqual(12.34);
    expect(savedItem[0].category).toEqual('Appetizer');
  });

  it('should return null for non-existent menu item', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: 99999, // Non-existent ID
      name: 'Should Not Work'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeNull();
  });

  it('should handle updates with only timestamp change', async () => {
    const itemId = await createTestMenuItem();

    // Update with empty changes (only timestamp should change)
    const updateInput: UpdateMenuItemInput = {
      id: itemId
    };

    const result = await updateMenuItem(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Item'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle category enum values correctly', async () => {
    const itemId = await createTestMenuItem();

    // Test each category enum value
    const categories = ['Appetizer', 'Main Course', 'Dessert', 'Drink'] as const;

    for (const category of categories) {
      const updateInput: UpdateMenuItemInput = {
        id: itemId,
        category: category
      };

      const result = await updateMenuItem(updateInput);

      expect(result).not.toBeNull();
      expect(result!.category).toEqual(category);
    }
  });

  it('should handle availability enum values correctly', async () => {
    const itemId = await createTestMenuItem();

    // Test each availability enum value
    const availabilities = ['In Stock', 'Out of Stock'] as const;

    for (const availability of availabilities) {
      const updateInput: UpdateMenuItemInput = {
        id: itemId,
        availability: availability
      };

      const result = await updateMenuItem(updateInput);

      expect(result).not.toBeNull();
      expect(result!.availability).toEqual(availability);
    }
  });
});