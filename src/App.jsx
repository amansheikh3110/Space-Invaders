import { useState, useEffect, useRef } from 'react'
import GameCanvas from './components/GameCanvas'
import GameUI from './components/GameUI'
import './App.css'

function App() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [level, setLevel] = useState(1)
  const [levelComplete, setLevelComplete] = useState(false)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('spaceInvadersHighScore')
    return saved ? parseInt(saved, 10) : 0
  })

  const handleScoreUpdate = (points) => {
    setScore(prev => {
      const newScore = prev + points
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem('spaceInvadersHighScore', newScore.toString())
      }
      return newScore
    })
  }

  const handleLivesUpdate = (newLives) => {
    setLives(newLives)
    if (newLives <= 0) {
      setGameOver(true)
      // Update high score on game over
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('spaceInvadersHighScore', score.toString())
      }
    }
  }

  const handleLevelComplete = () => {
    setLevelComplete(true)
    // Update high score on level complete
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('spaceInvadersHighScore', score.toString())
    }
  }

  const handleContinueAfterLevel = () => {
    setLevelComplete(false)
    setLevel(prev => prev + 1)
  }

  const handleRestart = () => {
    setScore(0)
    setLives(3)
    setGameOver(false)
    setLevel(1)
    setLevelComplete(false)
    setGameStarted(false)
  }

  const handleStart = () => {
    setGameStarted(true)
    setLevelComplete(false)
  }

  // Handle key press to continue after level complete or game over
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((levelComplete || gameOver) && gameStarted) {
        if (levelComplete) {
          handleContinueAfterLevel()
        } else if (gameOver) {
          handleRestart()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [levelComplete, gameOver, gameStarted])

  return (
    <div className="app">
      <GameUI 
        score={score} 
        lives={lives} 
        level={level}
        gameOver={gameOver}
        gameStarted={gameStarted}
        levelComplete={levelComplete}
        highScore={highScore}
        onRestart={handleRestart}
        onStart={handleStart}
        onContinueAfterLevel={handleContinueAfterLevel}
      />
      {gameStarted && !levelComplete && (
        <GameCanvas
          score={score}
          lives={lives}
          level={level}
          onScoreUpdate={handleScoreUpdate}
          onLivesUpdate={handleLivesUpdate}
          onLevelComplete={handleLevelComplete}
          onGameOver={() => {
            setGameOver(true)
            if (score > highScore) {
              setHighScore(score)
              localStorage.setItem('spaceInvadersHighScore', score.toString())
            }
          }}
          gameOver={gameOver}
        />
      )}
    </div>
  )
}

export default App

