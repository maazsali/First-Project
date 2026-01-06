// ========================================
// AUDIO SYSTEM
// Handles all sound effects using Web Audio API
// ========================================

// Create audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Base function to play a sound
 * @param {number} frequency - Sound frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
 * @param {number} volume - Volume level (0-1)
 */
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = volume;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

/**
 * Play jump sound effect
 */
function playJumpSound() {
    playSound(400, 0.1, 'square', 0.2);
}

/**
 * Play crescent moon collection sound
 */
function playCollectSound() {
    playSound(800, 0.1, 'sine', 0.25);
    setTimeout(() => playSound(1000, 0.1, 'sine', 0.25), 50);
}

/**
 * Play coffee power-up sound
 */
function playCoffeeSound() {
    playSound(600, 0.15, 'triangle', 0.25);
}

/**
 * Play laptop power-up sound (different from coffee)
 */
function playLaptopSound() {
    playSound(1200, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playSound(1400, 0.15, 'sawtooth', 0.2), 100);
}

/**
 * Play Jasmine collection sound (special)
 */
function playJasmineSound() {
    playSound(1000, 0.15, 'sine', 0.3);
    setTimeout(() => playSound(1200, 0.15, 'sine', 0.3), 100);
    setTimeout(() => playSound(1400, 0.2, 'sine', 0.3), 200);
}

/**
 * Play crash/collision sound
 */
function playCrashSound() {
    playSound(100, 0.3, 'sawtooth', 0.3);
}

/**
 * Play victory fanfare when reaching office
 */
function playVictorySound() {
    playSound(523, 0.2, 'sine', 0.25);
    setTimeout(() => playSound(659, 0.2, 'sine', 0.25), 200);
    setTimeout(() => playSound(784, 0.3, 'sine', 0.25), 400);
}

/**
 * Play overtime mode activation sound
 */
function playOvertimeSound() {
    playSound(300, 0.2, 'square', 0.3);
    setTimeout(() => playSound(250, 0.2, 'square', 0.3), 200);
    setTimeout(() => playSound(200, 0.3, 'square', 0.3), 400);
}