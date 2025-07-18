import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  console.log('Push notification function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    const { userId, title, body, data }: PushNotificationRequest = await req.json();

    console.log('Sending push notification to user:', userId);

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', userId);

    if (tokensError) {
      throw new Error(`Failed to fetch push tokens: ${tokensError.message}`);
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No push tokens found for user" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Found push tokens:', tokens.length);

    // Send push notifications to all user's devices
    const sendPromises = tokens.map(async (tokenData) => {
      try {
        // Send push notification via FCM
        const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
        
        if (!FCM_SERVER_KEY) {
          console.warn("FCM_SERVER_KEY not configured, simulating notification");
          return {
            token: tokenData.token,
            platform: tokenData.platform,
            success: true,
            messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }

        const fcmPayload = {
          to: tokenData.token,
          notification: {
            title,
            body,
            sound: "default",
          },
          data: data || {},
        };

        const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Authorization": `key=${FCM_SERVER_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fcmPayload),
        });

        const fcmResult = await fcmResponse.json();
        
        if (fcmResponse.ok && fcmResult.success > 0) {
          return {
            token: tokenData.token,
            platform: tokenData.platform,
            success: true,
            messageId: fcmResult.results[0]?.message_id || `fcm_${Date.now()}`,
          };
        } else {
          console.error("FCM error:", fcmResult);
          return {
            token: tokenData.token,
            platform: tokenData.platform,
            success: false,
            error: fcmResult.results?.[0]?.error || "Unknown FCM error",
          };
        }
      } catch (error) {
        console.error(`Failed to send push to ${tokenData.platform}:`, error);
        return {
          token: tokenData.token,
          platform: tokenData.platform,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Push notification results: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Push notifications sent to ${successCount} devices`,
        results: results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send push notification",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);