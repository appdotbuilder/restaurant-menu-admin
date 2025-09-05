import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type CreateMenuItemInput } from '../schema';
import { getMenuItems } from '../handlers/get_menu_items';

// Test menu items data
const testMenuItems: CreateMenuItemInput[] = [
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with Caesar dressing',
    price: 12.99,
    category: 'Appetizer',
    availability: 'In Stock'
  },
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon herbs',
    price: 24.99,
    category: 'Main Course',
    availability: 'In Stock'
  },
  {
    name: 'Chocolate Cake',
    description: null, // Test null description
    price: 8.99,
    category: 'Dessert',
    availability: 'Out of Stock'
  },
  {
    name: 'Coffee',
    description: 'Freshly brewed coffee',
    price: 3.99,
    category: 'Drink',
    availability: 'In Stock'
  }
];

describe('getMenuItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no menu items exist', async () => {
    const result = await getMenuItems();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all menu items', async () => {
    // Create test menu items
    for (const item of testMenuItems) {
      await db.insert(menuItemsTable)
        .values({
          name: item.name,
          description: item.description,
          price: item.price.toString(), // Convert number to string for numeric column
          category: item.category,
          availability: item.availability
        })
        .execute();
    }

    const result = await getMenuItems();

    expect(result).toHaveLength(4);
    
    // Verify all items are returned with correct types
    result.forEach(item => {
      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.price).toBe('number'); // Should be converted back to number
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle items with null descriptions correctly', async () => {
    // Insert item with null description
    await db.insert(menuItemsTable)
      .values({
        name: 'Test Item',
        description: null,
        price: '10.00',
        category: 'Appetizer',
        availability: 'In Stock'
      })
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].name).toBe('Test Item');
  });

  it('should return items with different categories and availability', async () => {
    // Create items with all different categories and availability states
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Appetizer Item',
          description: 'Test appetizer',
          price: '5.99',
          category: 'Appetizer',
          availability: 'In Stock'
        },
        {
          name: 'Main Course Item',
          description: 'Test main course',
          price: '15.99',
          category: 'Main Course',
          availability: 'Out of Stock'
        },
        {
          name: 'Dessert Item',
          description: 'Test dessert',
          price: '7.99',
          category: 'Dessert',
          availability: 'In Stock'
        },
        {
          name: 'Drink Item',
          description: 'Test drink',
          price: '3.99',
          category: 'Drink',
          availability: 'Out of Stock'
        }
      ])
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(4);

    // Verify all categories are present
    const categories = result.map(item => item.category);
    expect(categories).toContain('Appetizer');
    expect(categories).toContain('Main Course');
    expect(categories).toContain('Dessert');
    expect(categories).toContain('Drink');

    // Verify both availability states are present
    const availabilities = result.map(item => item.availability);
    expect(availabilities).toContain('In Stock');
    expect(availabilities).toContain('Out of Stock');
  });

  it('should correctly convert price from string to number', async () => {
    // Insert item with specific price
    await db.insert(menuItemsTable)
      .values({
        name: 'Price Test Item',
        description: 'Testing price conversion',
        price: '19.99', // Stored as string in database
        category: 'Main Course',
        availability: 'In Stock'
      })
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(1);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toBe(19.99);
  });

  it('should preserve insertion order when items are created sequentially', async () => {
    // Create items in specific order
    const orderedItems = [
      { name: 'First Item', price: '10.00' },
      { name: 'Second Item', price: '20.00' },
      { name: 'Third Item', price: '30.00' }
    ];

    for (const item of orderedItems) {
      await db.insert(menuItemsTable)
        .values({
          name: item.name,
          description: 'Test item',
          price: item.price,
          category: 'Appetizer',
          availability: 'In Stock'
        })
        .execute();
    }

    const result = await getMenuItems();

    expect(result).toHaveLength(3);
    
    // Items should be returned (IDs should be sequential)
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
    
    expect(result[0].name).toBe('First Item');
    expect(result[1].name).toBe('Second Item');
    expect(result[2].name).toBe('Third Item');
  });
});