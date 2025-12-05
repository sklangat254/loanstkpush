export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Log the callback from PayHero
    console.log('=== PAYMENT CALLBACK ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // Respond to PayHero
    return res.status(200).json({ 
        success: true,
        message: 'Callback received' 
    });
}
