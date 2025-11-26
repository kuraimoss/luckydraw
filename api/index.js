// Vercel Serverless Function for Lucky Draw Wheel
// Adapted from server.js for serverless deployment

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (pathname === '/api/participants' && req.method === 'GET') {
            // Default participants as simple array of numbers
            const participants = [1, 3, 7, 20, 50, 75, 100, 500];
            res.status(200).json(participants);

        } else if (pathname === '/api/spin' && req.method === 'POST') {
            const { participants } = req.body || {};

            if (!participants || participants.length < 2 || participants.length > 1000) {
                res.status(400).json({ error: 'Participants array must have 2-1000 elements' });
                return;
            }

            // Backend determines the winner - SINGLE SOURCE OF TRUTH
            const winnerIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIndex];

            // Calculate precise final angle for wheel animation
            const segmentAngle = 360 / participants.length;
            const winnerCenterOriginal = winnerIndex * segmentAngle + segmentAngle / 2;
            const targetRotation = 90 - winnerCenterOriginal; // Pointer is at 90° (bottom)
            const normalizedTarget = ((targetRotation % 360) + 360) % 360;
            const fullRotations = 8; // 8 full spins for dramatic effect
            const finalAngle = fullRotations * 360 + normalizedTarget;

            console.log(`🎯 Winner: ${winner} (index ${winnerIndex})`);

            res.status(200).json({
                winner,
                winnerIndex,
                finalAngle,
                segmentAngle,
                participants: participants // Return current participants for frontend
            });

        } else {
            res.status(404).json({ error: 'Not found' });
        }

    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};