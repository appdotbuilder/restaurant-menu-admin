import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { getMenuItemById } from '../handlers/get_menu_item_by_id';
import { eq } from 'drizzle-orm';

describe('getMenuItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a menu item when found', async () => {
    // Create test menu item
    const testMenuItem = await db.insert(menuItemsTable)
      .values({
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon grilled to perfection',
        price: '24.99',
        category: 'Main Course',
        availability: 'In Stock'
      })
      .returning()
      .execute();

    const menuItemId = testMenuItem[0].id;

    // Test the handler
    const result = await getMenuItemById(menuItemId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(menuItemId);
    expect(result!.name).toEqual('Grilled Salmon');
    expect(result!.description).toEqual('Fresh Atlantic salmon grilled to perfection');
    expect(result!.price).toEqual(24.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.category).toEqual('Main Course');
    expect(result!.availability).toEqual('In Stock');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when menu item is not found', async () => {
    // Test with non-existent ID
    const result = await getMenuItemById(999);

    expect(result).toBeNull();
  });

  it('should handle menu item with null description', async () => {
    // Create test menu item with null description
    const testMenuItem = await db.insert(menuItemsTable)
      .values({
        name: 'House Special',
        description: null, // Explicitly null description
        price: '15.50',
        category: 'Appetizer',
        availability: 'Out of Stock'
      })
      .returning()
      .execute();

    const menuItemId = testMenuItem[0].id;

    // Test the handler
    const result = await getMenuItemById(menuItemId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(menuItemId);
    expect(result!.name).toEqual('House Special');
    expect(result!.description).toBeNull();
    expect(result!.price).toEqual(15.50);
    expect(typeof result!.price).toEqual('number');
    expect(result!.category).toEqual('Appetizer');
    expect(result!.availability).toEqual('Out of Stock');
  });

  it('should verify database state after retrieval', async () => {
    // Create test menu item
    const testMenuItem = await db.insert(menuItemsTable)
      .values({
        name: 'Chocolate Cake',
        description: 'Rich chocolate dessert',
        price: '8.99',
        category: 'Dessert',
        availability: 'In Stock'
      })
      .returning()
      .execute();

    const menuItemId = testMenuItem[0].id;

    // Get item through handler
    const handlerResult = await getMenuItemById(menuItemId);

    // Verify same item exists in database
    const dbResult = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(handlerResult).not.toBeNull();
    expect(handlerResult!.id).toEqual(dbResult[0].id);
    expect(handlerResult!.name).toEqual(dbResult[0].name);
    expect(handlerResult!.price).toEqual(parseFloat(dbResult[0].price));
  });

  it('should handle different menu categories and availability states', async () => {
    // Create multiple menu items with different categories and availability
    const menuItems = [
      {
        name: 'Caesar Salad',
        description: 'Classic Caesar with croutons',
        price: '12.99',
        category: 'Appetizer' as const,
        availability: 'In Stock' as const
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee',
        price: '3.50',
        category: 'Drink' as const,
        availability: 'Out of Stock' as const
      }
    ];

    const insertedItems = await db.insert(menuItemsTable)
      .values(menuItems)
      .returning()
      .execute();

    // Test each item
    for (const insertedItem of insertedItems) {
      const result = await getMenuItemById(insertedItem.id);
      
      expect(result).not.toBeNull();
      expect(result!.id).toEqual(insertedItem.id);
      expect(['Appetizer', 'Drink']).toContain(result!.category);
      expect(['In Stock', 'Out of Stock']).toContain(result!.availability);
      expect(typeof result!.price).toEqual('number');
      expect(result!.price).toBeGreaterThan(0);
    }
  });
});