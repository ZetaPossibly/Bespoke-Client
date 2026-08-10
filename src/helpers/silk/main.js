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
        radius = 0.05,
        min = -Infinity,
        max = Infinity,
        enabled = true,
        sensitivity = 100,
        calibrationValue = 0,
        defaultValue = initial,
      } = {},
    ) {
      this.speed = speed;
      this.radius = radius;
      this.min = min;
      this.max = max;
      this.enabled = enabled;
      this.sensitivity = sensitivity;
      this.calibrationValue = calibrationValue;
      this.defaultValue = defaultValue;

      this.raw_current = initial;
      this.raw_target = initial;
      this.current = 0;
      this.target = 0;

      this.setCurrent(initial);
      this.setTarget(initial);
    }

    _clamp(value) {
      return Math.min(this.max, Math.max(this.min, value));
    }

    setTarget(value) {
      this.raw_target = value;
      this.target = this._clamp(value * this.sensitivity - this.calibrationValue);
    }

    setCurrent(value) {
      this.raw_current = value;
      this.raw_target = value;

      this.current = this._clamp(value * this.sensitivity - this.calibrationValue);
      this.target = this.current;
    }

    setCalibrationValue(value) {
      this.calibrationValue = value;
      this.current = this._clamp(this.raw_current * this.sensitivity - this.calibrationValue);
      this.target = this._clamp(this.raw_target * this.sensitivity - this.calibrationValue);
    }

    setEnabled(value) {
      this.enabled = value;
    }

    update() {
      if (!this.enabled) {
        return this.defaultValue;
      }

      const diff = this.target - this.current;
      const dist = Math.abs(diff);

      if (dist <= this.radius) {
        return this.current;
      }

      const pull = diff - Math.sign(diff) * this.radius;

      const dt = window.gameDeltaTime || 0;
      const t = 1 - Math.exp(-this.speed * dt);

      this.current += pull * t;
      this.current = Math.min(this.max, Math.max(this.min, this.current));

      return this.current;
    }

    get = () => {
      if (!this.enabled) return this.defaultValue;
      return this.current + this.defaultValue;
    };
  };
})();
