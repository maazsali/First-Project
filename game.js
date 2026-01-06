// ========================================
// GAME LOGIC
// Main game mechanics and state management
// ========================================

// ========================================
// DOM ELEMENTS
// ========================================
const player = document.getElementById('player');
const gameContainer = document.getElementById('gameContainer');
const ground = document.getElementById('ground');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const officeBuilding = document.getElementById('officeBuilding');

// ========================================
// GAME STATE VARIABLES
// ========================================
let isJumping = false;
let gameRunning = false;
let lives = 0;
let moons = 0;
let coffeeCount = 0;
let laptopCount = 0;
let gameTime = 0;
let currentStage = 1; // 1 = street, 2 = subway, 3 = street
let reachedOffice = false;
let jumpsAtOffice = 0;
let overtimeMode = false;
let obstacleSpeed = 3000;
let spawnRate = 2000;

// Interval references
let obstacleInterval;
let collectibleInterval;
let timerInterval;

// Power-up state
let powerUpActive = false;
let invulnerable = false;

// Track Jasmine spawns (one per stage)
let jasmineSpawned = {
    stage1: false,
    stage2: false,
    stage3: false
};

// ========================================
// UI UPDATE FUNCTIONS
// ========================================

/**
 * Update all display counters
 */
function updateDisplay() {
    document.getElementById('moons').textContent = moons;
    document.getElementById('coffee').textContent = coffeeCount;
    document.getElementById('laptops').textContent = laptopCount;
    document.getElementById('lives').textContent = lives;
    document.getElementById('timer').textContent = gameTime;
}

/**
 * Show stage transition indicator
 */
function showStageIndicator(text) {
    const indicator = document.createElement('div');
    indicator.className = 'stage-indicator';
    indicator.textContent = text;
    gameContainer.appendChild(indicator);
    setTimeout(() => indicator.remove(), 2000);
}

// ========================================
// PLAYER CONTROLS
// ========================================

/**
 * Make the player jump
 */
function jump() {
    if (!gameRunning) return;

    // Handle jumps at office for overtime activation
    if (reachedOffice && !overtimeMode) {
        jumpsAtOffice++;
        if (jumpsAtOffice >= 2) {
            startOvertimeMode();
        }
        return;
    }

    if (isJumping) return;
    
    isJumping = true;
    playJumpSound();
    player.style.bottom = '280px';
    
    setTimeout(() => {
        player.style.bottom = '140px';
        isJumping = false;
    }, 600);
}

// Event listeners for controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

gameContainer.addEventListener('click', () => {
    if (gameRunning || reachedOffice) {
        jump();
    }
});

// ========================================
// STAGE MANAGEMENT
// ========================================

/**
 * Change the game stage (street or subway)
 * @param {number} stage - Stage number (1, 2, or 3)
 */
function changeStage(stage) {
    currentStage = stage;
    
    // Get all background elements
    const clouds = [
        document.getElementById('cloud1'),
        document.getElementById('cloud2'),
        document.getElementById('cloud3')
    ];
    const buildings = [
        document.getElementById('building1'),
        document.getElementById('building2'),
        document.getElementById('building3')
    ];
    const subwayLights = [
        document.getElementById('subwayLight1'),
        document.getElementById('subwayLight2'),
        document.getElementById('subwayLight3')
    ];
    const trainWindows = [
        document.getElementById('trainWindow1'),
        document.getElementById('trainWindow2')
    ];

    if (stage === 2) {
        // SUBWAY STAGE
        gameContainer.classList.add('subway');
        ground.classList.add('subway');
        clouds.forEach(cloud => cloud.style.display = 'none');
        buildings.forEach(building => building.style.display = 'none');
        subwayLights.forEach(light => light.style.display = 'block');
        trainWindows.forEach(window => window.style.display = 'block');
        showStageIndicator('🚇 ENTERING SUBWAY');
    } else {
        // STREET STAGES
        gameContainer.classList.remove('subway');
        ground.classList.remove('subway');
        clouds.forEach(cloud => cloud.style.display = 'block');
        buildings.forEach(building => building.style.display = 'block');
        subwayLights.forEach(light => light.style.display = 'none');
        trainWindows.forEach(window => window.style.display = 'none');
        if (stage === 3) {
            showStageIndicator('🌇 BACK TO STREETS');
        }
    }
}

// ========================================
// OFFICE ARRIVAL & OVERTIME MODE
// ========================================

/**
 * Handle reaching the office at 90 seconds
 */
function reachOffice() {
    reachedOffice = true;
    gameRunning = false;
    clearInterval(obstacleInterval);
    clearInterval(collectibleInterval);
    
    officeBuilding.classList.add('show');
    setTimeout(() => {
        document.querySelector('.flag').classList.add('raised');
        playVictorySound();
    }, 500);

    setTimeout(() => {
        showStageIndicator('Press JUMP twice for OVERTIME MODE!');
    }, 1500);
}

/**
 * Start overtime (endless) mode
 */
function startOvertimeMode() {
    overtimeMode = true;
    gameRunning = true;
    reachedOffice = false;
    jumpsAtOffice = 0;
    officeBuilding.classList.remove('show');
    
    // Show overtime banner
    const banner = document.createElement('div');
    banner.className = 'overtime-banner';
    banner.textContent = 'OVERTIME!';
    gameContainer.appendChild(banner);
    playOvertimeSound();
    
    setTimeout(() => banner.remove(), 3000);

    // Reset speeds for overtime
    obstacleSpeed = 2000;
    spawnRate = 1500;
    startSpawning();

    // Gradually increase difficulty every 5 seconds
    const difficultyInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(difficultyInterval);
            return;
        }
        obstacleSpeed = Math.max(800, obstacleSpeed - 100);
        spawnRate = Math.max(800, spawnRate - 100);
        clearInterval(obstacleInterval);
        clearInterval(collectibleInterval);
        startSpawning();
    }, 5000);
}

// ========================================
// OBSTACLE SPAWNING & COLLISION
// ========================================

/**
 * Spawn an obstacle
 */
function spawnObstacle() {
    if (!gameRunning) return;

    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    obstacle.setAttribute('data-obstacle', 'true');
    
    const obstacles = ['🚧', '🛑', '⚠️', '🚨'];
    obstacle.textContent = obstacles[Math.floor(Math.random() * obstacles.length)];
    obstacle.style.animationDuration = (obstacleSpeed / 1000) + 's';
    
    gameContainer.appendChild(obstacle);

    // Check for collisions
    const checkCollision = setInterval(() => {
        if ((!gameRunning && !overtimeMode) || !obstacle.parentElement) {
            clearInterval(checkCollision);
            return;
        }

        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        // Collision detection with 10px buffer for forgiveness
        const buffer = 10;
        if (
            playerRect.left + buffer < obstacleRect.right &&
            playerRect.right - buffer > obstacleRect.left &&
            playerRect.bottom - buffer > obstacleRect.top &&
            playerRect.top + buffer < obstacleRect.bottom
        ) {
            if (!invulnerable) {
                hitObstacle();
            }
            clearInterval(checkCollision);
            obstacle.remove();
        }

        // Remove obstacle when off screen
        if (obstacleRect.right < -100) {
            clearInterval(checkCollision);
            obstacle.remove();
        }
    }, 10);
}

/**
 * Handle hitting an obstacle
 */
function hitObstacle() {
    playCrashSound();
    
    if (lives > 0) {
        // Lose a life but keep playing
        lives--;
        updateDisplay();
        invulnerable = true;
        player.style.opacity = '0.5';
        
        setTimeout(() => {
            invulnerable = false;
            player.style.opacity = '1';
        }, 1500);
    } else {
        // Game over
        endGame(overtimeMode);
    }
}

// ========================================
// COLLECTIBLE SPAWNING & COLLECTION
// ========================================

/**
 * Spawn a collectible (moon, coffee, laptop, or Jasmine)
 */
function spawnCollectible() {
    if (!gameRunning) return;

    const collectible = document.createElement('div');
    collectible.className = 'collectible';
    collectible.setAttribute('data-collectible', 'true');
    
    const rand = Math.random();
    let type;

    // Check if we should spawn Jasmine for this stage
    const shouldSpawnJasmine = 
        (currentStage === 1 && !jasmineSpawned.stage1 && rand < 0.15) ||
        (currentStage === 2 && !jasmineSpawned.stage2 && rand < 0.15) ||
        (currentStage === 3 && !jasmineSpawned.stage3 && rand < 0.15);

    if (shouldSpawnJasmine) {
        type = 'jasmine';
        collectible.textContent = '👰';
        if (currentStage === 1) jasmineSpawned.stage1 = true;
        if (currentStage === 2) jasmineSpawned.stage2 = true;
        if (currentStage === 3) jasmineSpawned.stage3 = true;
    } else if (rand < 0.5) {
        type = 'moon';
        collectible.textContent = '🌙';
        collectible.classList.add('moon');
    } else if (rand < 0.75) {
        type = 'coffee';
        collectible.textContent = '☕';
    } else {
        type = 'laptop';
        collectible.textContent = '💻';
    }

    collectible.dataset.type = type;
    collectible.style.animationDuration = (obstacleSpeed / 1000) + 's';
    collectible.style.bottom = (Math.random() * 100 + 180) + 'px';
    
    gameContainer.appendChild(collectible);

    // Check for collection
    const checkCollection = setInterval(() => {
        if ((!gameRunning && !overtimeMode) || !collectible.parentElement) {
            clearInterval(checkCollection);
            return;
        }

        const playerRect = player.getBoundingClientRect();
        const collectibleRect = collectible.getBoundingClientRect();

        if (
            playerRect.left < collectibleRect.right &&
            playerRect.right > collectibleRect.left &&
            playerRect.bottom > collectibleRect.top &&
            playerRect.top < collectibleRect.bottom
        ) {
            collectItem(type);
            clearInterval(checkCollection);
            collectible.remove();
        }

        // Remove collectible when off screen
        if (collectibleRect.right < -100) {
            clearInterval(checkCollection);
            collectible.remove();
        }
    }, 10);
}

/**
 * Handle collecting an item
 * @param {string} type - Type of item (moon, coffee, laptop, jasmine)
 */
function collectItem(type) {
    if (type === 'moon') {
        moons++;
        playCollectSound();
    } else if (type === 'coffee') {
        coffeeCount++;
        playCoffeeSound();
        activatePowerUp();
    } else if (type === 'laptop') {
        laptopCount++;
        playLaptopSound();
        activatePowerUp();
        player.classList.add('glowing');
        setTimeout(() => player.classList.remove('glowing'), 3000);
    } else if (type === 'jasmine') {
        lives++;
        playJasmineSound();
    }
    updateDisplay();
}

/**
 * Activate power-up (speed boost)
 */
function activatePowerUp() {
    if (powerUpActive) return;
    powerUpActive = true;
    
    const originalSpeed = obstacleSpeed;
    obstacleSpeed = obstacleSpeed * 0.6;
    
    setTimeout(() => {
        obstacleSpeed = originalSpeed;
        powerUpActive = false;
    }, 3000);
}

// ========================================
// SPAWN MANAGEMENT
// ========================================

/**
 * Start spawning obstacles and collectibles
 */
function startSpawning() {
    obstacleInterval = setInterval(spawnObstacle, spawnRate);
    collectibleInterval = setInterval(spawnCollectible, spawnRate + 500);
}

// ========================================
// GAME FLOW CONTROL
// ========================================

/**
 * Start the game
 */
function startGame() {
    startScreen.classList.add('hidden');
    gameRunning = true;
    
    // Reset all variables
    lives = 0;
    moons = 0;
    coffeeCount = 0;
    laptopCount = 0;
    gameTime = 0;
    currentStage = 1;
    reachedOffice = false;
    jumpsAtOffice = 0;
    overtimeMode = false;
    obstacleSpeed = 3000;
    spawnRate = 2000;
    invulnerable = false;
    
    jasmineSpawned = {
        stage1: false,
        stage2: false,
        stage3: false
    };

    updateDisplay();
    changeStage(1);
    startSpawning();

    // Start timer
    timerInterval = setInterval(() => {
        gameTime++;
        updateDisplay();

        // Stage transitions at specific times
        if (gameTime === 30 && currentStage === 1) {
            changeStage(2); // Enter subway
        } else if (gameTime === 60 && currentStage === 2) {
            changeStage(3); // Back to street
        } else if (gameTime === 90 && !reachedOffice) {
            clearInterval(timerInterval);
            reachOffice(); // Reach office
        }
    }, 1000);
}

/**
 * End the game and show results
 * @param {boolean} wasOvertime - Whether game ended in overtime mode
 */
function endGame(wasOvertime) {
    gameRunning = false;
    overtimeMode = false;
    clearInterval(obstacleInterval);
    clearInterval(collectibleInterval);
    clearInterval(timerInterval);

    // Update final stats
    document.getElementById('finalMoons').textContent = moons;
    document.getElementById('finalCoffee').textContent = coffeeCount;
    document.getElementById('finalLaptops').textContent = laptopCount;
    document.getElementById('finalTime').textContent = gameTime;

    // Set appropriate end message
    if (wasOvertime) {
        document.getElementById('endTitle').textContent = '💥 Overtime Ended!';
        document.getElementById('endMessage').textContent = 'Amazing effort in overtime, Ammar!';
    } else {
        document.getElementById('endTitle').textContent = '🎯 Mission Complete!';
        document.getElementById('endMessage').textContent = 'Congratulations on reaching Anthesis!';
    }

    gameOverScreen.classList.remove('hidden');
}

/**
 * Restart the game
 */
function restartGame() {
    gameOverScreen.classList.add('hidden');
    officeBuilding.classList.remove('show');
    document.querySelector('.flag').classList.remove('raised');
    
    // Remove any existing obstacles and collectibles
    document.querySelectorAll('.obstacle, .collectible').forEach(el => el.remove());
    
    startGame();
}