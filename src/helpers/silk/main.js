(() => {
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
            this.initial = initial;
            this.initialCalibrationValue = calibrationValue;

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
            this.target = this._clamp(
                value * this.sensitivity - this.calibrationValue,
            );
            return this;
        }

        setCurrent(value) {
            this.raw_current = value;
            this.raw_target = value;

            this.current = this._clamp(
                value * this.sensitivity - this.calibrationValue,
            );
            this.target = this.current;
            return this;
        }

        setCalibrationValue(value) {
            this.calibrationValue = value;
            this.current = this._clamp(
                this.raw_current * this.sensitivity - this.calibrationValue,
            );
            this.target = this._clamp(
                this.raw_target * this.sensitivity - this.calibrationValue,
            );
            return this;
        }

        /**
         * Calibrates the current raw position to be the new 0 baseline.
         * @param {number} [rawValue=this.raw_target] - Raw value to calibrate against (defaults to current target input).
         */
        calibrate(rawValue = this.raw_target) {
            this.calibrationValue = rawValue * this.sensitivity;
            this.raw_current = rawValue;
            this.raw_target = rawValue;
            this.current = 0;
            this.target = 0;
            return this;
        }

        /**
         * Resets everything back to initial values.
         * @param {number} [initial=this.initial] - Optional starting value to reset to.
         */
        reset(initial = this.initial) {
            this.calibrationValue = this.initialCalibrationValue;
            this.setCurrent(initial);
            this.setTarget(initial);
            return this;
        }

        setEnabled(value) {
            this.enabled = value;
            return this;
        }

        update() {
            if (!this.enabled) {
                return this.defaultValue;
            }

            const diff = this.target - this.current;
            const dist = Math.abs(diff);

            if (dist <= this.radius) {
                // Keep raw_current in sync even when within deadzone
                this.raw_current = (this.current + this.calibrationValue) / (this.sensitivity || 1);
                return this.current;
            }

            const pull = diff - Math.sign(diff) * this.radius;

            const dt = window.gameDeltaTime || 0;
            const t = 1 - Math.exp(-this.speed * dt);

            this.current += pull * t;
            this.current = this._clamp(this.current);

            // Update raw_current to match the smoothed current value
            this.raw_current = (this.current + this.calibrationValue) / (this.sensitivity || 1);

            return this.current;
        }

        get = () => {
            if (!this.enabled) return this.defaultValue;
            return this.current + this.defaultValue;
        };
    };
})();