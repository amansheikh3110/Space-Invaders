import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './GameUI.css'

function GameUI({ score, lives, level, gameOver, gameStarted, levelComplete, highScore, onRestart, onStart, onContinueAfterLevel }) {
  const scoreRef = useRef(null)
  const livesRef = useRef(null)
  const levelRef = useRef(null)

  useEffect(() => {
    if (scoreRef.current) {
      gsap.to(scoreRef.current, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      })
    }
  }, [score])

  useEffect(() => {
    if (livesRef.current) {
      gsap.to(livesRef.current, {
        scale: 1.3,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'elastic.out'
      })
    }
  }, [lives])

  useEffect(() => {
    if (levelRef.current) {
      gsap.fromTo(levelRef.current, 
        { scale: 0, rotation: 360 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out' }
      )
    }
  }, [level])

  return (
    <div className="game-ui">
      <div className="ui-top">
        <div className="ui-item">
          <span className="ui-label">SCORE</span>
          <span className="ui-value" ref={scoreRef}>{score.toString().padStart(6, '0')}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">HIGH SCORE</span>
          <span className="ui-value">{highScore.toString().padStart(6, '0')}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LEVEL</span>
          <span className="ui-value" ref={levelRef}>{level}</span>
        </div>
        <div className="ui-item">
          <span className="ui-label">LIVES</span>
          <div className="lives-container" ref={livesRef}>
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="life-icon">🚀</span>
            ))}
          </div>
        </div>
      </div>

      {!gameStarted && (
        <div className="start-screen">
          <h1 className="title">SPACE INVADERS</h1>
          <p className="instructions">
            Use ← → to move<br />
            Press SPACE to shoot
          </p>
          <button className="start-button" onClick={onStart}>
            START GAME
          </button>
        </div>
      )}

      {levelComplete && gameStarted && (
        <div className="level-complete-screen">
          <h1 className="level-complete-title">LEVEL COMPLETE!</h1>
          <p className="level-score">Score: {score}</p>
          {score >= highScore && (
            <p className="new-high-score">NEW HIGH SCORE!</p>
          )}
          <p className="continue-instruction">Press any key to continue</p>
        </div>
      )}

      {gameOver && gameStarted && (
        <div className="game-over-screen">
          <h1 className="game-over-title">GAME OVER</h1>
          <p className="final-score">Final Score: {score}</p>
          <p className="high-score-display">High Score: {highScore}</p>
          {score >= highScore && score > 0 && (
            <p className="new-high-score">NEW HIGH SCORE!</p>
          )}
          <p className="continue-instruction">Press any key to return to title</p>
        </div>
      )}
    </div>
  )
}

export default GameUI

