# 🚀 Space Invaders - Enhanced Edition

An amazing, modern take on the classic Space Invaders game built with React, Three.js, and GSAP animations.

## ✨ Features

- **3D Graphics**: Powered by Three.js for stunning 3D visuals
- **Smooth Animations**: GSAP-powered animations for fluid movement and effects
- **Particle Effects**: Explosive particle systems when aliens are destroyed
- **Progressive Difficulty**: Increasing speed and challenge with each level
- **Modern UI**: Beautiful retro-futuristic interface with glowing effects
- **Asset-Based Sprites**: Uses your custom alien and player images

## 🎮 Controls

- **← → Arrow Keys**: Move player left/right
- **Spacebar**: Shoot bullets
- **ESC**: (Future: Pause game)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 🎨 Game Features

- **Score System**: Different point values for different alien types
- **Lives System**: 3 lives to start, lose one when hit by alien bullets
- **Level Progression**: Clear all aliens to advance to the next level
- **Wave Animation**: Aliens move in a wave pattern for visual appeal
- **Explosion Effects**: Particle explosions when aliens or player are hit

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **Three.js**: 3D graphics and rendering
- **GSAP**: Professional animations
- **Vite**: Fast build tool and dev server

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── GameCanvas.jsx    # Main game logic with Three.js
│   │   ├── GameUI.jsx        # UI overlay (score, lives, etc.)
│   │   └── *.css             # Component styles
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── public/
│   └── assets/               # Game sprites (aliens, player)
├── package.json
└── vite.config.js
```

## 🎯 Future Enhancements

- Sound effects and background music
- Power-ups and special weapons
- Boss battles
- High score leaderboard
- Mobile touch controls
- Pause functionality

Enjoy the game! 🎮

