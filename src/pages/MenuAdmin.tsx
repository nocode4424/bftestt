import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Edit, Plus, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';

interface Category {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  restaurant_id: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  category_id: string;
  image_url?: string;
  thumbnail_url?: string;
  is_active: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  user_id: string;
}

const MenuAdmin = () => {
  const { user, loading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // Force dark theme for menu admin
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenuData();
    }
  }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    try {
      console.log('Fetching restaurants for user:', user?.id, user?.email);
      
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, user_id')
        .eq('user_id', user?.id)
        .order('name');

      console.log('Restaurant query result:', { restaurantData, error: restaurantError });

      if (!restaurantData || restaurantData.length === 0) {
        console.log('No restaurants found for user:', user?.id);
        toast({
          title: "Access Denied",
          description: "You don't have admin access to any restaurant",
          variant: "destructive",
        });
        return;
      }

      setRestaurants(restaurantData);
      
      // Auto-select BlueFin Sushi if available, otherwise select the first restaurant
      const bluefinRestaurant = restaurantData.find(r => r.name.toLowerCase().includes('bluefin'));
      setSelectedRestaurant(bluefinRestaurant || restaurantData[0]);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    }
  };

  const fetchMenuData = async () => {
    if (!selectedRestaurant) return;

    try {
      console.log('Fetching menu data for restaurant:', selectedRestaurant.name);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', selectedRestaurant.id)
        .order('sort_order');

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', selectedRestaurant.id);

      setCategories(categoriesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File, imageType: 'image' | 'thumbnail' = 'image') => {
    if (!selectedProduct) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProduct.id}_${imageType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      // Update product with image URL
      const updateField = imageType === 'thumbnail' ? 'thumbnail_url' : 'image_url';
      const { error: updateError } = await supabase
        .from('products')
        .update({ [updateField]: data.publicUrl })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      setEditingProduct({ ...editingProduct, [updateField]: data.publicUrl });
      fetchMenuData(); // Refresh data

      toast({
        title: "Success",
        description: `${imageType === 'thumbnail' ? 'Thumbnail' : 'Image'} uploaded successfully!`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          base_price: editingProduct.base_price,
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      setDialogOpen(false);
      fetchMenuData();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = async () => {
    if (!selectedRestaurant) return;
    
    try {

      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name,
          description: newCategory.description,
          restaurant_id: selectedRestaurant.id,
          sort_order: categories.length,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully!",
      });

      setNewCategory({ name: '', description: '' });
      setCategoryDialogOpen(false);
      fetchMenuData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Failed",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Menu Administration</h1>
            {restaurants.length > 1 && (
              <div className="mt-4">
                <Label htmlFor="restaurant-select">Select Restaurant</Label>
                <Select
                  value={selectedRestaurant?.id || ''}
                  onValueChange={(value) => {
                    const restaurant = restaurants.find(r => r.id === value);
                    setSelectedRestaurant(restaurant || null);
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-x-2">
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>Create a new menu category</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description (Optional)</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Enter category description"
                    />
                  </div>
                  <Button onClick={handleAddCategory} disabled={!newCategory.name}>
                    Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products
                    .filter((product) => product.category_id === category.id)
                    .map((product) => (
                      <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
                          )}
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.description}
                          </p>
                          <p className="text-lg font-bold">${product.base_price}</p>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              setSelectedProduct(product);
                              setEditingProduct(product);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Modify product details and upload images</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={editingProduct.base_price || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Product Image</Label>
                {editingProduct.image_url && (
                  <img
                    src={editingProduct.image_url}
                    alt="Product"
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'image');
                  }}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
              <div>
                <Label>Thumbnail Image (Square display in menu)</Label>
                {editingProduct.thumbnail_url && (
                  <img
                    src={editingProduct.thumbnail_url}
                    alt="Thumbnail"
                    className="w-32 h-32 object-cover rounded-md mb-2"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'thumbnail');
                  }}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} disabled={uploading}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MenuAdmin;