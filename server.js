'use strict';

const Hapi = require('@hapi/hapi');
const Path = require('path');
const Inert = require('@hapi/inert');

const init = async () => {
    const server = Hapi.server({
        port: 3825,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    });

    // Register plugins
    await server.register(Inert);

    // Serve static files
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                index: true
            }
        }
    });

    // API route to get participants
    server.route({
        method: 'GET',
        path: '/api/participants',
        handler: (request, h) => {
            // Default participants as simple array of numbers
            const participants = [1, 3, 7, 20, 50, 75, 100, 500];
            return participants;
        }
    });

    // API route to spin and get winner
    server.route({
        method: 'POST',
        path: '/api/spin',
        handler: (request, h) => {
            const { participants } = request.payload || {};
            if (!participants || participants.length < 2 || participants.length > 1000) {
                return h.response({ error: 'Participants array must have 2-1000 elements' }).code(400);
            }

            // Backend determines the winner - SINGLE SOURCE OF TRUTH
            const winnerIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIndex];

            // Calculate precise final angle for wheel animation
            const segmentAngle = 360 / participants.length;
            const winnerCenterOriginal = winnerIndex * segmentAngle + segmentAngle / 2;
            const targetRotation = 90 - winnerCenterOriginal; // Pointer is at 90° (bottom, fa-caret-down)
            const normalizedTarget = ((targetRotation % 360) + 360) % 360;
            const fullRotations = 8; // 8 full spins for dramatic effect
            const finalAngle = fullRotations * 360 + normalizedTarget;

            console.log(`🎯 Winner: ${winner} (index ${winnerIndex})`);

            return {
                winner,
                winnerIndex,
                finalAngle,
                segmentAngle,
                participants: participants // Return current participants for frontend
            };
        }
    });

    await server.start();
    console.log('🎰 Lucky Draw Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();