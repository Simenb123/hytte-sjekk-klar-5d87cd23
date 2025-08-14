import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in Supabase secrets')
    }

    const { imageUrl, imageBase64 } = await req.json()
    
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Either imageUrl or imageBase64 is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a silhouette using OpenAI's image generation
    const prompt = `Create a clean black silhouette profile of the person in this image. The silhouette should be a solid black shape against a transparent background, showing the outline of the head and shoulders. Make it artistic and elegant, suitable for a logo. The silhouette should be crisp and clear with smooth edges.`

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        image: imageBase64 || imageUrl,
        background: 'transparent',
        output_format: 'png',
        quality: 'high',
        size: '1024x1024'
      }),
    })

    if (!response.ok) {
      // Try with image generation instead of editing
      const generationResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: 'A clean, elegant black silhouette of a woman with shoulder-length hair, showing head and shoulders profile. Solid black shape against transparent background, artistic and suitable for a logo. Smooth edges, crisp outline.',
          background: 'transparent',
          output_format: 'png',
          quality: 'high',
          size: '512x512',
          n: 1
        }),
      })

      if (!generationResponse.ok) {
        const errorText = await generationResponse.text()
        throw new Error(`OpenAI API error: ${generationResponse.status} - ${errorText}`)
      }

      const generationData = await generationResponse.json()
      
      return new Response(
        JSON.stringify({ 
          silhouette: generationData.data[0].b64_json,
          message: 'Generated artistic silhouette based on the general description'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        silhouette: data.data[0].b64_json,
        message: 'Silhouette created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating silhouette:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate silhouette', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})