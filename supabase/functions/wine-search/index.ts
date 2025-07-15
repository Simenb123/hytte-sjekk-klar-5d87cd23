import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VinmonopolProduct {
  code: string;
  name: string;
  url: string;
  price: {
    value: number;
    formattedValue: string;
  };
  images?: {
    url: string;
    format: string;
  }[];
  classification?: {
    productType?: string;
    productSubType?: string;
    color?: string;
    country?: string;
    district?: string;
    subDistrict?: string;
    vintage?: string;
    alcoholContent?: number;
    sugar?: string;
    acid?: string;
    volume?: {
      value: number;
      unit: string;
    };
    producer?: string;
    wholesaler?: string;
    distributor?: string;
    packageType?: string;
    method?: string;
    rawMaterial?: {
      code: string;
      name: string;
    }[];
  };
  description?: string;
  taste?: {
    fullness?: string;
    tannins?: string;
    bitterness?: string;
    sweetness?: string;
    colour?: string;
    odour?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, limit = 20 } = await req.json();

    if (!searchTerm || searchTerm.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Vinmonopolet for: ${searchTerm}`);

    // Search Vinmonopolet's API
    const searchUrl = `https://www.vinmonopolet.no/api/products/search`;
    const searchParams = new URLSearchParams({
      q: searchTerm.trim(),
      pageSize: limit.toString(),
      currentPage: '0'
    });

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WineCellarApp/1.0)',
        'Accept': 'application/json',
        'Accept-Language': 'no-NO,no;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Vinmonopolet API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to search Vinmonopolet', status: response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const products = data?.products || [];

    // Transform the data to our format
    const transformedProducts = products.map((product: VinmonopolProduct) => ({
      vinmonopol_id: product.code,
      name: product.name,
      vinmonopol_url: product.url,
      current_price: product.price?.value,
      image_url: product.images?.[0]?.url,
      description: product.description,
      producer: product.classification?.producer,
      country: product.classification?.country,
      region: product.classification?.district,
      vintage: product.classification?.vintage,
      alcohol_percentage: product.classification?.alcoholContent,
      wine_color: mapWineColor(product.classification?.color),
      grape_variety: product.classification?.rawMaterial?.map(rm => rm.name).join(', '),
      tasting_notes: formatTastingNotes(product.taste),
    }));

    console.log(`Found ${transformedProducts.length} products`);

    return new Response(
      JSON.stringify({ products: transformedProducts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in wine-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapWineColor(color?: string): string | undefined {
  if (!color) return undefined;
  
  const colorLower = color.toLowerCase();
  if (colorLower.includes('rød') || colorLower.includes('red')) return 'red';
  if (colorLower.includes('hvit') || colorLower.includes('white')) return 'white';
  if (colorLower.includes('rosé') || colorLower.includes('rose')) return 'rosé';
  if (colorLower.includes('musserende') || colorLower.includes('sparkling')) return 'sparkling';
  if (colorLower.includes('dessert')) return 'dessert';
  if (colorLower.includes('fortified')) return 'fortified';
  
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