import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kbgzetvmczooddjhzpqc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3pldHZtY3pvb2Rkamh6cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MTUxMzQsImV4cCI6MjA2NjQ5MTEzNH0.Xbs-OQY5VGsIiiXBOcI3ANXH0jCdAEXmee3Wmcy374w'
);

async function debugMenu() {
  try {
    // Test the same logic as the frontend
    const menuDomain = 'menu.bluefinwc.com';
    const domain = menuDomain.replace('menu.', ''); // Extract base domain
    console.log('Looking for restaurant with domain:', domain);
    
    // Fetch restaurant data
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('domain', domain)
      .single();

    if (restaurantError) {
      console.error('Restaurant error:', restaurantError);
      return;
    }
    console.log('Found restaurant:', restaurantData.name, 'ID:', restaurantData.id);

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantData.id)
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      console.error('Categories error:', categoriesError);
      return;
    }
    console.log('Categories found:', categoriesData.length);
    categoriesData.forEach(cat => {
      console.log('  -', cat.name, '(ID:', cat.id + ')');
    });

    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantData.id)
      .eq('is_active', true)
      .order('sort_order');

    if (productsError) {
      console.error('Products error:', productsError);
      return;
    }
    console.log('Products found:', productsData.length);

    // Group products by category
    const productsByCategory = {};
    productsData.forEach(product => {
      if (!productsByCategory[product.category_id]) {
        productsByCategory[product.category_id] = [];
      }
      productsByCategory[product.category_id].push(product);
    });

    // Show products per category
    categoriesData.forEach(category => {
      const categoryProducts = productsByCategory[category.id] || [];
      console.log(`\nCategory: ${category.name} (${category.id})`);
      console.log(`  Products: ${categoryProducts.length}`);
      categoryProducts.forEach(product => {
        console.log(`    - ${product.name} (menus: ${JSON.stringify(product.available_menus)})`);
      });
    });

  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugMenu();