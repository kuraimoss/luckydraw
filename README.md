# 🎰 Lucky Draw Wheel - GitHub Pages Ready

A perfect accuracy lucky draw wheel application with frontend-only implementation using localStorage for persistence.

## ✨ Features

- **100% Accurate**: Wheel always stops at the correct sector using precise mathematical calculation
- **Frontend Winner Selection**: Same algorithm as backend version for consistency
- **Real-time Animation**: Smooth wheel spinning with easing effects
- **Dynamic Participants**: Support 2-1000 participants with automatic wheel resizing
- **Winner Removal**: Winners are removed and wheel redraws for next round
- **LocalStorage Persistence**: Participants are saved between sessions
- **Console Logging**: Real-time verification of winner selection and wheel stopping
- **Production Optimized**: Clean, minimal code with no external dependencies

## 🎯 How It Works

### Winner Selection Algorithm (Frontend Implementation)
```javascript
// 1. Select winner randomly (same as backend)
const winnerIndex = Math.floor(Math.random() * participants.length);

// 2. Calculate precise final angle
const segmentAngle = 360 / participants.length;
const winnerCenterOriginal = winnerIndex * segmentAngle + segmentAngle / 2;
const targetRotation = 90 - winnerCenterOriginal; // Pointer at bottom
const normalizedTarget = ((targetRotation % 360) + 360) % 360;
const finalAngle = 8 * 360 + normalizedTarget; // 8 spins + exact position

// 3. Animate wheel to final angle
const currentAngle = startRotation + finalAngle * easeOut;
this.currentRotation = (currentAngle * Math.PI) / 180;
```

## 🚀 Live Demo

**🎉 [Play Lucky Draw Wheel](https://kuraimoss.github.io/luckydraw/)**

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **Storage**: Browser localStorage for persistence
- **Styling**: CSS3 with animations
- **Deployment**: GitHub Pages (free hosting)

## 📁 Project Structure

```
luckydraw/
├── docs/                    # GitHub Pages root
│   ├── index.html          # Main HTML
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       └── app.js          # Frontend logic
├── public/                 # Source files
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── server.js              # Original backend (for reference)
```

## 🎮 Usage

1. **Add Participants**: Use bulk input or single input to add participants
2. **Spin Wheel**: Click "SPIN THE WHEEL" button
3. **View Results**: Wheel stops at winner, modal shows result
4. **Continue**: Winner removed, wheel redraws for next round
5. **Persistence**: Participants are automatically saved to browser storage

### Console Output
```
🎯 Winner: 7 (index 2)
🎡 Wheel stopped at: 7
🎉 Winner: 7!
```

## 🔧 Local Development

```bash
# Clone repository
git clone https://github.com/kuraimoss/luckydraw.git
cd luckydraw

# Open in browser (no server needed)
# Just open docs/index.html in your browser
```

## 🚀 Deployment (GitHub Pages)

### Automatic Deployment
1. Fork this repository
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select branch "main" and folder "/docs"
5. Save - GitHub will deploy automatically

### Manual Deployment
```bash
# Files are already in docs/ folder
# Just push to GitHub and enable Pages as above
```

## 🎯 Algorithm Accuracy

- **Method**: Mathematical calculation ensures perfect precision
- **No External Dependencies**: Works offline
- **Same Algorithm**: Consistent with backend version
- **Deterministic**: Same winner index → same final angle

### Why It's Perfect

1. **Mathematical Precision**: Exact angle calculation
2. **No Network Latency**: Instant response
3. **Offline Capable**: Works without internet
4. **Browser Storage**: Participants persist between sessions

## 📊 Performance

- **File Size**: 20KB total (HTML + CSS + JS)
- **Load Time**: Instant (no server requests)
- **Animation**: 60fps smooth spinning
- **Compatibility**: All modern browsers
- **Storage**: Uses browser localStorage

## 🎨 Customization

### Change Default Participants
Edit `docs/js/app.js` loadParticipants function:
```javascript
participantValues = [1, 3, 7, 20, 50, 75, 100, 500]; // Your values
```

### Adjust Spin Duration
Edit `docs/js/app.js`:
```javascript
this.spinDuration = 6000; // 6 seconds
```

### Change Colors
Edit `docs/js/app.js` colors array:
```javascript
this.colors = ['#FF6B6B', '#4ECDC4', /* ... */];
```

## 🔄 Data Persistence

- **Automatic Save**: Participants saved when added/removed
- **Browser Storage**: Uses localStorage
- **Session Recovery**: Participants restored on page reload
- **No Data Loss**: Survives browser restarts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes to files in `docs/` folder
4. Test locally by opening `docs/index.html`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit pull request

## 📄 License

MIT License - feel free to use for any purpose!

## 🙏 Credits

- **Algorithm**: Precise mathematical calculation for perfect accuracy
- **Design**: Clean, modern UI with smooth animations
- **Implementation**: Frontend-only with localStorage persistence

---

**🎰 Enjoy your perfect lucky draw wheel! Always fair, always accurate, works offline!** ✨