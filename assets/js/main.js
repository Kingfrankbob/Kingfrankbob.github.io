const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
const fireworkGravity = 0.16;
document
  .querySelectorAll("#funContainer .circle")
  .forEach((circle) => circle.remove());
const fireworkSettingsKey = "michaels-site-fireworks";
const defaultFireworkSettings = {
  enabled: true,
  launchRate: 2,
  burstSize: 50,
  trails: true,
  colorMode: "rainbow",
};

let fireworkSettings = { ...defaultFireworkSettings };
let fireworks = [];
let isFunPage = false;
let hasCleared = false;

try {
  fireworkSettings = {
    ...defaultFireworkSettings,
    ...JSON.parse(localStorage.getItem(fireworkSettingsKey) || "{}"),
  };
} catch {
  localStorage.removeItem(fireworkSettingsKey);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getAccentHue() {
  const accent = getComputedStyle(document.body)
    .getPropertyValue("--refresh-accent")
    .trim();
  const match = accent.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return randomBetween(0, 360);

  let hex = match[1];
  if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1");
  const red = parseInt(hex.slice(0, 2), 16) / 255;
  const green = parseInt(hex.slice(2, 4), 16) / 255;
  const blue = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return Math.round(hue * 60 + (hue < 0 ? 360 : 0));
}

function launchFirework() {
  const hue =
    fireworkSettings.colorMode === "accent"
      ? getAccentHue()
      : randomBetween(0, 360);
  const ascent = randomBetween(canvas.height * 0.55, canvas.height * 0.98);
  fireworks.push({
    type: "rocket",
    x: randomBetween(0, canvas.width),
    y: canvas.height,
    velocityX: randomBetween(-1.5, 1.5),
    velocityY: -Math.sqrt(2 * fireworkGravity * ascent),
    hue,
  });
}

function burstFirework(rocket) {
  const particleCount =
    Number(fireworkSettings.burstSize) || defaultFireworkSettings.burstSize;
  for (let index = 0; index < particleCount; index += 1) {
    const angle =
      (Math.PI * 2 * index) / particleCount + randomBetween(-0.08, 0.08);
    const speed = randomBetween(1, 4.5);
    fireworks.push({
      type: "particle",
      x: rocket.x,
      y: rocket.y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      hue: (rocket.hue + randomBetween(-18, 18) + 360) % 360,
      life: randomBetween(35, 75),
      maxLife: 75,
      size: randomBetween(1, 2.3),
    });
  }
}

function updateFireworks() {
  requestAnimationFrame(updateFireworks);
  const funPage = document.getElementById("funpage");
  isFunPage = Boolean(funPage && funPage.classList.contains("is-active"));

  if (!isFunPage || !fireworkSettings.enabled) {
    if (!hasCleared) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      fireworks = [];
      hasCleared = true;
    }
    return;
  }

  hasCleared = false;
  if (fireworkSettings.trails) {
    context.fillStyle = "rgba(8, 10, 11, 0.18)";
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  for (let index = fireworks.length - 1; index >= 0; index -= 1) {
    const particle = fireworks[index];
    if (particle.type === "rocket") {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += fireworkGravity;

      if (particle.velocityY >= 0) {
        fireworks.splice(index, 1);
        burstFirework(particle);
        continue;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      context.fillStyle = `hsl(${particle.hue} 100% 75%)`;
      context.fill();
      continue;
    }

    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.velocityX *= 0.985;
    particle.velocityY = particle.velocityY * 0.985 + 0.035;
    particle.life -= 1;

    if (particle.life <= 0) {
      fireworks.splice(index, 1);
      continue;
    }

    context.globalAlpha = particle.life / particle.maxLife;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = `hsl(${particle.hue} 100% 70%)`;
    context.fill();
  }
  context.globalAlpha = 1;

  const launchesPerSecond = Math.min(
    Math.max(Number(fireworkSettings.launchRate) || 0, 0),
    10,
  );
  if (Math.random() < launchesPerSecond / 60) {
    launchFirework();
  }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

window.addEventListener("site-settings-updated", (event) => {
  fireworkSettings = { ...defaultFireworkSettings, ...event.detail };
  if (!fireworkSettings.enabled) {
    fireworks = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    hasCleared = true;
  }
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
updateFireworks();

function showMissionMessage() {
  const messageBox = document.createElement("div");
  messageBox.textContent =
    "!!! WARNING: Not managed, not updated or not checked due to serving a Mission, check my FB Profile. !!!";
  messageBox.className = "mission-message";
  document.body.appendChild(messageBox);
  window.setTimeout(() => messageBox.remove(), 10000);
}
