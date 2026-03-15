import { Handler, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, amount, orderId, metadata } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!email || !amount || !orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email, amount, orderId' }),
      };
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Payment service not configured' }),
      };
    }

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference: `RS-${orderId}-${Date.now()}`,
        metadata: {
          orderId,
          ...metadata,
        },
        callback_url: `${process.env.URL || 'http://localhost:8080'}/order-success`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack initialization failed:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.message || 'Failed to initialize payment' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    console.error('Error initializing Paystack transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

export { handler };
