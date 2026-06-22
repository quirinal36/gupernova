(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.scroll-progress');
  const menuButton = document.querySelector('.menu-button');
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateScrollState = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress?.style.setProperty('--scroll', `${Math.min(100, Math.max(0, ratio * 100))}%`);

    let current = sections[0]?.id;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120) current = section.id;
    }
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  };

  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState);

  menuButton?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.forEach((link) => link.addEventListener('click', () => {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((target) => observer.observe(target));
    setTimeout(() => revealTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) target.classList.add('is-visible');
    }), 300);
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  if (!prefersReduced) {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1100px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });

    const magneticItems = document.querySelectorAll('.magnetic');
    magneticItems.forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        item.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });
      item.addEventListener('pointerleave', () => { item.style.transform = ''; });
    });
  }

  const canvas = document.getElementById('hero-canvas');
  if (!canvas || prefersReduced) return;

  const context = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let particles = [];
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(90, Math.max(38, Math.floor(width / 18)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.26,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.8 + 0.7,
      phase: Math.random() * Math.PI * 2,
      index
    }));
  };

  const draw = () => {
    frame += 0.008;
    context.clearRect(0, 0, width, height);
    const grad = context.createRadialGradient(width * 0.68 + pointerX * 18, height * 0.36 + pointerY * 18, 0, width * 0.68, height * 0.36, Math.max(width, height) * 0.7);
    grad.addColorStop(0, 'rgba(0,113,227,0.20)');
    grad.addColorStop(0.45, 'rgba(0,113,227,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = grad;
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx + Math.sin(frame + p.phase) * 0.07;
      p.y += p.vy + Math.cos(frame + p.phase) * 0.05;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      context.beginPath();
      context.arc(p.x + pointerX * 10, p.y + pointerY * 10, p.r, 0, Math.PI * 2);
      context.fillStyle = `rgba(130,190,255,${0.22 + Math.sin(frame * 2 + p.phase) * 0.08})`;
      context.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 118) {
          context.beginPath();
          context.moveTo(p.x, p.y);
          context.lineTo(q.x, q.y);
          context.strokeStyle = `rgba(41,151,255,${(1 - dist / 118) * 0.11})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5);
    pointerY = (event.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  resize();
  draw();
})();
