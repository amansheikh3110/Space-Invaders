import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import './GameCanvas.css'

function GameCanvas({ 
  score, 
  lives, 
  level, 
  onScoreUpdate, 
  onLivesUpdate, 
  onLevelComplete,
  onGameOver,
  gameOver 
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const livesRef = useRef(lives)
  const gameOverRef = useRef(gameOver)
  const levelCompleteRef = useRef(false)
  const lastFrameTimeRef = useRef(0)
  const soundsRef = useRef({
    playerGun: null,
    alienGun: null,
    gameOver: null,
    gameWin: null
  })
  const gameStateRef = useRef({
    player: null,
    aliens: [],
    bullets: [],
    alienBullets: [],
    keys: {},
    animationId: null,
    alienDirection: 1,
    baseAlienSpeed: 0.02, // Much slower base speed
    lastShot: 0,
    textures: {},
    particles: [],
    lastAlienShot: 0,
    initialized: false
  })

  // Keep refs updated
  useEffect(() => {
    livesRef.current = lives
  }, [lives])

  useEffect(() => {
    gameOverRef.current = gameOver
    if (gameOver && gameStateRef.current.animationId) {
      cancelAnimationFrame(gameStateRef.current.animationId)
      gameStateRef.current.animationId = null
      // Play game over sound when game ends
      if (soundsRef.current.gameOver) {
        soundsRef.current.gameOver.currentTime = 0
        soundsRef.current.gameOver.play().catch(() => {}) // Ignore autoplay errors
      }
    }
  }, [gameOver])

  useEffect(() => {
    if (!mountRef.current) return

    // Load sound effects
    soundsRef.current.playerGun = new Audio('/assets/player_gun_sound.mp3')
    soundsRef.current.alienGun = new Audio('/assets/alien_gun_sound.mp3')
    soundsRef.current.gameOver = new Audio('/assets/game_over_SI.mp3')
    soundsRef.current.gameWin = new Audio('/assets/game_win_SI.mp3')
    
    // Set volume levels
    soundsRef.current.playerGun.volume = 0.5
    soundsRef.current.alienGun.volume = 0.4
    soundsRef.current.gameOver.volume = 0.6
    soundsRef.current.gameWin.volume = 0.6

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Camera - use orthographic for 2D-like view
    const aspect = window.innerWidth / window.innerHeight
    const camera = new THREE.OrthographicCamera(-10 * aspect, 10 * aspect, 10, -10, 0.1, 1000)
    camera.position.z = 10
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Load textures
    const textureLoader = new THREE.TextureLoader()
    const loadTexture = (path) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          path,
          (texture) => {
            texture.magFilter = THREE.NearestFilter
            texture.minFilter = THREE.NearestFilter
            texture.flipY = false
            resolve(texture)
          },
          undefined,
          reject
        )
      })
    }

    Promise.all([
      loadTexture('/assets/player.png').then(t => {
        gameStateRef.current.textures.player = t
        return t
      }),
      loadTexture('/assets/green.png').then(t => {
        gameStateRef.current.textures.green = t
        return t
      }),
      loadTexture('/assets/yellow.png').then(t => {
        gameStateRef.current.textures.yellow = t
        return t
      }),
      loadTexture('/assets/red.png').then(t => {
        gameStateRef.current.textures.red = t
        return t
      }),
      loadTexture('/assets/extra.png').then(t => {
        gameStateRef.current.textures.extra = t
        return t
      })
    ]).then(() => {
      initGame()
      gameStateRef.current.initialized = true
    }).catch(err => {
      console.error('Error loading textures:', err)
      initGame()
      gameStateRef.current.initialized = true
    })

    // Input handling
    const handleKeyDown = (e) => {
      if (e.key === ' ') e.preventDefault()
      gameStateRef.current.keys[e.key] = true
    }

    const handleKeyUp = (e) => {
      gameStateRef.current.keys[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Handle window resize
    const handleResize = () => {
      const aspect = window.innerWidth / window.innerHeight
      camera.left = -10 * aspect
      camera.right = 10 * aspect
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  const initGame = () => {
    const state = gameStateRef.current
    const scene = sceneRef.current
    if (!scene) return

    // Clear existing game objects
    // Remove old player first to prevent ghosting
    if (state.player && state.player.mesh) {
      if (scene.getObjectById(state.player.mesh.id)) {
        scene.remove(state.player.mesh)
      }
      state.player.mesh.geometry?.dispose()
      state.player.mesh.material?.dispose()
      state.player = null
    }
    
    state.aliens.forEach(alien => {
      if (alien.mesh) {
        if (scene.getObjectById(alien.mesh.id)) {
          scene.remove(alien.mesh)
        }
        alien.mesh.geometry?.dispose()
        alien.mesh.material?.dispose()
      }
    })
    state.bullets.forEach(bullet => {
      if (bullet.mesh) {
        scene.remove(bullet.mesh)
        bullet.mesh.geometry?.dispose()
        bullet.mesh.material?.dispose()
        if (bullet.glowMesh) {
          scene.remove(bullet.glowMesh)
          bullet.glowMesh.geometry?.dispose()
          bullet.glowMesh.material?.dispose()
        }
      }
    })
    state.alienBullets.forEach(bullet => {
      if (bullet.mesh) {
        scene.remove(bullet.mesh)
        bullet.mesh.geometry?.dispose()
        bullet.mesh.material?.dispose()
        if (bullet.glowMesh) {
          scene.remove(bullet.glowMesh)
          bullet.glowMesh.geometry?.dispose()
          bullet.glowMesh.material?.dispose()
        }
      }
    })
    state.particles.forEach(particle => {
      if (particle.mesh) {
        scene.remove(particle.mesh)
        particle.mesh.geometry?.dispose()
        particle.mesh.material?.dispose()
      }
    })
    
    state.aliens = []
    state.bullets = []
    state.alienBullets = []
    state.particles = []
    state.alienDirection = 1
    state.baseAlienSpeed = 0.02
    levelCompleteRef.current = false

    // Create player with texture - ensure only one instance
    const playerSize = 1.2
    const playerGeometry = new THREE.PlaneGeometry(playerSize, playerSize * 0.6)
    const playerMaterial = new THREE.MeshBasicMaterial({ 
      map: state.textures.player || null,
      transparent: true,
      color: state.textures.player ? 0xffffff : 0x00ff00,
      side: THREE.DoubleSide
    })
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial)
    playerMesh.position.set(0, -7, 0)
    playerMesh.matrixAutoUpdate = true
    scene.add(playerMesh)
    state.player = { mesh: playerMesh, x: 0, y: -7, speed: 0.2 }

    // Create aliens in rectangular formation
    const rows = 5
    const cols = 10
    const alienSpacing = 1.5
    const alienSize = 0.8
    const startX = -(cols - 1) * alienSpacing / 2
    const startY = 5

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const alienGeometry = new THREE.PlaneGeometry(alienSize, alienSize)
        
        // Assign textures based on row
        let texture = state.textures.green
        if (r === 0) {
          texture = state.textures.extra || state.textures.red
        } else if (r === 1) {
          texture = state.textures.red
        } else if (r === 2) {
          texture = state.textures.yellow
        } else {
          texture = state.textures.green
        }

        const alienMaterial = new THREE.MeshBasicMaterial({
          map: texture || null,
          transparent: true,
          color: texture ? 0xffffff : 0x00ff00
        })
        const alienMesh = new THREE.Mesh(alienGeometry, alienMaterial)
        const x = startX + c * alienSpacing
        const y = startY - r * 0.9
        alienMesh.position.set(x, y, 0)
        scene.add(alienMesh)
        
        state.aliens.push({
          mesh: alienMesh,
          x: x,
          y: y,
          alive: true,
          row: r,
          col: c
        })
      }
    }

    startGameLoop()
  }

  const startGameLoop = () => {
    const animate = (currentTime) => {
      if (gameOverRef.current || levelCompleteRef.current) {
        gameStateRef.current.animationId = requestAnimationFrame(animate)
        render()
        return
      }

      const deltaTime = currentTime - lastFrameTimeRef.current
      lastFrameTimeRef.current = currentTime
      
      update(deltaTime)
      render()
      gameStateRef.current.animationId = requestAnimationFrame(animate)
    }
    lastFrameTimeRef.current = performance.now()
    animate(performance.now())
  }

  const update = (deltaTime) => {
    const state = gameStateRef.current
    const { player, keys } = state

    if (!player || !state.initialized) return

    // Player movement - smooth and responsive, update immediately
    if (keys['ArrowLeft'] && player.x > -8.5) {
      player.x -= player.speed
    }
    if (keys['ArrowRight'] && player.x < 8.5) {
      player.x += player.speed
    }
    // Always update position to prevent ghosting
    player.mesh.position.x = player.x
    player.mesh.position.y = player.y

    // Shooting - player can shoot continuously
    const now = Date.now()
    if (keys[' '] && now - state.lastShot > 200) {
      state.lastShot = now
      createBullet(player.x, player.y + 0.5, true)
      // Play player gun sound
      if (soundsRef.current.playerGun) {
        soundsRef.current.playerGun.currentTime = 0
        soundsRef.current.playerGun.play().catch(() => {}) // Ignore autoplay errors
      }
    }

    // Update player bullets (moving up)
    state.bullets.forEach(bullet => {
      bullet.y += 0.22  // Slightly reduced from 0.25
      bullet.mesh.position.y = bullet.y
      if (bullet.glowMesh) bullet.glowMesh.position.y = bullet.y
      bullet.x = bullet.mesh.position.x // Keep x in sync
      if (bullet.y > 12) {
        sceneRef.current.remove(bullet.mesh)
        bullet.mesh.geometry.dispose()
        bullet.mesh.material.dispose()
        if (bullet.glowMesh) {
          sceneRef.current.remove(bullet.glowMesh)
          bullet.glowMesh.geometry.dispose()
          bullet.glowMesh.material.dispose()
        }
      }
    })
    state.bullets = state.bullets.filter(b => b.y <= 12)

    // Update alien bullets (moving down)
    state.alienBullets.forEach(bullet => {
      bullet.y -= 0.18  // Slightly reduced from 0.2
      bullet.mesh.position.y = bullet.y
      if (bullet.glowMesh) bullet.glowMesh.position.y = bullet.y
      bullet.x = bullet.mesh.position.x
      if (bullet.y < -12) {
        sceneRef.current.remove(bullet.mesh)
        bullet.mesh.geometry.dispose()
        bullet.mesh.material.dispose()
        if (bullet.glowMesh) {
          sceneRef.current.remove(bullet.glowMesh)
          bullet.glowMesh.geometry.dispose()
          bullet.glowMesh.material.dispose()
        }
      }
    })
    state.alienBullets = state.alienBullets.filter(b => b.y >= -12)

    // Calculate alien speed based on lowest alien position
    const aliveAliens = state.aliens.filter(a => a.alive)
    if (aliveAliens.length > 0) {
      const lowestY = Math.min(...aliveAliens.map(a => a.y))
      const topY = 5
      const bottomY = -6
      const progress = (topY - lowestY) / (topY - bottomY) // 0 to 1
      // Speed increases as aliens get closer to bottom
      state.baseAlienSpeed = 0.02 + progress * 0.08
    }

    // Move aliens horizontally
    let hitWall = false
    const bounds = 9
    aliveAliens.forEach(alien => {
      alien.x += state.baseAlienSpeed * state.alienDirection
      alien.mesh.position.x = alien.x
      if (alien.x < -bounds || alien.x > bounds) {
        hitWall = true
      }
    })

    // When hitting wall, reverse direction and move down
    if (hitWall) {
      state.alienDirection *= -1
      aliveAliens.forEach(alien => {
        alien.y -= 0.2  // Reduced from 0.3 to slow down descent
        alien.mesh.position.y = alien.y
        // Check if aliens reached bottom (game over condition)
        if (alien.y <= -5) {
          onGameOver()
        }
      })
    }

    // Alien shooting - one per column, random timing
    const columns = new Set(aliveAliens.map(a => a.col))
    columns.forEach(col => {
      const columnAliens = aliveAliens.filter(a => a.col === col)
      if (columnAliens.length > 0) {
        // Find bottom alien in column
        const bottomAlien = columnAliens.reduce((lowest, current) => 
          current.y < lowest.y ? current : lowest
        )
        
        // Random chance to shoot - increased frequency
        if (Math.random() < 0.0012 && now - state.lastAlienShot > 300) {
          state.lastAlienShot = now
          createBullet(bottomAlien.x, bottomAlien.y - 0.5, false)
          // Play alien gun sound
          if (soundsRef.current.alienGun) {
            soundsRef.current.alienGun.currentTime = 0
            soundsRef.current.alienGun.play().catch(() => {}) // Ignore autoplay errors
          }
        }
      }
    })

    // Collision detection
    handleCollisions()

    // Update particles
    state.particles.forEach(particle => {
      particle.life -= 0.03
      particle.mesh.position.x += particle.vx
      particle.mesh.position.y += particle.vy
      particle.mesh.material.opacity = Math.max(0, particle.life)
      if (particle.life <= 0) {
        sceneRef.current.remove(particle.mesh)
        particle.mesh.geometry.dispose()
        particle.mesh.material.dispose()
      }
    })
    state.particles = state.particles.filter(p => p.life > 0)

    // Check win condition - all aliens destroyed
    if (aliveAliens.length === 0 && !levelCompleteRef.current) {
      levelCompleteRef.current = true
      // Play game win sound
      if (soundsRef.current.gameWin) {
        soundsRef.current.gameWin.currentTime = 0
        soundsRef.current.gameWin.play().catch(() => {}) // Ignore autoplay errors
      }
      onLevelComplete()
    }
  }

  const createBullet = (x, y, isPlayer) => {
    // Create visible laser beam
    const bulletLength = isPlayer ? 0.8 : 0.6
    const bulletWidth = 0.1
    const geometry = new THREE.BoxGeometry(bulletWidth, bulletLength, 0.1)
    
    // Create glowing material
    const material = new THREE.MeshBasicMaterial({ 
      color: isPlayer ? 0x00ffff : 0xff0000,
      emissive: isPlayer ? 0x00ffff : 0xff0000,
      transparent: true,
      opacity: 0.9
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, 0)
    sceneRef.current.add(mesh)

    // Add glow effect with additional mesh
    const glowGeometry = new THREE.BoxGeometry(bulletWidth * 2, bulletLength * 1.2, 0.1)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: isPlayer ? 0x00ffff : 0xff0000,
      transparent: true,
      opacity: 0.3
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.set(x, y, -0.05)
    sceneRef.current.add(glowMesh)

    const bullet = { 
      mesh, 
      glowMesh,
      x, 
      y, 
      isPlayer 
    }
    
    if (isPlayer) {
      gameStateRef.current.bullets.push(bullet)
    } else {
      gameStateRef.current.alienBullets.push(bullet)
    }
  }

  const createExplosion = (x, y, color = 0x00ff00) => {
    const particleCount = 15
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 4, 4)
      const material = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 1
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, 0)
      sceneRef.current.add(mesh)

      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 0.15 + Math.random() * 0.1
      gameStateRef.current.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1
      })
    }
  }

  const handleCollisions = () => {
    const state = gameStateRef.current

    // Player bullets vs aliens
    state.bullets.forEach((bullet, bi) => {
      state.aliens.forEach((alien, ai) => {
        if (alien.alive) {
          const dx = bullet.x - alien.x
          const dy = bullet.y - alien.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 0.6) {
            // Hit!
            alien.alive = false
            createExplosion(alien.x, alien.y, 0x00ff00)
            
            gsap.to(alien.mesh.scale, {
              x: 0,
              y: 0,
              z: 0,
              duration: 0.2,
              ease: 'back.in',
              onComplete: () => {
                if (sceneRef.current && alien.mesh) {
                  sceneRef.current.remove(alien.mesh)
                  alien.mesh.geometry?.dispose()
                  alien.mesh.material?.dispose()
                }
              }
            })

            // Remove bullet
            if (bullet.mesh && sceneRef.current) {
              sceneRef.current.remove(bullet.mesh)
              bullet.mesh.geometry?.dispose()
              bullet.mesh.material?.dispose()
            }
            if (bullet.glowMesh && sceneRef.current) {
              sceneRef.current.remove(bullet.glowMesh)
              bullet.glowMesh.geometry?.dispose()
              bullet.glowMesh.material?.dispose()
            }
            state.bullets.splice(bi, 1)

            // Score: 10 points per alien
            onScoreUpdate(10)
          }
        }
      })
    })

    // Alien bullets vs player
    state.alienBullets.forEach((bullet, bi) => {
      if (state.player) {
        const dx = bullet.x - state.player.x
        const dy = bullet.y - state.player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 0.7) {
          // Hit player!
          createExplosion(state.player.x, state.player.y, 0xff0000)
          
          // Remove bullet
          if (bullet.mesh && sceneRef.current) {
            sceneRef.current.remove(bullet.mesh)
            bullet.mesh.geometry?.dispose()
            bullet.mesh.material?.dispose()
          }
          if (bullet.glowMesh && sceneRef.current) {
            sceneRef.current.remove(bullet.glowMesh)
            bullet.glowMesh.geometry?.dispose()
            bullet.glowMesh.material?.dispose()
          }
          state.alienBullets.splice(bi, 1)

          const newLives = livesRef.current - 1
          onLivesUpdate(newLives)
          
          // Player doesn't reset position, just flashes
          if (newLives > 0) {
            gsap.to(state.player.mesh.material, {
              opacity: 0.3,
              duration: 0.1,
              yoyo: true,
              repeat: 5,
              ease: 'power2.inOut',
              onComplete: () => {
                state.player.mesh.material.opacity = 1
              }
            })
          }
        }
      }
    })
  }

  const render = () => {
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }

  // Reinitialize game when level changes
  useEffect(() => {
    if (sceneRef.current && !gameOver && gameStateRef.current.initialized) {
      levelCompleteRef.current = false
      setTimeout(() => {
        initGame()
      }, 100)
    }
  }, [level])

  return <div ref={mountRef} className="game-canvas" />
}

export default GameCanvas
