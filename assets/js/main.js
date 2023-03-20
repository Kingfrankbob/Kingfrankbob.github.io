const coords = { x: 0, y: 0 };

let total = document.getElementById("clicks").innerHTML;
let circles = document.querySelectorAll(".circle");
let infiniteLoop = false;
const colors = [
    "#325c2a", "#2f712d", "#2f8839", "#2fa04c", "#2eba65", "#2dd485", "#3adea8", "#4ae8c9", "#5af0e7", "#6cebf6", "#7fe0fb", "#94d9ff"
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

function animateCircles() {

    // let xYxD = circles.pop();
    


    let x = coords.x;
    let y = coords.y;
    if(!infiniteLoop){
        circles.forEach(function (circle, index) {
            circle.style.left = x - 12 + "px";
            circle.style.top = y - 12 + "px";

            circle.style.scale = (circles.length - index) / circles.length;

            circle.x = x;
            circle.y = y;

            const nextCircle = circles[index + 1] || circles[0];
            x += (nextCircle.x - x) * 0.3;
            y += (nextCircle.y - y) * 0.3;
        });
    }
    requestAnimationFrame(animateCircles);
}

var timer;
var timeout = function () {
    infiniteLoop = true;
}
timer = setTimeout(timeout, 100);
window.onmousemove = function() {
    clearTimeout(timer);
    infiniteLoop = false;
    timer = setTimeout(timeout, 100);
};

animateCircles();












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
    { front: 'red', back: 'darkred' },
    { front: 'green', back: 'darkgreen' },
    { front: 'blue', back: 'darkblue' },
    { front: 'yellow', back: 'darkyellow' },
    { front: 'orange', back: 'darkorange' },
    { front: 'pink', back: 'darkpink' },
    { front: 'purple', back: 'darkpurple' },
    { front: 'turquoise', back: 'darkturquoise' }];


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
                y: randomRange(10, 30)
            },

            position: {
                x: randomRange(0, canvas.width),
                y: canvas.height - 1
            },

            rotation: randomRange(0, 2 * Math.PI),
            scale: {
                x: 1,
                y: 1
            },

            velocity: {
                x: randomRange(-25, 25),
                y: randomRange(0, -50)
            }
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
        confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
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
        ctx.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

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
window.addEventListener('resize', function () {
    resizeCanvas();
});

//------------Click------------
window.addEventListener('click', function () {
    initConfetti();
});

var clicks = 0;

function onClick() {
    clicks += 1;
    document.getElementById("clicks").innerHTML = clicks;
};


