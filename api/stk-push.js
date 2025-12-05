export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // YOUR PAYHERO CREDENTIALS - ALREADY CONFIGURED
    const BASIC_AUTH = "Basic bGpuSDZqME1LRDRCa3FjUEFLN206ajVva2J6ZVFXdGppWkVYV2NpWWdERXZIbHBIMHRqd3pXb21BTm93ag==";
    const ACCOUNT_ID = "3844";

    const { phone, amount } = req.body;

    if (!phone || !amount) {
        return res.status(400).json({ error: 'Phone and amount required' });
    }

    // Normalize phone number to 254 format
    let normalizedPhone = phone.replace(/[\s\-\+]/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '254' + normalizedPhone.substring(1);
    }
    if (!normalizedPhone.startsWith('254')) {
        normalizedPhone = '254' + normalizedPhone;
    }

    // Validate phone number
    if (normalizedPhone.length !== 12) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        // Send STK Push to PayHero
        const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': BASIC_AUTH
            },
            body: JSON.stringify({
                amount: parseInt(amount),
                phone_number: normalizedPhone,
                channel_id: ACCOUNT_ID,
                provider: 'mpesa',
                external_reference: `NYOTA-LOAN-${Date.now()}`,
                callback_url: 'https://webhook.site/unique-url' // Optional: replace with your webhook
            })
        });

        const result = await response.json();

        console.log('PayHero Response:', result);

        if (response.ok && result.success !== false) {
            return res.status(200).json({ 
                success: true,
                message: 'STK Push sent successfully'
            });
        } else {
            return res.status(400).json({ 
                error: result.message || 'Payment initiation failed' 
            });
        }
    } catch (error) {
        console.error('PayHero API Error:', error);
        return res.status(500).json({ 
            error: 'Server error. Please try again.' 
        });
    }
}
