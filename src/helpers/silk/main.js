(() => {
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

  window.Silk = class {
    constructor(
      initial = 0,
      { speed = 10, deadzone = 0.0001, min = -Infinity, max = Infinity, enabled = true, defaultValue = initial } = {},
    ) {
      this.current = initial;
      this.target = initial;

      this.speed = speed;
      this.deadzone = deadzone;
      this.min = min;
      this.max = max;
      this.enabled = enabled;
      this.defaultValue = defaultValue;
    }

    setTarget(value) {
      this.target = Math.min(this.max, Math.max(this.min, value));
    }

    setCurrent(value) {
      this.current = Math.min(this.max, Math.max(this.min, value));
    }

    setEnabled(value) {
      this.enabled = value;
    }

    update(dt) {
      if (!this.enabled) {
        this.current = this.defaultValue;
        return this.current;
      }

      const diff = this.target - this.current;

      if (Math.abs(diff) < this.deadzone) {
        this.current = this.target;
        return this.current;
      }

      const t = 1 - Math.exp(-this.speed * dt);
      this.current += diff * t;

      return this.current;
    }

    get() {
      if (!this.enabled) return this.defaultValue;
      return this.current;
    }
  };
})();
