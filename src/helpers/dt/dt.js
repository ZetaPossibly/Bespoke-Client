let lastTime;
window.gameDeltaTime = 0;
geofs.api.viewer.clock.onTick.addEventListener((clock) => {
    const currentTime = Cesium.JulianDate.toDate(clock.currentTime).getTime();

    if (lastTime === undefined) {
        lastTime = currentTime;
        return;
    }

    window.gameDeltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
});
