import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeResult {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use Nominatim API for geocoding (free, no API key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&countrycodes=no&addressdetails=1&extratags=1`;
    
    console.log('Geocoding search for:', query);
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Hytta-App Geocoding Service'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: GeocodeResult[] = await response.json();
    
    // Transform the results to our format
    const results = data.map(item => ({
      name: item.display_name.split(',')[0].trim(), // Extract main place name
      display_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }))
    .filter(result => result.latitude && result.longitude) // Ensure valid coordinates
    .sort((a, b) => (b.importance || 0) - (a.importance || 0)); // Sort by importance

    console.log(`Found ${results.length} results for "${query}"`);

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in geocoding function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to geocode location', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});