import { Handler, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const reference = event.queryStringParameters?.reference;

    if (!reference) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing reference parameter' }),
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

    // Verify Paystack transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack verification failed:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.message || 'Failed to verify payment' }),
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
    console.error('Error verifying Paystack transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

export { handler };
