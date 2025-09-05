import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type CreateMenuItemInput } from '../schema';
import { createMenuItem } from '../handlers/create_menu_item';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateMenuItemInput = {
  name: 'Test Burger',
  description: 'A delicious test burger with all the fixings',
  price: 15.99,
  category: 'Main Course',
  availability: 'In Stock'
};

// Test input with minimal fields (testing defaults)
const minimalInput: CreateMenuItemInput = {
  name: 'Simple Appetizer',
  description: null,
  price: 8.50,
  category: 'Appetizer',
  // availability will default to 'In Stock'
  availability: 'In Stock'
};

describe('createMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu item with all fields', async () => {
    const result = await createMenuItem(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Burger');
    expect(result.description).toEqual('A delicious test burger with all the fixings');
    expect(result.price).toEqual(15.99);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.category).toEqual('Main Course');
    expect(result.availability).toEqual('In Stock');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a menu item with null description', async () => {
    const result = await createMenuItem(minimalInput);

    expect(result.name).toEqual('Simple Appetizer');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(8.50);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.category).toEqual('Appetizer');
    expect(result.availability).toEqual('In Stock');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save menu item to database correctly', async () => {
    const result = await createMenuItem(testInput);

    // Query using proper drizzle syntax
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(menuItems).toHaveLength(1);
    const savedItem = menuItems[0];
    
    expect(savedItem.name).toEqual('Test Burger');
    expect(savedItem.description).toEqual('A delicious test burger with all the fixings');
    expect(parseFloat(savedItem.price)).toEqual(15.99); // Price stored as string in DB
    expect(savedItem.category).toEqual('Main Course');
    expect(savedItem.availability).toEqual('In Stock');
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different menu categories correctly', async () => {
    const appetizer = await createMenuItem({
      name: 'Wings',
      description: 'Spicy chicken wings',
      price: 12.99,
      category: 'Appetizer',
      availability: 'In Stock'
    });

    const dessert = await createMenuItem({
      name: 'Ice Cream',
      description: null,
      price: 6.50,
      category: 'Dessert',
      availability: 'Out of Stock'
    });

    expect(appetizer.category).toEqual('Appetizer');
    expect(dessert.category).toEqual('Dessert');
    expect(dessert.availability).toEqual('Out of Stock');
  });

  it('should handle different availability statuses correctly', async () => {
    const inStockItem = await createMenuItem({
      name: 'Pizza',
      description: 'Cheese pizza',
      price: 18.99,
      category: 'Main Course',
      availability: 'In Stock'
    });

    const outOfStockItem = await createMenuItem({
      name: 'Special Soup',
      description: 'Today\'s special soup',
      price: 9.99,
      category: 'Appetizer',
      availability: 'Out of Stock'
    });

    expect(inStockItem.availability).toEqual('In Stock');
    expect(outOfStockItem.availability).toEqual('Out of Stock');
  });

  it('should handle decimal prices correctly', async () => {
    const itemWithDecimal = await createMenuItem({
      name: 'Coffee',
      description: 'Fresh brewed coffee',
      price: 3.25,
      category: 'Drink',
      availability: 'In Stock'
    });

    expect(itemWithDecimal.price).toEqual(3.25);
    expect(typeof itemWithDecimal.price).toBe('number');

    // Verify it's stored correctly in database
    const savedItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, itemWithDecimal.id))
      .execute();

    expect(parseFloat(savedItems[0].price)).toEqual(3.25);
  });

  it('should create multiple menu items successfully', async () => {
    const item1 = await createMenuItem({
      name: 'Burger',
      description: 'Beef burger',
      price: 14.99,
      category: 'Main Course',
      availability: 'In Stock'
    });

    const item2 = await createMenuItem({
      name: 'Fries',
      description: null,
      price: 5.99,
      category: 'Appetizer',
      availability: 'In Stock'
    });

    // Verify both items have different IDs
    expect(item1.id).not.toEqual(item2.id);
    expect(item1.name).toEqual('Burger');
    expect(item2.name).toEqual('Fries');

    // Verify both are in database
    const allItems = await db.select().from(menuItemsTable).execute();
    expect(allItems).toHaveLength(2);
  });
});