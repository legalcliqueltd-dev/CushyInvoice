import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Invoice Management API",
    version: "1.0.0",
    description: "API endpoints for invoice management, PDF generation, email delivery, and payment processing",
  },
  servers: [
    {
      url: `${Deno.env.get('SUPABASE_URL')}/functions/v1`,
      description: "Production server",
    },
  ],
  paths: {
    "/invoice-pdf": {
      post: {
        summary: "Generate Invoice PDF",
        description: "Generates a PDF document for an invoice",
        tags: ["Invoice"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["invoiceId"],
                properties: {
                  invoiceId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the invoice to generate PDF for",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    pdfUrl: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid request" },
          "500": { description: "Server error" },
        },
      },
    },
    "/send-invoice": {
      post: {
        summary: "Send Invoice Email",
        description: "Sends an invoice via email with PDF attachment",
        tags: ["Invoice", "Email"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["invoiceId"],
                properties: {
                  invoiceId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the invoice to send",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    messageId: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid request" },
          "500": { description: "Server error" },
        },
      },
    },
    "/stripe-checkout": {
      post: {
        summary: "Create Stripe Checkout Session",
        description: "Creates a Stripe Checkout session for invoice payment",
        tags: ["Payment", "Stripe"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["invoiceId"],
                properties: {
                  invoiceId: {
                    type: "string",
                    format: "uuid",
                    description: "ID of the invoice to pay",
                  },
                  successUrl: {
                    type: "string",
                    description: "URL to redirect after successful payment",
                  },
                  cancelUrl: {
                    type: "string",
                    description: "URL to redirect after cancelled payment",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Checkout session created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid request" },
          "500": { description: "Server error" },
        },
      },
    },
    "/stripe-webhook": {
      post: {
        summary: "Stripe Webhook Handler",
        description: "Handles Stripe webhook events for payment confirmation",
        tags: ["Payment", "Stripe", "Webhook"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Stripe webhook event payload",
              },
            },
          },
        },
        responses: {
          "200": { description: "Webhook processed successfully" },
          "400": { description: "Invalid webhook signature" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "apikey",
        description: "Supabase API key",
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    { name: "Invoice", description: "Invoice management operations" },
    { name: "Email", description: "Email delivery operations" },
    { name: "Payment", description: "Payment processing operations" },
    { name: "Stripe", description: "Stripe payment integration" },
    { name: "Webhook", description: "Webhook handlers" },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Serve OpenAPI spec as JSON
    if (url.pathname.includes('/spec')) {
      return new Response(JSON.stringify(openApiSpec, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Serve Swagger UI
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error serving API docs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
