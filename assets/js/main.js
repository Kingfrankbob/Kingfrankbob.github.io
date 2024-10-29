const coords = { x: 0, y: 0 };
let isFunPage = false;

// let total = document.getElementById("clicks").innerHTML;
let circles = document.querySelectorAll(".circle");
let infiniteLoop = false;
var mouseX = 0,
  mouseY = 0;
var xp = 0,
  yp = 0;
const colors = [
  "#325c2a",
  "#2f712d",
  "#2f8839",
  "#2fa04c",
  "#2eba65",
  "#2dd485",
  "#3adea8",
  "#4ae8c9",
  "#5af0e7",
  "#6cebf6",
  "#7fe0fb",
  "#94d9ff",
];

circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener("mousemove", function (e) {
  coords.x = e.clientX;
  coords.y = e.clientY;
});

function moveCircle() {
  var container = document.getElementById("funContainer");
  var containerWidth = container.clientWidth / 2;
  var containerHeight = container.clientHeight / 2;
  var time = Date.now() / 100;
  yp =
    mouseY +
    containerHeight +
    Math.sin(time) * 2 * 50 +
    Math.sin(time * 2) * 20;
  xp =
    mouseX +
    containerWidth +
    Math.cos(time * 0.5) * 4 * 50 +
    Math.cos(time * 1.5) * 20;
  requestAnimationFrame(moveCircle);
}

// moveCircle();

function animateCircles() {
  let x = coords.x;
  let y = coords.y;
  // checkFunPage();

  circles.forEach(function (circle, index) {
    // var time = Date.now() / 1000;

    // xp += mouseX;
    // yp += mouseY;

    // circle.style.transform = `translate(${xp}px, ${yp}px)`;

    // requestAnimationFrame(animateCircles);
    circle.style.left = x - 12 + "px";
    circle.style.top = y - 12 + "px";
    circle.style.scale = (circles.length - index) / circles.length;
    circle.x = x;
    circle.y = y;
    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;
  });

  requestAnimationFrame(animateCircles);
}

var timer;
var timeout = function () {
  infiniteLoop = true;
};

timer = setTimeout(timeout, 100);
window.onmousemove = function (event) {
  var subtracter = window.innerWitdh / 4;
  mouseX = event.clientX - window.innerWidth / 2; // - subtracter;
  mouseY = event.clientY - window.innerHeight / 2;
  clearTimeout(timer);
  infiniteLoop = false;
  timer = setTimeout(timeout, 100);
};
moveCircle();

animateCircles();
/*







*/

canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
cx = ctx.canvas.width / 2;
cy = ctx.canvas.height / 2;

let confetti = [];
const confettiCount = 300;
const gravity = 0.5;
const terminalVelocity = 5;
const drag = 0.075;
const colorss = [
  { front: "red", back: "darkred" },
  { front: "green", back: "darkgreen" },
  { front: "blue", back: "darkblue" },
  { front: "yellow", back: "darkyellow" },
  { front: "orange", back: "darkorange" },
  { front: "pink", back: "darkpink" },
  { front: "purple", back: "darkpurple" },
  { front: "turquoise", back: "darkturquoise" },
];

//-----------Functions--------------
resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cx = ctx.canvas.width / 2;
  cy = ctx.canvas.height / 2;
};

randomRange = (min, max) => Math.random() * (max - min) + min;

initConfetti = () => {
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      color: colorss[Math.floor(randomRange(0, colorss.length))],
      dimensions: {
        x: randomRange(10, 20),
        y: randomRange(10, 30),
      },

      position: {
        x: randomRange(0, canvas.width),
        y: canvas.height - 1,
      },

      rotation: randomRange(0, 2 * Math.PI),
      scale: {
        x: 1,
        y: 1,
      },

      velocity: {
        x: randomRange(-25, 25),
        y: randomRange(0, -50),
      },
    });
  }
};

//---------Render-----------
render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confetti.forEach((confetto, index) => {
    let width = confetto.dimensions.x * confetto.scale.x;
    let height = confetto.dimensions.y * confetto.scale.y;

    // Move canvas to position and rotate
    ctx.translate(confetto.position.x, confetto.position.y);
    ctx.rotate(confetto.rotation);

    // Apply forces to velocity
    confetto.velocity.x -= confetto.velocity.x * drag;
    confetto.velocity.y = Math.min(
      confetto.velocity.y + gravity,
      terminalVelocity
    );
    confetto.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();

    // Set position
    confetto.position.x += confetto.velocity.x;
    confetto.position.y += confetto.velocity.y;

    // Delete confetti when out of frame
    if (confetto.position.y >= canvas.height) confetti.splice(index, 1);

    // Loop confetto x position
    if (confetto.position.x > canvas.width) confetto.position.x = 0;
    if (confetto.position.x < 0) confetto.position.x = canvas.width;

    // Spin confetto by scaling y
    confetto.scale.y = Math.cos(confetto.position.y * 0.1);
    ctx.fillStyle =
      confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

    // Draw confetti
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // Reset transform matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  // Fire off another round of confetti
  if (confetti.length <= 10) initConfetti();

  window.requestAnimationFrame(render);
};

//---------Execution--------
// initConfetti();
render();

//----------Resize----------
window.addEventListener("resize", function () {
  resizeCanvas();
});

//------------Click------------
window.addEventListener("click", function () {
  initConfetti();
});

var clicks = 0;

function onClick() {
  clicks += 1;
  document.getElementById("clicks").innerHTML = clicks;
}

var canvas = document.getElementById("myCanvas");

var c = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var gravv = 0.16;

var colorrs = ["#EBB66A", "#FDD33F", "#6A9965", "#965491", "#EBEBEB"];

var firework = [];

c.fillStyle = "black";
c.fillRect(0, 0, window.innerWidth, window.innerHeight);

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function Firework(x, y, explode, hue) {
  this.x = x;
  this.y = y;
  this.speedx = getRandom(-5, 5);
  this.speedy = -Math.random() * 15;
  this.radius = 1;
  this.explode = explode;
  this.explodeSpeed = getRandom(-6, 3);
  this.hue = hue;
  this.brightness = getRandom(50, 80);
  this.alpha = getRandom(60, 100) / 100;
  this.life = getRandom(10, 20);
  this.color =
    "hsla(" +
    this.hue +
    ", 100%, " +
    this.brightness +
    "%, " +
    this.alpha +
    ")";

  colorrs[Math.floor(Math.random() * colorrs.length)];
  this.draw = function () {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  };
  this.update = function () {
    if (!this.explode) this.y += this.speedy;
    this.speedy += gravv;

    if (this.explode) {
      this.x += this.speedx;
      this.y += this.explodeSpeed;
      this.explodeSpeed += gravv;

      this.life--;

      if (this.life < 0 && explode) {
        const index = firework.indexOf(this);
        if (index != -1) {
          firework.splice(index, 1);
        }
      }
    }

    if (this.speedy >= 0) {
      const index = firework.indexOf(this);
      if (index != -1) {
        firework.splice(index, 1);

        if (!this.explode)
          for (var i = 0; i < 100; i++) {
            firework.push(new Firework(this.x, this.y, true, this.hue));
          }
      }
    }

    this.draw();
  };
}

for (var i = 0; i < 1; i++) {
  var x = Math.random() * window.innerWidth;
  var y = 400;
  firework.push(new Firework(x, y, false));
}
let hasCleared = false;
function animate() {
  checkFunPage();
  requestAnimationFrame(animate);
  if (isFunPage === false) {
    if (hasCleared === false) {
      c.clearRect(0, 0, canvas.width, canvas.height);
      hasCleared = true;
      // console.log;
      firework = [];
      for (var i = 0; i < 1; i++) {
        var x = Math.random() * window.innerWidth;
        var y = 400;
        firework.push(new Firework(x, y, false));
      }
    }
    return;
  }
  c.fillStyle = "rgba(0,0,0,0.2)";
  c.fillRect(0, 0, window.innerWidth, window.innerHeight);

  for (var i = 0; i < firework.length; i++) firework[i].update();

  if (Math.random() > 0.55) {
    var x = Math.random() * window.innerWidth;
    var y = innerHeight - 20;
    var hue = getRandom(0, 360);
    firework.push(new Firework(x, y, false, hue));
  }
  hasCleared = false;
}
animate();

function checkFunPage() {
  const funPageItem = document.getElementById("funpage");
  isFunPage = funPageItem.classList.contains("is-active");
}

/*
Some of this code was found on github, some generated from chat GPT, no gurantees where its from...
 If I used your code please reach out to me so I can credit you. 

*/

function showMissionMessage() {
  const messageBox = document.createElement("div");
  messageBox.textContent =
    "!!! WARNING: Not managed, not updated or not checked due to serving a Mission, check my FB Profile. !!!";

  messageBox.style.position = "fixed";
  messageBox.style.top = "0";
  messageBox.style.left = "0";
  messageBox.style.width = "100%";
  messageBox.style.padding = "15px";
  messageBox.style.backgroundColor = "#FFD700";
  messageBox.style.color = "#333";
  messageBox.style.fontSize = "18px";
  messageBox.style.textAlign = "center";
  messageBox.style.zIndex = "1000";

  document.body.appendChild(messageBox);

  setTimeout(() => {
    messageBox.remove();
  }, 10000);
}

function showPersistentMissionMessage() {
  const messageBox = document.createElement("div");
  messageBox.textContent =
    "Currently serving a Church of Jesus Christ of Latter-Day Saints Mission in Phoenix, Arizona until EOY 2026!";

  const link = document.createElement("a");
  link.href =
    "https://www.churchofjesuschrist.org/callings/missionary?lang=eng";
  link.textContent = " Learn More!";
  link.style.color = "#007BFF";
  link.style.textDecoration = "underline";
  link.target = "_blank";

  messageBox.style.position = "fixed";
  messageBox.style.top = "10px";
  messageBox.style.left = "50%";
  messageBox.style.transform = "translateX(-50%)";
  messageBox.style.padding = "10px 20px";
  messageBox.style.backgroundColor = "#FFFAE5";
  messageBox.style.color = "#444";
  messageBox.style.fontSize = "12px";
  messageBox.style.border = "1px solid #DDD";
  messageBox.style.borderRadius = "5px";
  messageBox.style.zIndex = "1000";

  messageBox.style.display = "flex";
  messageBox.style.flexDirection = "column";
  messageBox.style.alignItems = "center";
  messageBox.style.justifyContent = "center";

  messageBox.appendChild(document.createElement("br"));
  messageBox.appendChild(link);

  document.body.appendChild(messageBox);
}

showPersistentMissionMessage();
