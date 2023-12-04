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
  TL: "top left",
  TR: "top right",
  BL: "bottom left",
  BR: "bottom right" 
}
class DVDBouncer {
  constructor(canvas, w, h, options = {x:0, y:0, vx:1, vy:1, W:540, H:300}) {
    this.x = 0;
    this.y = 0;

    this.vx = options.vx;
    this.vy = options.vy;
    this.w = w;
    this.h = h;
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
    
    this.hitParity = 1;
    this.corners = this.getHitCorners();

    this.fps = 50;
    this.fpsInterval = 1000 / this.fps;
    this.now = 0;
    this.then = 0;
    this.elapsed = 0;

    this.framesPerCicle = this.W0 * this.H0 / this.cellSize;
    this.frameCount = 0;
    this.timerUpdateCountdown = 0;
    this.onTimerUpdate = new Function();

    this.animFrameRequest;
  }

  stop() {
    cancelAnimationFrame(this.animFrameRequest);
  }

  setOnTimerUpdate(cb) {
  	this.onTimerUpdate = cb.bind(this);
  }
  
  getHitCorners() {
    if (!this.willHitTheCorner()) return null;
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
    if (this.frameCount >= this.framesPerCicle) {
      this.hitParity = 1 - this.hitParity;
      this.frameCount %= this.framesPerCicle;
    }
    this.onTimerUpdate(((this.framesPerCicle - this.frameCount) * this.fpsInterval / 1000).toFixed(1));
  }

  play() {
    this.then = performance.now();
    this.startTime = this.then;
    this.animate();
  }

  animate() {
    this.animFrameRequest = reqAnimFrame(this.animate.bind(this));

    this.now = performance.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);

      this.x += this.vx;
      this.y += this.vy;

      let overflowX = Util.isOutOfBounds(this.x, 0, this.W0);
      let overflowY = Util.isOutOfBounds(this.y, 0, this.H0);

      if (overflowX || overflowY) {
        this.randomizeColorIndex();
        if (overflowX) this.vx = -this.vx;
        if (overflowY) this.vy = -this.vy;
      }

      this.draw(this.colorArr[this.logoColorIndex]);
      if (this.frameCount++ % (this.fps/10) === 0)
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

function instantiateBouncer(w = 110, h = 50) {
  dvd = new DVDBouncer(document.getElementById("dvd-canvas"), w, h);
  dvd.play();
  dvd.randomizeColorIndex();
  dvd.setOnTimerUpdate(timeToHit =>
    document.getElementById("timer").innerHTML = (timeToHit >= 0) ?
    'Will hit the ' + dvd.corners[dvd.hitParity] + ' corner in ' + timeToHit + 's' :
    'Will never hit a corner'
  );
}

function widthChanged(v) { dvd.stop(); instantiateBouncer(v, dvd.h) }
function heightChanged(v) { dvd.stop(); instantiateBouncer(dvd.w, v) }
window.addEventListener("DOMContentLoaded", () => instantiateBouncer());
