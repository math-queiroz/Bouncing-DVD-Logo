const reqAnimFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame;
class Util {
  static isOutOfBounds(x, min, max) {
    return (x - min) * (x - max) >= 0;
  }
  static gcd(a, b) {
    a = a < 0 ? -a : a;
    b = b < 0 ? -b : b;
    if (b > a) {
      let temp = a;
      a = b;
      b = temp;
    }
    while (true) {
      a %= b;
      if (a == 0) return b;
      b %= a;
      if (b == 0) return a;
    }
    return b;
  }
  static lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  }
}

const Corners = {
  TL: 0,
  TR: 1,
  BL: 2,
  BR: 3
}
class DVDBouncer {
  constructor(canvas, options = {x:0, y:0, vx:1, vy:1, w:90, h:50, W:540, H:300}) {
    this.x = options.x;
    this.y = options.y;

    this.vx = options.vx;
    this.vy = options.vy;
    this.w = options.w;
    this.h = options.h;
    this.W = options.W;
    this.H = options.H;
    this.W0 = this.W - this.w;
    this.H0 = this.H - this.h;

    this.logo = document.getElementById("logo");
    this.colorArr = ["#F5BFD2","#E5DB9C","#D0BCAC","#BEB4C5","#E6A57E"];
    this.logoColorIndex = 4;

    this.canvas = canvas;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.context = canvas.getContext("2d");
    
    this.cellSize = Util.gcd(this.W0, this.H0);
    
    this.fps = 50;
    this.fpsInterval = 1000 / this.fps;
    this.now = 0;
    this.then = 0;
    this.elapsed = 0;

    this.framesPerCicle = this.W0 * this.H0 / this.cellSize;
    this.frameCount = 0;
    this.timerUpdateCountdown = 0;
    this.onTimerUpdate = new Function();
  }

  setOnTimerUpdate(cb) {
  	this.onTimerUpdate = cb.bind(this);
  }

  
  getHitCorners() {
    if (!this.willHitTheCorner()) return [-1, -1];
    let det = [(Util.lcm(this.W0, this.H0) / this.H0) % 2 == 0, (Util.lcm(this.W0, this.H0) / this.W0) % 2 == 0];
    if ((Math.abs(this.x - this.y) / Util.gcd(this.W0, this.H0)) % 2 == 0)
    return [Corners.TL, det[0] ? Corners.TR : det[1] ? Corners.BL : Corners.BR];
    else
    return [Corners.BR, !det[0] ? Corners.BL : !det[1] ? Corners.TL : Corners.TR];
  }
  
  willHitTheCorner() {
    return Math.abs(this.x - this.y) % this.cellSize == 0;
  }

  randomizeColorIndex() {
    this.logoColorIndex = (Math.floor(Math.random() * (this.colorArr.length - 1)) + 1 + this.logoColorIndex) % this.colorArr.length;
  }

  calculateRemainingTime() {
    if (this.frameCount >= this.framesPerCicle) this.frameCount %= this.framesPerCicle;
    this.onTimerUpdate(Math.trunc((this.framesPerCicle - this.frameCount) * this.fpsInterval / 1000));
  }

  play() {
    this.then = performance.now();
    this.startTime = this.then;
    this.animate();
  }

  animate() {
    reqAnimFrame(this.animate.bind(this));

    this.now = performance.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);

      // TO-DO: Ajust position for when the speed is greater than 1px
      this.x += this.vx;
      this.y += this.vy;
      if (Util.isOutOfBounds(this.x, 0, this.W0)) {
        this.vx = -this.vx;
        this.randomizeColorIndex();
      }
      if (Util.isOutOfBounds(this.y, 0, this.H0)) {
        this.vy = -this.vy;
        this.randomizeColorIndex();
      }

      this.draw(this.colorArr[this.logoColorIndex]);
      if (this.frameCount++ % this.fps === 0)
        this.calculateRemainingTime();
    }
  }

  draw(colorHex) {
    this.context.globalCompositeOperation = "source-over";
    this.context.fillStyle = colorHex;
    this.context.fillRect(0, 0, this.W, this.H);
    this.context.globalCompositeOperation = "destination-in";
    this.context.drawImage(logo, this.x, this.y, this.w, this.h);
  }
}

var dvd;
window.addEventListener("DOMContentLoaded", () => {
  dvd = new DVDBouncer(document.getElementById("dvd-canvas"));
  dvd.play();
  dvd.setOnTimerUpdate(timeToHit =>
    document.getElementById("timer").innerHTML = (timeToHit >= 0) ?
    'Faltam ' + timeToHit + ' segundos para bater no canto' :
    'Nunca vai bater num canto...'
  );
});