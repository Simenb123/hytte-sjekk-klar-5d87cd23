import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../common/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const area = Deno.env.get('SKISPORET_AREA_ID');
    if (!area) {
      return new Response(
        JSON.stringify({ error: 'SKISPORET_AREA_ID not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://api.skisporet.no/track_status/${area}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'hytteapp' } });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Skisporet API error:', resp.status, text);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch track status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await resp.json();
    let updated = data.updated;
    if (typeof updated === 'number') {
      updated = new Date(updated).toISOString();
    }

    const result = { status: 'ok', updated, tracks: data.tracks };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300',
      },
    });
  } catch (error) {
    console.error('Error in skisporet-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
