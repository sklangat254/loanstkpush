export default async function handler(req, res) {
    // Enable CORS - IMPORTANT
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }

    // YOUR CREDENTIALS
    const PAYHERO_CONFIG = {
        apiUsername: "ljnH6j0MKD4BkqcPAK7m",
        apiPassword: "j5okbzeQWtjiZEXWciYgDEvHlpH0tjwzWomANowj",
        basicAuth: "Basic bGpuSDZqME1LRDRCa3FjUEFLN206ajVva2J6ZVFXdGppWkVYV2NpWWdERXZIbHBIMHRqd3pXb21BTm93ag==",
        accountId: "3844",
        channelId: "4519", // Till 6253624
        tillNumber: "6253624"
    };

    // Get request data
    const { phone, amount } = req.body;

    // Validate input
    if (!phone || !amount) {
        console.error('Missing required fields:', { phone, amount });
        return res.status(400).json({ 
            success: false,
            error: 'Phone number and amount are required',
            received: { phone, amount }
        });
    }

    // Normalize phone number
    let normalizedPhone = String(phone).replace(/[\s\-\+]/g, '');
    
    // Remove leading zero
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '254' + normalizedPhone.substring(1);
    }
    
    // Add 254 if not present
    if (!normalizedPhone.startsWith('254')) {
        normalizedPhone = '254' + normalizedPhone;
    }

    // Validate Kenyan number
    if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('254')) {
        console.error('Invalid phone format:', normalizedPhone);
        return res.status(400).json({ 
            success: false,
            error: 'Invalid phone number format. Use 0712345678 or 254712345678',
            received: phone,
            normalized: normalizedPhone
        });
    }

    // Prepare payment data
    const paymentData = {
        amount: parseInt(amount),
        phone_number: normalizedPhone,
        channel_id: PAYHERO_CONFIG.channelId,
        provider: "mpesa",
        external_reference: `NYOTA-${Date.now()}`,
        callback_url: "https://webhook.site/unique-url"
    };

    console.log('=== PAYMENT REQUEST ===');
    console.log('Till Number:', PAYHERO_CONFIG.tillNumber);
    console.log('Channel ID:', PAYHERO_CONFIG.channelId);
    console.log('Phone:', normalizedPhone);
    console.log('Amount:', amount);
    console.log('Payment Data:', JSON.stringify(paymentData, null, 2));

    try {
        // Call PayHero API
        const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': PAYHERO_CONFIG.basicAuth,
                'Accept': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        // Get response text first
        const responseText = await response.text();
        console.log('=== PAYHERO RAW RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Response:', responseText);

        // Try to parse JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            return res.status(500).json({
                success: false,
                error: 'Invalid response from payment provider',
                details: responseText.substring(0, 200)
            });
        }

        console.log('=== PARSED RESPONSE ===');
        console.log(JSON.stringify(result, null, 2));

        // Check if successful
        if (response.ok) {
            console.log('✅ SUCCESS - STK Push sent!');
            return res.status(200).json({ 
                success: true,
                message: 'STK Push sent successfully',
                phone: normalizedPhone,
                amount: amount,
                reference: result.data?.id || result.data?.reference || 'N/A',
                tillNumber: PAYHERO_CONFIG.tillNumber
            });
        } else {
            console.error('❌ PAYHERO ERROR:', result);
            return res.status(400).json({ 
                success: false,
                error: result.message || result.error || 'Payment failed',
                details: result,
                tillNumber: PAYHERO_CONFIG.tillNumber
            });
        }

    } catch (error) {
        console.error('=== CRITICAL ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({ 
            success: false,
            error: 'Server error processing payment',
            message: error.message,
            tillNumber: PAYHERO_CONFIG.tillNumber
        });
    }
}
