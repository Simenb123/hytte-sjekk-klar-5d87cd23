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
    const { searchTerm, limit = 20 } = await req.json();
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🍷 Searching Vinmonopolet for:', searchTerm);

    // Check cache first
    const cacheKey = `search:${searchTerm.toLowerCase()}`;
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
    if (!apiKey) {
      console.error('❌ VINMONOPOLET_PRIMARY_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Vinmonopolet API
    const apiUrl = `https://apis.vinmonopolet.no/products/v0/details-normal?maxResults=${limit * 2}`;
    console.log('📡 Calling Vinmonopolet API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('❌ Vinmonopolet API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Vinmonopolet API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const products = data || [];
    
    console.log(`✅ Fetched ${products.length} products from API`);

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

    return new Response(
      JSON.stringify({ products: transformedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in wine-search:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
