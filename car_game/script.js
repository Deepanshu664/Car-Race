// Main menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const musicBtn = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicIcon = musicBtn.querySelector('i');
    const playButton = document.getElementById('playButton');
    let isMuted = false;

    // Initialize music state
    backgroundMusic.volume = 0.5;

    // Handle play button click
    if (playButton) {
        playButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default action
            
            try {
                // Save current music state before navigation
                localStorage.setItem('isMuted', isMuted);
                localStorage.setItem('musicTime', backgroundMusic.currentTime);
                
                // Simple navigation to game.html
                window.location.href = 'game.html';
            } catch (error) {
                console.error('Navigation error:', error);
                alert('Unable to start the game. Please try again.');
            }
        });
    }

    // Music control functionality
    musicBtn.addEventListener('click', () => {
        if (isMuted) {
            backgroundMusic.play();
            musicIcon.className = 'fas fa-volume-up';
            musicBtn.classList.remove('muted');
        } else {
            backgroundMusic.pause();
            musicIcon.className = 'fas fa-volume-mute';
            musicBtn.classList.add('muted');
        }
        isMuted = !isMuted;
    });

    // Start playing music when user interacts with the page
    document.addEventListener('click', () => {
        if (!isMuted && backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.log("Audio playback failed:", error);
            });
        }
    }, { once: true });

    // Update high score display
    const scoreButton = document.querySelector('.score');
    const highScore = localStorage.getItem('highScore') || 0;
    scoreButton.textContent = `SCORE: ${highScore}`;
});
