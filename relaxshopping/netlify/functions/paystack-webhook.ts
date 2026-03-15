import { Handler, HandlerEvent } from '@netlify/functions';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook service not configured' }),
      };
    }

    // Verify webhook signature
    const paystackSignature = event.headers['x-paystack-signature'];
    
    if (!paystackSignature) {
      console.error('Missing Paystack signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    // Compute expected signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(event.body || '')
      .digest('hex');

    if (hash !== paystackSignature) {
      console.error('Webhook signature mismatch');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Parse webhook payload
    const payload = JSON.parse(event.body || '{}');
    const { event: webhookEvent, data } = payload;

    console.log('Paystack webhook received:', webhookEvent, data);

    // Initialize Supabase client with service role for server-side operations
    const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      : null;

    // Handle different webhook events
    switch (webhookEvent) {
      case 'charge.success':
        // Payment successful - update order status in Supabase
        if (supabase && data.metadata?.orderId) {
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              payment_ref: data.reference,
              status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.metadata.orderId);
          
          if (error) {
            console.error('Error updating order:', error);
          } else {
            console.log('Order updated successfully:', data.metadata.orderId);
          }
        }
        console.log('Payment successful:', data);
        break;
      
      case 'charge.failed':
        // Payment failed - update order status
        if (supabase && data.metadata?.orderId) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.metadata.orderId);
        }
        console.log('Payment failed:', data);
        break;
      
      default:
        console.log('Unhandled webhook event:', webhookEvent);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Error processing Paystack webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

export { handler };
