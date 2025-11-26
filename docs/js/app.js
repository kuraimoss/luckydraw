// Lucky Draw Application
class LuckyDraw {
    constructor() {
        // Initialize DOM elements with null checks
        this.canvas = this.getElement('wheelCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.spinBtn = this.getElement('spinBtn');
        this.participantsList = this.getElement('participantsList');
        this.participantCount = this.getElement('participantCount');
        this.bulkInput = this.getElement('bulkInput');
        this.bulkAddBtn = this.getElement('bulkAddBtn');
        this.singleInput = this.getElement('singleInput');
        this.singleAddBtn = this.getElement('singleAddBtn');
        this.clearAllBtn = this.getElement('clearAllBtn');
        this.winnerModal = this.getElement('winnerModal');
        this.winnerName = this.getElement('winnerName');
        this.closeModalBtn = this.getElement('closeModalBtn');


        // Performance optimization: cached wheel canvas
        this.wheelCacheCanvas = document.createElement('canvas');
        this.wheelCacheCtx = this.wheelCacheCanvas.getContext('2d');
        this.wheelNeedsRedraw = true; // Flag to track if wheel needs to be redrawn

        this.participants = [];
        this.isSpinning = false;
        this.currentRotation = 0;
        this.animationId = null; // Track animation frame for cleanup
        this.spinDuration = 6000; // Default 6 seconds

        this.colors = [
            '#DC2626', '#EF4444', '#B91C1C', '#991B1B', '#7F1D1D', // Reds
            '#16A34A', '#22C55E', '#15803D', '#166534', '#14532D', // Greens
            '#F59E0B', '#FBBF24', '#D97706', '#B45309', '#92400E', // Golds/Oranges
            '#2563EB', '#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A', // Blues
            '#8B5CF6', '#A78BFA', '#7C3AED', '#6D28D9', '#5B21B6', // Purples
            '#EC4899', '#F472B6', '#DB2777', '#BE185D', '#9D174D', // Pinks
            '#06B6D4', '#22D3EE', '#0891B2', '#0E7490', '#0C4A6E', // Cyans
            '#84CC16', '#A3E635', '#65A30D', '#4D7C0F', '#3F6212', // Limes
            '#F97316', '#FB923C', '#EA580C', '#C2410C', '#9A3412', // Oranges
            '#6366F1', '#818CF8', '#4F46E5', '#4338CA', '#3730A3'  // Indigos
        ];

        this.init();
    }

    // Helper method for safe DOM element access
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    }
    
    init() {
        this.loadParticipants();
        this.bindEvents();
        this.drawWheel();
        this.updateParticipantCount();
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(e => console.log('Audio context resume failed:', e));
            }
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioContext = null;
        }
    }
    
    bindEvents() {
        // Initialize audio on first user interaction
        const initAudioOnInteraction = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(e => console.log('Audio resume failed:', e));
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('touchstart', initAudioOnInteraction);
            document.removeEventListener('keydown', initAudioOnInteraction);
        };

        document.addEventListener('click', initAudioOnInteraction);
        document.addEventListener('touchstart', initAudioOnInteraction);
        document.addEventListener('keydown', initAudioOnInteraction);

        this.spinBtn.addEventListener('click', () => this.spin());
        this.bulkAddBtn.addEventListener('click', () => this.addBulkParticipants());
        this.singleAddBtn.addEventListener('click', () => this.addSingleParticipant());
        this.singleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSingleParticipant();
        });
        this.clearAllBtn.addEventListener('click', () => this.clearAllParticipants());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());

        this.winnerModal.addEventListener('click', (e) => {
            if (e.target === this.winnerModal) this.closeModal();
        });


    }
    
    loadParticipants() {
        // Load from localStorage or use defaults
        const saved = localStorage.getItem('luckydraw_participants');
        let participantValues;

        if (saved) {
            try {
                participantValues = JSON.parse(saved);
            } catch (e) {
                participantValues = [1, 3, 7, 20, 50, 75, 100, 500];
            }
        } else {
            participantValues = [1, 3, 7, 20, 50, 75, 100, 500];
        }

        // Convert simple number array to participant objects with colors
        this.participants = participantValues.map((value, index) => ({
            id: index,
            name: value.toString(),
            value: value,
            color: this.colors[index % this.colors.length]
        }));

        this.wheelNeedsRedraw = true; // Mark wheel for redraw
        this.renderParticipants();
        this.drawWheel();
    }
    
    renderParticipants() {
        this.participantsList.innerHTML = '';

        if (this.participants.length === 0) {
            this.participantsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No participants added yet</p>
                </div>
            `;
            return;
        }

        this.participants.forEach((participant, index) => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `
                <div class="participant-color" style="background: ${participant.color}"></div>
                <span class="participant-name">${participant.name}</span>
                <span class="participant-number">#${index + 1}</span>
                <button class="remove-participant-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            item.querySelector('.remove-participant-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeParticipant(index);
            });

            this.participantsList.appendChild(item);
        });

        this.updateParticipantCount();
    }
    
    getContrastColor(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
    
    removeParticipant(index) {
        this.participants.splice(index, 1);
        // Reassign colors
        this.participants.forEach((p, i) => {
            p.color = this.colors[i % this.colors.length];
        });

        // Save to localStorage
        const participantValues = this.participants.map(p => p.value);
        localStorage.setItem('luckydraw_participants', JSON.stringify(participantValues));

        this.wheelNeedsRedraw = true; // Mark wheel for redraw
        this.renderParticipants();
        this.drawWheel();
    }


    addBulkParticipants() {
        const text = this.bulkInput.value.trim();
        if (!text) return;

        const names = text.split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0 && name.length <= 50); // Limit name length

        if (names.length === 0) return;

        // No participant limit

        const newParticipants = names.map((name, index) => ({
            id: Date.now() + index,
            name: name,
            color: this.colors[(this.participants.length + index) % this.colors.length]
        }));

        this.participants.push(...newParticipants);
        this.bulkInput.value = '';

        // Save to localStorage
        const participantValues = this.participants.map(p => p.value);
        localStorage.setItem('luckydraw_participants', JSON.stringify(participantValues));

        this.wheelNeedsRedraw = true; // Mark wheel for redraw
        this.renderParticipants();
        this.drawWheel();

    }

    addSingleParticipant() {
        const name = this.singleInput.value.trim();
        if (!name || name.length > 50) return;

        // No participant limit

        const newParticipant = {
            id: Date.now(),
            name: name,
            color: this.colors[this.participants.length % this.colors.length]
        };

        this.participants.push(newParticipant);
        this.singleInput.value = '';

        // Save to localStorage
        const participantValues = this.participants.map(p => p.value);
        localStorage.setItem('luckydraw_participants', JSON.stringify(participantValues));

        this.wheelNeedsRedraw = true; // Mark wheel for redraw
        this.renderParticipants();
        this.drawWheel();

    }

    clearAllParticipants() {
        if (this.participants.length === 0) return;

        if (confirm('Are you sure you want to remove all participants?')) {
            this.participants = [];
            // Clear localStorage
            localStorage.removeItem('luckydraw_participants');
            this.wheelNeedsRedraw = true; // Mark wheel for redraw
            this.renderParticipants();
            this.drawWheel();
        }
    }

    updateParticipantCount() {
        this.participantCount.textContent = this.participants.length;
    }

    
    drawWheel() {
        if (!this.canvas || !this.ctx) {
            console.warn('Canvas not available for drawing');
            return;
        }

        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.participants.length === 0) {
            // Draw empty wheel
            const radius = Math.min(centerX, centerY) - 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#2a2a4a';
            ctx.fill();
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Montserrat';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add participants', centerX, centerY);
            return;
        }

        // Check if we need to redraw the cached wheel
        if (this.wheelNeedsRedraw) {
            this.drawWheelCache();
            this.wheelNeedsRedraw = false;
        }

        // During spinning, just rotate and draw the cached wheel
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.currentRotation);
        ctx.translate(-centerX, -centerY);
        ctx.drawImage(this.wheelCacheCanvas, 0, 0);
        ctx.restore();
    }

    drawWheelCache() {
        // Set cache canvas size to match main canvas
        this.wheelCacheCanvas.width = this.canvas.width;
        this.wheelCacheCanvas.height = this.canvas.height;

        const ctx = this.wheelCacheCtx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear cache canvas
        ctx.clearRect(0, 0, this.wheelCacheCanvas.width, this.wheelCacheCanvas.height);

        const sliceAngle = (2 * Math.PI) / this.participants.length;

        // Draw slices (static, no rotation)
        this.participants.forEach((participant, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Simple solid color fill for better performance
            ctx.fillStyle = participant.color;
            ctx.fill();

            // Draw slice border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text (only for participants with reasonable slice size)
            if (sliceAngle > 0.3) { // Only draw text if slice is large enough
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + sliceAngle / 2);
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = this.getContrastColor(participant.color);
                ctx.font = 'bold 14px Montserrat';

                // Truncate long names
                let displayName = participant.name;
                if (displayName.length > 12) {
                    displayName = displayName.substring(0, 10) + '...';
                }

                ctx.fillText(displayName, radius - 20, 0);
                ctx.restore();
            }
        });

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw decorative elements
        this.drawDecorativeElements(ctx, centerX, centerY, radius);
    }
    
    drawDecorativeElements(ctx, centerX, centerY, radius) {
        // Draw inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw center dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    
    async spin() {
        if (this.isSpinning || this.participants.length === 0) return;

        this.isSpinning = true;
        this.spinBtn.disabled = true;

        // Add spinning class for effects
        document.querySelector('.wheel-wrapper').classList.add('wheel-spinning');

        // Play spinning sound
        this.playSpinningSound();

        // Frontend winner selection - SIMULATE BACKEND BEHAVIOR
        const winnerIndex = Math.floor(Math.random() * this.participants.length);
        const winner = this.participants[winnerIndex];

        // Calculate precise final angle (same algorithm as backend)
        const segmentAngle = 360 / this.participants.length;
        const winnerCenterOriginal = winnerIndex * segmentAngle + segmentAngle / 2;
        const targetRotation = 270 - winnerCenterOriginal; // Pointer is at 270° (top)
        const normalizedTarget = ((targetRotation % 360) + 360) % 360;
        const fullRotations = 8; // 8 full spins for dramatic effect
        const finalAngle = fullRotations * 360 + normalizedTarget;

        console.log(`🎯 Winner: ${winner.value} (index ${winnerIndex})`);

        // Animate spin to the final angle
        const startRotation = this.currentRotation * (180 / Math.PI);
        const duration = this.spinDuration;
        const startTime = performance.now();
        let lastFrameTime = startTime;

        const animate = (currentTime) => {
            if (!this.isSpinning) return; // Safety check

            // Limit frame rate to 60fps for better performance
            if (currentTime - lastFrameTime < 16.67) { // ~60fps
                this.animationId = requestAnimationFrame(animate);
                return;
            }
            lastFrameTime = currentTime;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const currentAngle = startRotation + finalAngle * easeOut;
            this.currentRotation = (currentAngle * Math.PI) / 180;

            // Only draw during animation - much more efficient
            this.drawWheel();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                // Spin complete
                this.animationId = null;
                this.isSpinning = false;

                console.log(`🎡 Wheel stopped at: ${winner.value}`);

                // Re-enable buttons safely
                if (this.spinBtn) this.spinBtn.disabled = false;

                const wheelWrapper = document.querySelector('.wheel-wrapper');
                if (wheelWrapper) {
                    wheelWrapper.classList.remove('wheel-spinning');
                }

                // Show winner
                setTimeout(() => {
                    this.showWinner(winner);
                }, 500);
            }
        };

        this.animationId = requestAnimationFrame(animate);
    }
    
    showWinner(winner) {
        console.log(`🎉 Winner: ${winner.value}!`);

        this.winnerName.textContent = winner.value.toString();
        this.winnerModal.classList.add('active');

        // Remove winner from participants list and redraw wheel
        const winnerIndex = this.participants.findIndex(p => p.id === winner.id);
        if (winnerIndex !== -1) {
            this.participants.splice(winnerIndex, 1);
            // Reassign colors and IDs to remaining participants
            this.participants.forEach((p, i) => {
                p.id = i;
                p.color = this.colors[i % this.colors.length];
            });
            this.wheelNeedsRedraw = true; // Mark wheel for redraw
            this.renderParticipants();
            this.drawWheel();
        }

        // Play winner sound
        this.playWinnerSound();
    }

    playSpinningSound() {
        // Simple spinning sound - just a beep
        if (this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
            } catch (e) {}
        }
    }


    playWinnerSound() {
        // Simple winner sound - ascending tones
        if (this.audioContext) {
            try {
                const notes = [523, 659, 784]; // C, E, G
                notes.forEach((freq, index) => {
                    setTimeout(() => {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(this.audioContext.destination);
                        oscillator.frequency.value = freq;
                        gainNode.gain.value = 0.2;
                        oscillator.start();
                        oscillator.stop(this.audioContext.currentTime + 0.2);
                    }, index * 150);
                });
            } catch (e) {}
        }
    }

    
    closeModal() {
        this.winnerModal.classList.remove('active');
    }



}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new LuckyDraw();


});