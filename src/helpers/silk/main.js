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
        speedBoost = 2,      // Extra speed multiplier scaled by distance
        radius = 0.05,
        exponent = 1.5,      // Non-linear scaling: >1 = slow near edge, fast far
        gain = 1.0,          // Overall pull strength multiplier
        min = -Infinity,
        max = Infinity,
        enabled = true,
        defaultValue = initial,
      } = {},
    ) {
      this.current = initial;
      this.target = initial;

      this.speed = speed;
      this.speedBoost = speedBoost;
      this.radius = radius;
      this.exponent = exponent;
      this.gain = gain;
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
      this.target = this.current;
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
      const dist = Math.abs(diff);

      // Soft deadzone: no movement inside the radius
      if (dist <= this.radius) {
        return this.current;
      }

      const norm = dist - this.radius;
      const scaled = Math.pow(norm, this.exponent);
      const pull = Math.sign(diff) * scaled * this.gain;

      // Adaptive speed: base speed + distance-scaled boost
      const adaptiveSpeed = this.speed + this.speedBoost * dist;
      const t = 1 - Math.exp(-adaptiveSpeed * dt);

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