(function () {
    let fpsDisplay = null;

    function createFPSDisplay() {
        if (fpsDisplay) return;

        fpsDisplay = document.createElement("div");
        fpsDisplay.style.cssText = `
        position: fixed;
        top: 85px;
        right: 10px;
        padding: 5px 10px;
        background-color: rgba(0,0,0,0.75);
        color: white;
        font-size: 14px;
        font-family: 'Courier New', monospace;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        z-index: 9999;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        opacity: 1;
        transition: opacity 0.3s;
    `;

        fpsDisplay.addEventListener("click", () => {
            fpsDisplay.style.opacity =
                fpsDisplay.style.opacity === "1" ? "0" : "1";
        });

        document.body.appendChild(fpsDisplay);

        frameCount = 0;
        rafId = requestAnimationFrame(updateFPS);
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let rafId = null;

    function updateFPS() {
        const now = performance.now();
        frameCount++;
        const delta = now - lastTime;

        if (delta >= 1000) {
            const fps = (frameCount / delta) * 1000;
            fpsDisplay
                ? (fpsDisplay.textContent = `FPS: ${fps.toFixed(2)}`)
                : null;
            lastTime = now;
            frameCount = 0;
        }

        rafId = requestAnimationFrame(updateFPS);
    }

    function destroyFPSDisplay() {
        if (fpsDisplay) {
            fpsDisplay.remove();
            fpsDisplay = null;
        }
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
})();
