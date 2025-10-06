import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VinmonopolProduct {
  vinmonopol_id: string;
  name: string;
  vinmonopol_url?: string;
  current_price?: number;
  image_url?: string;
  description?: string;
  producer?: string;
  country?: string;
  region?: string;
  vintage?: string;
  alcohol_percentage?: number;
  wine_color?: string;
  grape_variety?: string;
  tasting_notes?: string;
}

interface CachedData {
  products: any[];
  timestamp: number;
}

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, CachedData>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Received request:', req.method);
    
    // Handle both POST and GET requests
    let searchTerm: string;
    let limit = 20;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('📦 POST body:', JSON.stringify(body));
        searchTerm = body.searchTerm;
        limit = body.limit || 20;
      } catch (e) {
        console.error('❌ Failed to parse JSON body:', e);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      const url = new URL(req.url);
      searchTerm = url.searchParams.get('searchTerm') || '';
      limit = parseInt(url.searchParams.get('limit') || '20');
    }
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      console.log('⚠️ No search term provided');
      return new Response(
        JSON.stringify({ error: 'Search term is required', searchTerm, received: searchTerm }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🍷 Searching Vinmonopolet for:', searchTerm, 'with limit:', limit);

    // Fetch many more products to improve search results
    const maxResults = Math.min(limit * 100, 2000);
    
    // Check cache first (v2 cache key to invalidate old cache)
    const cacheKey = `search:v2:${searchTerm.toLowerCase()}:${maxResults}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      console.log('✅ Returning cached data (age:', Math.floor((now - cached.timestamp) / 1000 / 60), 'minutes)');
      const transformedProducts = transformProducts(cached.products, limit, searchTerm);
      return new Response(
        JSON.stringify({ products: transformedProducts, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('VINMONOPOLET_PRIMARY_KEY');
    console.log('🔑 API Key check:', apiKey ? '✅ Found' : '❌ Missing');
    
    if (!apiKey) {
      console.error('❌ VINMONOPOLET_PRIMARY_KEY not configured in Supabase secrets');
      console.error('💡 Run: supabase secrets set VINMONOPOLET_PRIMARY_KEY=your_key_here');
      return new Response(
        JSON.stringify({ 
          error: 'Vinmonopolet API key not configured',
          hint: 'Please configure VINMONOPOLET_PRIMARY_KEY in Supabase secrets'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Vinmonopolet API with increased maxResults
    const apiUrl = `https://apis.vinmonopolet.no/products/v0/details-normal?maxResults=${maxResults}`;
    console.log('📡 Calling Vinmonopolet API:', apiUrl, 'to fetch up to', maxResults, 'products');
    console.log('🔑 Using API key starting with:', apiKey.substring(0, 8) + '...');

    const response = await fetch(apiUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Cache-Control': 'no-cache',
      },
    });

    console.log('📊 API Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Vinmonopolet API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `Vinmonopolet API error: ${response.status}`,
          details: errorText,
          searchTerm
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    const products = data || [];
    
    console.log(`✅ Fetched ${products.length} products from API`);
    console.log('📦 Sample product:', products[0] ? JSON.stringify(products[0]).substring(0, 200) : 'No products');

    // Cache the raw results
    cache.set(cacheKey, {
      products,
      timestamp: now
    });

    // Filter by search term
    const filteredProducts = products.filter((product: any) => {
      const searchLower = searchTerm.toLowerCase();
      const name = (product.productShortName || product.name || '').toLowerCase();
      const producer = (product.mainProducerName || product.producer || '').toLowerCase();
      const country = (product.mainCountry?.name || product.country || '').toLowerCase();
      
      return name.includes(searchLower) || 
             producer.includes(searchLower) || 
             country.includes(searchLower);
    });

    const transformedProducts = transformProducts(filteredProducts, limit, searchTerm);

    console.log(`✅ Returning ${transformedProducts.length} filtered products`);
    if (transformedProducts.length > 0) {
      console.log('🍾 Sample result:', JSON.stringify(transformedProducts[0]).substring(0, 200));
    }

    return new Response(
      JSON.stringify({ 
        products: transformedProducts,
        total: transformedProducts.length,
        searchTerm,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in wine-search:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack,
        type: error.constructor.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Transform products to our format
function transformProducts(products: any[], limit: number, searchTerm: string): VinmonopolProduct[] {
  return products.slice(0, limit).map((product: any, index: number) => ({
    vinmonopol_id: product.code || product.productId || `${Date.now()}-${index}`,
    name: product.productShortName || product.name || searchTerm,
    vinmonopol_url: product.url || `https://www.vinmonopolet.no/`,
    current_price: parseFloat(product.price?.value || product.pricePerLitre?.value || '0') || undefined,
    image_url: product.images?.[0]?.url || undefined,
    description: product.productLongName || product.description || undefined,
    producer: product.mainProducerName || product.producer || undefined,
    country: product.mainCountry?.name || product.country || undefined,
    region: product.district?.name || product.region || undefined,
    vintage: product.vintage || undefined,
    alcohol_percentage: parseFloat(product.alcohol?.value || product.alcoholContent || '0') || undefined,
    wine_color: mapWineColor(product.mainCategory?.name || product.color),
    grape_variety: product.grapes?.map((g: any) => g.name).join(', ') || undefined,
    tasting_notes: formatTastingNotes(product.taste) || undefined,
  }));
}

function mapWineColor(color?: string): string | undefined {
  if (!color) return undefined;
  
  const colorLower = color.toLowerCase();
  if (colorLower.includes('rød') || colorLower.includes('red') || colorLower.includes('rødvin')) return 'red';
  if (colorLower.includes('hvit') || colorLower.includes('white') || colorLower.includes('hvitvin')) return 'white';
  if (colorLower.includes('rosé') || colorLower.includes('rose')) return 'rosé';
  if (colorLower.includes('musserende') || colorLower.includes('sparkling') || colorLower.includes('champagne')) return 'sparkling';
  if (colorLower.includes('dessert') || colorLower.includes('søt')) return 'dessert';
  if (colorLower.includes('fortified') || colorLower.includes('sherry') || colorLower.includes('port')) return 'fortified';
  
  return undefined;
}

function formatTastingNotes(taste?: any): string | undefined {
  if (!taste) return undefined;
  
  const notes = [];
  if (taste.fullness) notes.push(`Fylde: ${taste.fullness}`);
  if (taste.tannins) notes.push(`Tanniner: ${taste.tannins}`);
  if (taste.bitterness) notes.push(`Bitterhet: ${taste.bitterness}`);
  if (taste.sweetness) notes.push(`Sødme: ${taste.sweetness}`);
  if (taste.colour) notes.push(`Farge: ${taste.colour}`);
  if (taste.odour) notes.push(`Duft: ${taste.odour}`);
  
  return notes.length > 0 ? notes.join(', ') : undefined;
}
