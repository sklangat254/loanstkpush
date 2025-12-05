export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // YOUR CREDENTIALS - VERIFIED CORRECT
    const API_USERNAME = "ljnH6j0MKD4BkqcPAK7m";
    const API_PASSWORD = "j5okbzeQWtjiZEXWciYgDEvHlpH0tjwzWomANowj";
    const CHANNEL_ID = "4519"; // Till 6253624

    const { phone, amount } = req.body;

    if (!phone || !amount) {
        return res.status(400).json({ 
            success: false, 
            error: 'Phone and amount required' 
        });
    }

    // Normalize phone
    let normalizedPhone = phone.replace(/[\s\-\+]/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '254' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('254')) {
        normalizedPhone = '254' + normalizedPhone;
    }

    if (normalizedPhone.length !== 12) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid phone number' 
        });
    }

    try {
        // Create Basic Auth token
        const token = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');

        console.log('Sending STK Push:', {
            phone: normalizedPhone,
            amount: amount,
            channel: CHANNEL_ID
        });

        // CORRECT PAYHERO API CALL FORMAT
        const paymentData = {
            amount: parseInt(amount),
            phone_number: normalizedPhone,
            channel_id: parseInt(CHANNEL_ID),
            provider: "mpesa",
            external_reference: `LOAN-${Date.now()}`,
            callback_url: `${process.env.VERCEL_URL || 'https://your-domain.vercel.app'}/api/callback`
        };

        const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        const responseText = await response.text();
        console.log('PayHero Response Status:', response.status);
        console.log('PayHero Response:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Parse error:', e);
            return res.status(500).json({ 
                success: false, 
                error: 'Invalid response from payment gateway',
                raw: responseText.substring(0, 200)
            });
        }

        // Check response
        if (response.ok || response.status === 200 || response.status === 201) {
            console.log('✅ STK Push Success');
            return res.status(200).json({ 
                success: true,
                message: 'STK Push sent',
                phone: normalizedPhone,
                amount: amount,
                reference: result.data?.id || result.id || 'pending'
            });
        } else {
            console.error('❌ PayHero Error:', result);
            return res.status(400).json({ 
                success: false,
                error: result.message || result.error || 'Payment failed',
                details: result
            });
        }

    } catch (error) {
        console.error('Critical Error:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Server error'
        });
    }
}
