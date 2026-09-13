// The RSE Self-Test — vanilla JS, no dependencies.

const QUESTIONS = [
  { id: 'codes', text: "Do you code or program for your research?" },
  {
    id: 'depends',
    text: "Does your research depend on software or code written by others?",
    requires: (a) => a.codes !== true,
  },
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
  { phrase: "RSEing" },
  { phrase: "an RSE" },
  { phrase: "an Ultra-Elite RSE" },
  { phrase: "a Lone Linchpin RSE" },
];

const RESOURCES = {
  peers: "https://researchsoftware.org/",
  turingWay: "https://book.the-turing-way.org/",
  rsqKit: "https://everse.software/RSQKit/",
  funding: "https://www.researchsoft.org/resource/funding-opportunities/",
  irsc: "https://www.researchsoft.org/irsc/",
  carpentries: "https://carpentries.org/community/get-involved/",
  nlRse: "https://nl-rse.org/groups",
};

const LOCALE = (() => {
  const m = location.pathname.match(/\/([a-z]{2})\/?$/);
  return m && m[1] === "nl" ? "nl" : "en";
})();

const NL_FUNDING = [
  { url: "https://www.esciencecenter.nl/", label: "Research software expertise & services: Netherlands eScience Center (esciencecenter.nl)" },
  { url: "https://www.openscience.nl/", label: "Open science & software funding: Open Science NL (openscience.nl)" },
  { url: "https://www.tdcc.nl/", label: "Thematic digital competence centres: TDCC (tdcc.nl)" },
];

function localizeLinks(next) {
  if (LOCALE !== "nl") return next;
  const swapped = next.links.flatMap((l) => {
    if (l.url === RESOURCES.funding) return NL_FUNDING;
    if (l.url === RESOURCES.peers) {
      return [{
        url: "https://nl-rse.org/groups",
        label: l.label.replace("researchsoftware.org", "nl-rse.org/groups"),
      }];
    }
    if (l.url === RESOURCES.irsc) {
      return [{ url: "https://nl-rse.org/groups", label: "Meet the NL-RSE community (nl-rse.org/groups)" }];
    }
    return [l];
  });
  const seen = new Set();
  const links = swapped.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
  return { ...next, links };
}

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
  const active = activeQuestions().length;
  $("qCount").textContent = `Question ${state.step + 1}`;
  $("progressBar").style.width = `${(state.step / active) * 100}%`;
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
    if (a.depends === true) {
      return {
        eyebrow: "Your result",
        title: "Time to get an RSE on your side",
        msg: "Your research depends on code — but writing and maintaining it doesn't have to be your job. RSEs exist exactly for this.",
        confetti: false,
        next: {
          text: "Find an RSE near you — and the funding to make it happen:",
          links: [
            { url: RESOURCES.funding, label: "See RSE support & funding (researchsoft.org)" },
          ],
        },
      };
    }

    return {
      eyebrow: "Your result",
      title: "Not an RSE… yet",
      msg: "You're closer than you think — the moment you write code to answer a research question, that's RSEing.",
      confetti: false,
      next: {
        text: "Start small: automate one annoying task in your own workflow — or find out what an RSE can open up for research that isn't digital yet:",
        links: [
          { url: "https://carpentries.org/", label: "Start coding with a workshop: The Carpentries" },
          { url: RESOURCES.funding, label: "What RSEs are & what they can unlock (researchsoft.org)" },
        ],
      },
    };
  }

  let tier = TIERS[0]; // base
  if (a.others === true) {
    tier = a.majority === true ? TIERS[2] : TIERS[3]; // ultra-elite vs lone linchpin
  } else if (a.majority === true) {
    tier = TIERS[1]; // senior
  }

  const nobodyToldYou = a.rseJob !== true;
  const title =
    `Congratulations, you're ${tier.phrase}` +
    (nobodyToldYou ? " — and nobody told you!" : "!");

  if (a.others === true) {
    const isLoneLinchpin = a.majority === true ? false : true;
    const msg = isLoneLinchpin
      ? "Fellow researchers depend on the software you build — even though it's not your main job. You're carrying their science forward, and it doesn't have to rest on one person alone."
      : "Other researchers' science runs on the software you build — you're quietly helping them forward. Thank you for that! It may feel invisible, but the people you support feel it.";
    let next;
    if (isLoneLinchpin) {
      next = {
        text: "Soften the fragility two ways: get help when you can't do it all yourself, and make your software robust enough to outlive any single hero, including you:",
        links: [
          { url: RESOURCES.funding, label: "Funding to get extra help (researchsoft.org)" },
          { url: RESOURCES.turingWay, label: "Robust & sustainable software: The Turing Way" },
          { url: RESOURCES.rsqKit, label: "Quality & best practices: EVERSE RSQKit" },
        ],
      };
    } else if (nobodyToldYou) {
      next = {
        text: "Did you know you can increase your visibility and impact — and that this could even be your full-time job? Some ideas:",
        links: [
          { url: "https://github.com/", label: "Make it open source on GitHub" },
          { url: "https://research-software-directory.org/", label: "List it in a research software directory" },
          { url: "https://zenodo.org/", label: "Make it citable on Zenodo" },
          { url: RESOURCES.nlRse, label: "Make RSEing your full-time job: NL-RSE groups (nl-rse.org/groups)" },
          { url: RESOURCES.funding, label: "Sick of doing it all yourself? Get advice — or funding for an RSE (researchsoft.org)" },
        ],
      };
    } else {
      next = {
        text: "Did you know you can increase your visibility and impact? A few easy wins:",
        links: [
          { url: "https://github.com/", label: "Make it open source on GitHub" },
          { url: "https://research-software-directory.org/", label: "List it in a research software directory" },
          { url: "https://zenodo.org/", label: "Make it citable on Zenodo" },
        ],
      };
    }
    return { eyebrow: "Your result", title, msg, confetti: true, next };
  }

  if (nobodyToldYou) {
    if (a.majority === true) {
      return {
        eyebrow: "Your result",
        title,
        msg: "Research software engineering is a big part of what you do — maybe the biggest. A great way to keep growing is by sharing what you know.",
        confetti: true,
        next: {
          text: "Give a talk close to home — your institute, a research software meetup, or a conference — teach the people on their way up, or take the leap and make RSEing your full-time job:",
          links: [
            { url: RESOURCES.peers, label: "Find a research software meetup: researchsoftware.org" },
            { url: RESOURCES.irsc, label: "Submit a talk at IRSC, the research software conference" },
            { url: RESOURCES.carpentries, label: "Contribute to training: The Carpentries" },
            { url: RESOURCES.nlRse, label: "Make RSEing your full-time job: NL-RSE groups (nl-rse.org/groups)" },
            { url: RESOURCES.funding, label: "Sick of doing it all yourself? Get advice — or funding for an RSE (researchsoft.org)" },
          ],
        },
      };
    }

    return {
      eyebrow: "Your result",
      title,
      msg: "You code to answer research questions — that's RSEing, even if it never made it into your job title. If you're looking to level up or to outsource, here are some RSE best practices and ways to find RSE support.",
      confetti: true,
      next: {
        text: "Now talk to your peers, keep getting better — and remember you don't have to do it all alone:",
        links: [
          { url: RESOURCES.peers, label: "Connect with peers: researchsoftware.org" },
          { url: RESOURCES.turingWay, label: "Practical guides to get better: The Turing Way" },
          { url: "https://everse.software/RSQKit/researcher_who_codes", label: "RSE best practices for researchers who code: EVERSE RSQKit" },
          { url: RESOURCES.funding, label: "Sick of doing it all yourself? Get advice — or funding for an RSE (researchsoft.org)" },
        ],
      },
    };
  }

  if (a.majority === true) {
    return {
      eyebrow: "Your result",
      title,
      msg: "Officially one of us! The most rewarding thing about being this good with software is helping your fellow researchers get there too. Pull others in and help the academic community find its way to research software.",
      confetti: true,
      next: {
        text: "Mentor someone fumbling their first serious script, help the wider academic community plug into the RSE world, and keep building the field:",
        links: [
          { url: RESOURCES.peers, label: "Find peers & would-be mentees: researchsoftware.org" },
          { url: RESOURCES.irsc, label: "Give a talk at IRSC, the research software conference" },
          { url: RESOURCES.carpentries, label: "Train the next generation: The Carpentries" },
        ],
      },
    };
  }

  return {
    eyebrow: "Your result",
    title,
    msg: "Officially one of us.",
    confetti: true,
    next: {
      text: "Find likeminded people — in your area, or internationally:",
      links: [
        { url: RESOURCES.peers, label: "Find your community (researchsoftware.org)" },
      ],
    },
  };
}

function populateNext(n) {
  $("nextText").textContent = n.text;
  const list = $("nextLinks");
  list.innerHTML = "";
  n.links.forEach((l) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = l.label;
    li.appendChild(a);
    list.appendChild(li);
  });
}

function finish() {
  const r = computeResult();
  $("resultEyebrow").textContent = r.eyebrow;
  $("resultTitle").textContent = r.title;
  $("resultMsg").textContent = r.msg;
  populateNext(localizeLinks(r.next));
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
