
const fpsDisplay = document.createElement('div');
fpsDisplay.style.position = 'fixed';
fpsDisplay.style.top = '85px';
fpsDisplay.style.right = '10px';
fpsDisplay.style.padding = '5px 10px';
fpsDisplay.style.backgroundColor = 'rgba(0,0,0,0.75)';
fpsDisplay.style.color = 'white';
fpsDisplay.style.fontSize = '14px';
fpsDisplay.style.fontFamily = "'Courier New', monospace";
fpsDisplay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)'
fpsDisplay.style.zIndex = '9999';
fpsDisplay.style.borderRadius = '8px'
fpsDisplay.style.cursor = "pointer";
fpsDisplay.style.userSelect = "none";
fpsDisplay.style.opacity = "1";
fpsDisplay.style.transition = "opacity 0.3s";
fpsDisplay.addEventListener('click', () => {
    fpsDisplay.style.opacity = fpsDisplay.style.opacity === "1" ? "0" : "1";
});
document.body.appendChild(fpsDisplay);

let lastTime = performance.now();
let frameCount = 0;

function updateFPS() {
    const now = performance.now();
    frameCount++;
    const delta = now - lastTime;

    if (delta >= 1000) {
        const fps = (frameCount / delta) * 1000;
        fpsDisplay.textContent = `FPS: ${fps.toFixed(2)}`;
        lastTime = now;
        frameCount = 0;
    }

    requestAnimationFrame(updateFPS);
}

updateFPS();