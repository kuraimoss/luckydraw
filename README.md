# 🎡 Lucky Draw Wheel

A beautiful and interactive web application for conducting random name draws using a spinning wheel. Perfect for giveaways, contests, events, and decision-making fun!

![Lucky Draw Wheel](https://via.placeholder.com/800x400/020617/ffffff?text=Lucky+Draw+Wheel+Screenshot)

## ✨ Features

- **🎯 Interactive Spinning Wheel**: Smooth animations with customizable spin duration
- **👥 Participant Management**: Add participants individually or in bulk
- **🏆 Winner History**: Track all previous winners with timestamps
- **🎨 Elegant UI**: Modern design with dark theme and gold accents
- **📱 Responsive**: Works on desktop and mobile devices
- **🎵 Sound Effects**: Audio feedback during spins
- **💫 Particle Effects**: Floating particles for ambiance
- **🌙 Dark Mode**: Beautiful dark theme with glowing effects

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kuraimoss/lucky-draw-wheel.git
cd lucky-draw-wheel
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## 🎮 Usage

1. **Add Participants**:
   - Click the settings button (⚙) in the top-right
   - Add names individually or paste multiple names
   - Names are saved automatically

2. **Spin the Wheel**:
   - Click the "SPIN" button in the center
   - Watch the wheel spin with sound effects
   - The winner is announced in a modal

3. **View History**:
   - Click the trophy icon (🏆) to see past winners
   - Clear history if needed

4. **Customize Settings**:
   - Adjust spin duration (3-9 seconds)
   - Toggle fullscreen mode

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express
- **Canvas**: HTML5 Canvas for wheel rendering
- **Storage**: Local/Session Storage for data persistence
- **Audio**: Web Audio API for sound effects

## 📁 Project Structure

```
lucky-draw-wheel/
├── public/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Stylesheets
│   └── app.js          # Frontend JavaScript
├── server.js           # Express server
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## 🎨 Customization

### Colors
The app uses CSS custom properties for easy theming:

```css
:root {
  --bg-deep: #020617;
  --accent-gold: #facc15;
  --text-main: #e5e7eb;
  /* ... more variables */
}
```

### Wheel Segments
Modify the `sliceColors` array in `app.js` to change wheel colors.

### Sound Effects
Replace the `playTickSound()` function to customize audio feedback.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons from various open-source projects
- Sound effects generated using Web Audio API
- Inspired by various lucky draw applications

## 📞 Contact

- **GitHub**: [@kuraimoss](https://github.com/kuraimoss)
- **LinkedIn**: [saintripentumanggor](https://linkedin.com/in/saintripentumanggor)
- **Instagram**: [@kuraimos](https://instagram.com/kuraimos)

---

Made with ❤️ for fun and fair random selections!