import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, ChefHat, Filter, DollarSign } from 'lucide-react';
// Using type-only imports for better TypeScript compliance
import type { MenuItem, CreateMenuItemInput, UpdateMenuItemInput, MenuCategory, MenuAvailability } from '../../server/src/schema';

function App() {
  // Explicit typing with MenuItem interface
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuCategory | 'all'>('all');

  // Form state for creating new items
  const [createFormData, setCreateFormData] = useState<CreateMenuItemInput>({
    name: '',
    description: null,
    price: 0,
    category: 'Main Course',
    availability: 'In Stock'
  });

  // Form state for editing existing items
  const [editFormData, setEditFormData] = useState<UpdateMenuItemInput>({
    id: 0,
    name: '',
    description: null,
    price: 0,
    category: 'Main Course',
    availability: 'In Stock'
  });

  // useCallback to memoize function used in useEffect
  const loadMenuItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMenuItems.query();
      setMenuItems(result);
      setFilteredItems(result);
    } catch (error) {
      console.error('Failed to load menu items:', error);
      // Since API returns empty array (stub), we'll show a helpful message
      setMenuItems([]);
      setFilteredItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter items based on category
  const filterByCategory = useCallback((category: MenuCategory | 'all') => {
    if (category === 'all') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter(item => item.category === category));
    }
    setActiveTab(category);
  }, [menuItems]);

  // useEffect with proper dependencies
  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Update filtered items when menuItems change or tab changes
  useEffect(() => {
    filterByCategory(activeTab);
  }, [menuItems, activeTab, filterByCategory]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createMenuItem.mutate(createFormData);
      // Update menu items list with explicit typing in setState callback
      setMenuItems((prev: MenuItem[]) => [...prev, response]);
      // Reset form
      setCreateFormData({
        name: '',
        description: null,
        price: 0,
        category: 'Main Course',
        availability: 'In Stock'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateMenuItem.mutate(editFormData);
      if (response) {
        // Update menu items list
        setMenuItems((prev: MenuItem[]) =>
          prev.map((item: MenuItem) => item.id === response.id ? response : item)
        );
        setIsEditDialogOpen(false);
        setEditingItem(null);
      } else {
        // Handle stub implementation - show message to user
        alert('Update feature is not yet implemented in the backend. This is a development placeholder.');
      }
    } catch (error) {
      console.error('Failed to update menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await trpc.deleteMenuItem.mutate({ id });
      if (response.success) {
        // Remove item from list
        setMenuItems((prev: MenuItem[]) =>
          prev.filter((item: MenuItem) => item.id !== id)
        );
      } else {
        // Handle stub implementation - show message to user
        alert('Delete feature is not yet implemented in the backend. This is a development placeholder.');
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      availability: item.availability
    });
    setIsEditDialogOpen(true);
  };

  const getAvailabilityBadgeVariant = (availability: MenuAvailability) => {
    return availability === 'In Stock' ? 'default' : 'destructive';
  };

  const getCategoryIcon = (category: MenuCategory) => {
    switch (category) {
      case 'Appetizer': return '🥗';
      case 'Main Course': return '🍽️';
      case 'Dessert': return '🍰';
      case 'Drink': return '🥤';
      default: return '🍴';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Restaurant Admin</h1>
                <p className="text-gray-600">Manage your menu items with ease</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Menu Item</DialogTitle>
                  <DialogDescription>
                    Create a new item for your restaurant menu.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="create-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="create-name"
                        value={createFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateMenuItemInput) => ({ ...prev, name: e.target.value }))
                        }
                        className="col-span-3"
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="create-description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="create-description"
                        value={createFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setCreateFormData((prev: CreateMenuItemInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        className="col-span-3"
                        placeholder="Describe your dish..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="create-price" className="text-right">
                        Price
                      </Label>
                      <div className="col-span-3 relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="create-price"
                          type="number"
                          value={createFormData.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCreateFormData((prev: CreateMenuItemInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                          }
                          className="pl-10"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="create-category" className="text-right">
                        Category
                      </Label>
                      <Select
                        value={createFormData.category}
                        onValueChange={(value: MenuCategory) =>
                          setCreateFormData((prev: CreateMenuItemInput) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Appetizer">🥗 Appetizer</SelectItem>
                          <SelectItem value="Main Course">🍽️ Main Course</SelectItem>
                          <SelectItem value="Dessert">🍰 Dessert</SelectItem>
                          <SelectItem value="Drink">🥤 Drink</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="create-availability" className="text-right">
                        Availability
                      </Label>
                      <Select
                        value={createFormData.availability}
                        onValueChange={(value: MenuAvailability) =>
                          setCreateFormData((prev: CreateMenuItemInput) => ({ ...prev, availability: value }))
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Stock">✅ In Stock</SelectItem>
                          <SelectItem value="Out of Stock">❌ Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                      {isLoading ? 'Creating...' : 'Create Item'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => filterByCategory(value as MenuCategory | 'all')} className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <TabsList className="grid w-full max-w-md grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Appetizer">🥗</TabsTrigger>
              <TabsTrigger value="Main Course">🍽️</TabsTrigger>
              <TabsTrigger value="Dessert">🍰</TabsTrigger>
              <TabsTrigger value="Drink">🥤</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading menu items...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items yet</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'all' 
                  ? 'Start building your menu by adding your first item!' 
                  : `No items in the ${activeTab} category yet.`}
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Menu Items Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item: MenuItem) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <Badge variant={getAvailabilityBadgeVariant(item.availability)}>
                      {item.availability}
                    </Badge>
                  </div>
                  {item.description && (
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {item.price.toFixed(2)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {item.created_at.toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="flex space-x-2 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
              <DialogDescription>
                Update the details of your menu item.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditFormData((prev: UpdateMenuItemInput) => ({ ...prev, name: e.target.value }))
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditFormData((prev: UpdateMenuItemInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right">
                    Price
                  </Label>
                  <div className="col-span-3 relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="edit-price"
                      type="number"
                      value={editFormData.price || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditFormData((prev: UpdateMenuItemInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      className="pl-10"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={editFormData.category ?? 'Main Course'}
                    onValueChange={(value: MenuCategory) =>
                      setEditFormData((prev: UpdateMenuItemInput) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appetizer">🥗 Appetizer</SelectItem>
                      <SelectItem value="Main Course">🍽️ Main Course</SelectItem>
                      <SelectItem value="Dessert">🍰 Dessert</SelectItem>
                      <SelectItem value="Drink">🥤 Drink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-availability" className="text-right">
                    Availability
                  </Label>
                  <Select
                    value={editFormData.availability ?? 'In Stock'}
                    onValueChange={(value: MenuAvailability) =>
                      setEditFormData((prev: UpdateMenuItemInput) => ({ ...prev, availability: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Stock">✅ In Stock</SelectItem>
                      <SelectItem value="Out of Stock">❌ Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                  {isLoading ? 'Updating...' : 'Update Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;