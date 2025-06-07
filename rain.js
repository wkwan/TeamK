const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const PIXEL_SIZE = 4;
const GRAVITY = 3.0;
const MOUSE_RADIUS = 80;
const MOUSE_FORCE = 1200.0;
const DAMPING = 0.999;
const MAX_VELOCITY = 480;

let mouse = { x: 0, y: 0, down: false };
let particles = [];
let logoRect = null;
let lastTime = 0;

function updateLogoRect() {
    const logo = document.getElementById('logo');
    if (logo) {
        const rect = logo.getBoundingClientRect();
        logoRect = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    }
}

updateLogoRect();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = Math.random() * 120 + 60;
        this.size = Math.random() < 0.5 ? PIXEL_SIZE : PIXEL_SIZE * 1.5;
        this.trail = [];
        this.opacity = Math.random() * 0.3 + 0.3;
    }

    update(deltaTime) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 3) {
            this.trail.shift();
        }
        
        this.vy += GRAVITY * deltaTime;
        
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < MOUSE_RADIUS && distance > 0) {
            const force = (1 - distance / MOUSE_RADIUS) * MOUSE_FORCE * deltaTime;
            const angle = Math.atan2(dy, dx);
            
            if (mouse.down) {
                this.vx -= Math.cos(angle) * force;
                this.vy -= Math.sin(angle) * force;
            } else {
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
        }
        
        const dampingFactor = Math.pow(DAMPING, deltaTime * 60);
        this.vx *= dampingFactor;
        this.vy *= dampingFactor;
        
        this.vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.vx));
        this.vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.vy));
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Simple logo collision using circular approximation
        if (logoRect) {
            const logoCenterX = logoRect.x + logoRect.width / 2;
            const logoCenterY = logoRect.y + logoRect.height / 2;
            const logoRadius = logoRect.width / 2;
            
            const dx = this.x - logoCenterX;
            const dy = this.y - logoCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < logoRadius) {
                // Calculate normal vector
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                // Position particle at edge of circle
                this.x = logoCenterX + normalX * logoRadius;
                this.y = logoCenterY + normalY * logoRadius;
                
                // Reflect velocity
                const dot = this.vx * normalX + this.vy * normalY;
                this.vx -= 2 * dot * normalX * 0.3; // Reduce bounce
                this.vy -= 2 * dot * normalY * 0.3;
                
                // Add sliding effect
                const tangentX = -normalY;
                const tangentY = normalX;
                const slideForce = 0.2;
                this.vx += tangentX * slideForce * Math.sign(dx);
                this.vy += GRAVITY * 0.5 * deltaTime;
            }
        }
        
        if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
            this.vx = 0;
            this.vy = Math.random() * 120 + 60;
            this.trail = [];
        }
        
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
    }

    draw() {
        this.trail.forEach((point, index) => {
            ctx.globalAlpha = (this.opacity * 0.3) * (index / this.trail.length);
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(
                point.x,
                point.y,
                this.size,
                this.size
            );
        });
        
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );
        
        ctx.globalAlpha = 1.0;
    }
}

function init() {
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height - canvas.height
        ));
    }
}

function animate(currentTime) {
    const deltaTime = lastTime === 0 ? 0.016 : (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 0.1) {
        requestAnimationFrame(animate);
        return;
    }
    
    
    ctx.fillStyle = 'rgba(240, 245, 250, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update logo position every frame to handle dynamic changes
    updateLogoRect();
    
    particles.forEach(particle => {
        particle.update(deltaTime);
        particle.draw();
    });
    
    requestAnimationFrame(animate);
}

document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener('mousedown', () => {
    mouse.down = true;
});

document.addEventListener('mouseup', () => {
    mouse.down = false;
});

canvas.addEventListener('touchstart', (e) => {
    mouse.down = true;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

canvas.addEventListener('touchend', () => {
    mouse.down = false;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    init();
    updateLogoRect();
});

init();
animate();