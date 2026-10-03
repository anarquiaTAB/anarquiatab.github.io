class FuzzEngine {
    constructor(config) {
        this.config = config;
        this.seed = config.seed;
        this.iterations = config.iterations;
        this.timeout = config.timeout;
        this.level = config.level;
        this.rng = this._createRNG(this.seed);
        this.history = [];
        this.currentOpIndex = 0;
    }

    _createRNG(seed) {
        let t = seed;
        return function() {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ t >>> 15, 1 | t);
            r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
            return ((r ^ r >>> 14) >>> 0) / 4294967296;
        };
    }

    nextInt(min, max) {
        return Math.floor(this.rng() * (max - min + 1)) + min;
    }

    nextFloat() {
        return this.rng();
    }

    choose(array) {
        return array[this.nextInt(0, array.length - 1)];
    }

    generateOperation() {
        const opType = this.nextInt(0, 9);
        const size = this.nextInt(8, 1024);
        const offset = this.nextInt(0, 16);
        
        const ops = {
            0: () => ({ type: 'create_arraybuffer', size, desc: `new ArrayBuffer(${size})` }),
            1: () => ({ type: 'create_typedarray', size, view: this.choose(['Uint8Array', 'Int32Array', 'Float64Array']), desc: `new ${this.choose(['Uint8Array', 'Int32Array', 'Float64Array'])}(${size})` }),
            2:
