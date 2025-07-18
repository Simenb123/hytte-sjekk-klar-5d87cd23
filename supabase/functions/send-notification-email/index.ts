import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  to: string;
  subject: string;
  title: string;
  message: string;
  type: 'booking_reminder' | 'weather_update' | 'seasonal_info' | 'general';
  relatedBookingId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Email notification function called');

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
    const { to, subject, title, message, type, relatedBookingId }: EmailNotificationRequest = await req.json();

    console.log('Sending email to:', to, 'Subject:', subject);

    // Create email template based on notification type
    const getEmailTemplate = (title: string, message: string, type: string) => {
      const baseStyles = `
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .title { color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .message { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .footer { text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
          .badge-booking { background-color: #dbeafe; color: #1d4ed8; }
          .badge-weather { background-color: #ecfdf5; color: #059669; }
          .badge-seasonal { background-color: #fef3c7; color: #d97706; }
          .badge-general { background-color: #f3f4f6; color: #4b5563; }
        </style>
      `;

      const badgeClass = {
        booking_reminder: 'badge-booking',
        weather_update: 'badge-weather',
        seasonal_info: 'badge-seasonal',
        general: 'badge-general'
      }[type] || 'badge-general';

      const typeLabel = {
        booking_reminder: 'Booking Påminnelse',
        weather_update: 'Værvarsel',
        seasonal_info: 'Sesong Info',
        general: 'Melding'
      }[type] || 'Melding';

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge ${badgeClass}">${typeLabel}</span>
              <h1 class="title">${title}</h1>
            </div>
            <div class="message">${message.replace(/\n/g, '<br>')}</div>
            <div class="footer">
              <p>Dette er en automatisk melding fra Hytte Sjekk.</p>
              <p>Du kan endre dine varselinnstillinger i appen.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    const emailHtml = getEmailTemplate(title, message, type);

    const emailResponse = await resend.emails.send({
      from: "Hytte Sjekk <notifications@resend.dev>",
      to: [to],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Email sent successfully" 
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
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
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