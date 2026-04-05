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
      {
        speed = 10,
        radius = 0.05,       // The "circle" — input must pull this far from current before output moves
        min = -Infinity,
        max = Infinity,
        enabled = true,
        sensitivity = 100,
        calibrationValue = 0,
        defaultValue = initial,
      } = {},
    ) {
      this.current = initial;
      this.target = initial;

      this.speed = speed;
      this.radius = radius;
      this.min = min;
      this.max = max;
      this.enabled = enabled;
      this.sensitivity = sensitivity;
      this.calibrationValue = calibrationValue;
      this.defaultValue = defaultValue;
    }

    setTarget(value) {
      this.target = Math.min(this.max, Math.max(this.min, value * this.sensitivity)) - this.calibrationValue;
    }

    setCurrent(value) {
      this.current = Math.min(this.max, Math.max(this.min, value * this.sensitivity)) - this.calibrationValue;
      this.target = this.current; // drag anchor follows too
    }

    setEnabled(value) {
      this.enabled = value;
    }

    calibrate() {
        this.calibrationValue = this.get() + this.calibrationValue
    }

    update(dt) {
      if (!this.enabled) {
        this.current = this.defaultValue;
        return this.current;
      }

      const diff = this.target - this.current;
      const dist = Math.abs(diff);

      // Only move if input has been dragged outside the radius
      if (dist <= this.radius) {
        return this.current; // anchor holds, output stays put
      }

      // Chase the point on the edge of the radius toward the target,
      // so the output smoothly follows but never "jumps" to catch up fully
      const pull = diff - Math.sign(diff) * this.radius;
      const t = 1 - Math.exp(-this.speed * dt);
      this.current += pull * t;
      this.current = Math.min(this.max, Math.max(this.min, this.current));

      return this.current;
    }

    get() {
      if (!this.enabled) return this.defaultValue;
      return this.current;
    }
  };
})();