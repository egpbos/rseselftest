// The RSE Self-Test — vanilla JS, no dependencies.

const QUESTIONS = [
  { id: 'codes', text: "Do you code or program for your research?" },
  {
    id: 'majority',
    text: "Does the majority of your work involve coding?",
    requires: (a) => a.codes === true,
  },
  {
    id: 'others',
    text: "Do other researchers depend on (or reuse) the software you build?",
    requires: (a) => a.codes === true,
  },
  {
    id: 'rseJob',
    text: "Have you ever had a job as an RSE — or with that title in your contract?",
    requires: (a) => a.codes === true,
  },
];

const TIERS = [
  { label: "RSE", article: "an" },
  { label: "Senior RSE", article: "a" },
  { label: "Ultra-Elite RSE", article: "an" },
];

let state;

function reset() {
  state = { answers: {}, step: 0 };
}

const $ = (id) => document.getElementById(id);

function activeQuestions() {
  return QUESTIONS.filter((q) => !q.requires || q.requires(state.answers));
}

function currentQuestion() {
  return activeQuestions()[state.step] || null;
}

function showScreen(name) {
  ["intro", "question", "result"].forEach((s) =>
    $(s).classList.toggle("active", s === name)
  );
}

function renderQuestion() {
  const q = currentQuestion();
  if (!q) return finish();

  $("qText").textContent = q.text;
  const total = QUESTIONS.length;
  $("qCount").textContent = `Question ${state.step + 1} of ${total}`;
  $("progressBar").style.width = `${(state.step / total) * 100}%`;
  showScreen("question");
}

function onAnswer(value) {
  const q = currentQuestion();
  if (!q) return;
  state.answers[q.id] = value === "yes";
  state.step++;
  renderQuestion();
}

function computeResult() {
  const a = state.answers;

  if (a.codes !== true) {
    return {
      eyebrow: "Your result",
      title: "Not an RSE… yet",
      msg: "You're not quite there — but the moment you write code to answer a research question, that's RSEing. You're closer than you think.",
      confetti: false,
    };
  }

  let tier = TIERS[0]; // base
  if (a.others === true) tier = TIERS[2]; // ultra-elite
  else if (a.majority === true) tier = TIERS[1]; // senior

  const nobodyToldYou = a.rseJob !== true;
  const title =
    `Congratulations, you're ${tier.article} ${tier.label}` +
    (nobodyToldYou ? " — and nobody told you!" : "!");

  const msg = nobodyToldYou
    ? "You've been doing Research Software Engineering all along — you just never had the title. If you want to grow into it, or make it your career, there's a whole community out there ready to help."
    : "Officially one of us. If you want to level up further, the RSE world has plenty of paths — and people who'll point you the right way.";

  return { eyebrow: "Your result", title, msg, confetti: true };
}

function finish() {
  const r = computeResult();
  $("resultEyebrow").textContent = r.eyebrow;
  $("resultTitle").textContent = r.title;
  $("resultMsg").textContent = r.msg;
  showScreen("result");
  if (r.confetti) launchConfetti();
}

// --- Confetti -------------------------------------------------------------

function launchConfetti() {
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = [
    "#4f46e5", "#7c3aed", "#ec4899", "#f59e0b",
    "#10b981", "#38bdf8", "#ef4444",
  ];
  const particles = [];

  function burst(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 9;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 5,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
      });
    }
  }

  burst(w / 2, h * 0.42, 90);
  burst(w * 0.22, h * 0.5, 60);
  burst(w * 0.78, h * 0.5, 60);

  let frame = 0;
  const maxFrames = 420; // ~7s at 60fps

  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 0.28; // gravity
      p.vx *= 0.992; // air drag
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      if (p.y > h + 40) particles.splice(i, 1);
    }
    frame++;
    if (particles.length && frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  tick();
}

// --- Wiring ---------------------------------------------------------------

function init() {
  reset();
  $("startBtn").addEventListener("click", () => {
    state.step = 0;
    renderQuestion();
  });
  document.querySelectorAll(".answers .btn").forEach((btn) => {
    btn.addEventListener("click", () => onAnswer(btn.dataset.answer));
  });
  $("restartBtn").addEventListener("click", () => {
    reset();
    showScreen("intro");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
