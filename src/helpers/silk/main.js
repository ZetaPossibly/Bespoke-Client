(() => {
  let lastTime = performance.now();

  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const now = performance.now();
    window.gameDeltaTime = (now - lastTime) * 0.001;
    lastTime = now;
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
      return Math.min(this.max, Math.max(this.min, value * this.sensitivity));
    }

    setTarget(value) {
      this.raw_target = value;
      this.target = this._clamp(value) - this.calibrationValue;
    }

    setCurrent(value) {
      this.raw_current = value;
      this.raw_target = value;

      this.current = this._clamp(value) - this.calibrationValue;
      this.target = this.current;
    }

    setEnabled(value) {
      this.enabled = value;
    }

    calibrate = () => {
      this.calibrationValue = this.get() + this.calibrationValue;
    };

    update() {
      if (!this.enabled) return this.defaultValue;

      const diff = this.target - this.current;

      if (Math.abs(diff) <= this.radius) {
        return this.current;
      }

      this.current += (diff - Math.sign(diff) * this.radius) * (1 - Math.exp(-this.speed * window.gameDeltaTime));

      return this.current;
    }

    get = () => {
      if (!this.enabled) return this.defaultValue;
      return this.current;
    };
  };
})();
