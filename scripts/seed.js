#!/usr/bin/env node
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// ── Embedding (inline — avoids import path issues) ──────────

async function getEmbedding(text) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const baseUrl = isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
  const model = process.env.EMBEDDING_MODEL || (isOpenRouter ? 'openai/text-embedding-3-small' : 'text-embedding-3-small');

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(isOpenRouter ? { 'HTTP-Referer': 'https://carbonrouter.dev' } : {}),
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

// ── Trait derivation (same as frontend + server) ─────────────

const QUESTION_TO_TRAIT = {
  8: 'builder_visionary', 9: 'speed_quality', 10: 'risk', 11: 'chaos',
  12: 'social', 13: 'decisions', 14: 'focus', 15: 'conflict',
  16: 'learning', 17: 'exploit',
};

const LAYER2_IDS = [18, 19, 20, 21, 22, 23, 24];

function deriveTraits(answers) {
  const traits = {};
  for (const [qId, key] of Object.entries(QUESTION_TO_TRAIT)) {
    if (answers[qId] !== undefined) traits[key] = answers[qId];
  }
  return traits;
}

function buildVibeText(answers) {
  return LAYER2_IDS
    .filter(id => answers[id] && String(answers[id]).trim())
    .map(id => String(answers[id]).trim())
    .join('\n\n');
}

// ── Personas ─────────────────────────────────────────────────
// 12 distinct archetypes. Each has all 30 answers.

const PERSONAS = [
  {
    name: "Maya — The Midnight Builder",
    answers: {
      // Layer 0: Hard constraints
      1: "Fully remote — don't move me",
      2: "Full-time, all-in, burn the boats",
      3: "Flexible based on contribution",
      4: "Bootstrap then raise",
      5: "This month",
      6: "Technical skills (I build)",
      7: "Business / GTM co-founder",
      // Layer 1: Trait sliders
      8: 1, 9: 2, 10: 3, 11: 2, 12: 1, 13: 1, 14: 1, 15: 2, 16: 4, 17: 5,
      // Layer 2: Semantic vibe
      18: "I'm at my desk before dawn, headphones on, deep in a codebase I've been refactoring for three weeks. There's a terminal open with a green test suite. My co-founder is asleep in a different timezone and that's fine — we'll sync at noon.",
      19: "The mass of poorly-built developer tools that waste millions of hours. I keep thinking about how every bad CLI experience is a compounding tax on the entire industry.",
      20: "My last co-founder wanted to pivot to enterprise sales when we hadn't shipped v1 yet. Instead of fighting, I built a prototype of both paths over a weekend and let the data speak. We stayed on course.",
      21: "I can tell you the exact memory layout of V8's hidden classes and why your JavaScript object literal order matters for performance. People at parties stop asking me questions pretty quickly.",
      22: "A programming language that makes illegal states unrepresentable. Something that makes the pit of success so deep you can't climb out. Like Rust but for application development.",
      23: "Last week, 11pm to 4am, implementing a lock-free concurrent queue. I didn't notice time passing until my screen was the only light source in the room.",
      24: "Maya will mass-produce terrible coffee and mass-produce beautiful code in the same hour and she will not apologize for either. She once debugged a production outage from a canoe.",
      // Layer 3: Values
      25: "AI is a tool, not a trajectory",
      26: "Individual freedom",
      27: 2,
      28: "Failure is data",
      29: 4,
      30: "Complementary skills",
    },
  },
  {
    name: "Kai — The Chaos Visionary",
    answers: {
      1: "Anywhere on Earth",
      2: "Full-time, all-in, burn the boats",
      3: "Equal split or bust",
      4: "Raise immediately — speed matters",
      5: "This week",
      6: "Vision + leadership",
      7: "Technical co-founder",
      8: 5, 9: 1, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 4, 16: 5, 17: 1,
      18: "I'm on a plane or at a conference or in a whiteboard room with three founders I met yesterday. We're mapping out something huge — maybe a network state, maybe a new protocol. Doesn't matter. The energy in the room is electric and I'm sketching architectures on napkins.",
      19: "That we're building the future with yesterday's organizational structures. DAOs failed but the instinct was right. There's a coordination mechanism we haven't invented yet and it keeps me staring at ceilings.",
      20: "Two advisors with opposite visions for the company. Instead of choosing sides I organized a dinner, let them argue it out, and extracted the synthesis that neither could see alone. Took three bottles of wine.",
      21: "I've read every piece of writing about Venetian merchant banking and how the concept of a 'company' emerged from shared risk on trading ships. The history of coordination structures is basically the history of civilization.",
      22: "A global matching layer for human talent that makes geography irrelevant. Like, imagine if every brilliant person in a rural village could find their co-founder in São Paulo or Lagos within 48 hours.",
      23: "Giving a talk to 400 people about decentralized identity. Went completely off-script, the crowd was leaning forward, I could feel the ideas crystallizing in real-time. Someone recorded it and it's my most-viewed talk.",
      24: "Kai runs on coffee, conviction, and an alarming disregard for what's 'realistic.' He'll call you at midnight with an idea that sounds insane and by morning you'll realize he was right.",
      25: "Accelerate everything, safety emerges",
      26: "They're inseparable",
      27: 4,
      28: "I've failed enough to stop fearing it",
      29: 1,
      30: "Shared vision of the future",
    },
  },
  {
    name: "Elena — The Domain Expert",
    answers: {
      1: "My country only",
      2: "Part-time now, full-time if it works",
      3: "Flexible based on contribution",
      4: "Bootstrap then raise",
      5: "This quarter",
      6: "Domain expertise (I know the market)",
      7: "Technical co-founder",
      8: 4, 9: 4, 10: 2, 11: 2, 12: 3, 13: 2, 14: 2, 15: 2, 16: 1, 17: 4,
      18: "I'm in a hospital conference room, running a pilot with three departments. My co-founder pushed the latest update last night and the nurses are already saying it saves them twenty minutes per shift. I'm taking notes for the next iteration.",
      19: "Medication errors kill more people than car accidents and most of the software in hospitals was designed by people who've never watched a nurse do a twelve-hour shift. I have. For ten years.",
      20: "A chief medical officer who thought our pilot was a threat to his department's budget. I invited him to co-author our white paper. He became our biggest internal champion. Alignment over confrontation.",
      21: "The FDA's 510(k) clearance process for medical software. I can tell you every regulatory pathway, every predicate device precedent, every way a startup can navigate this without burning through years and millions.",
      22: "A universal patient context layer that follows a human through every healthcare interaction for their entire life. No more faxed records, no more repeated tests, no more information loss at handoffs.",
      23: "Writing a 40-page regulatory submission. Seven hours straight. I knew the material so deeply that every sentence just flowed. Submitted it at midnight and it was approved without revisions.",
      24: "Elena will quietly know more about your problem than you do and she'll let you figure that out on your own timeline. She's the kind of person who brings homemade soup when you're sick and a spreadsheet when you're confused.",
      25: "Careful acceleration with guardrails",
      26: "Collective wellbeing",
      27: 4,
      28: "I avoid failure through preparation",
      29: 4,
      30: "Trust and communication",
    },
  },
  {
    name: "Marcus — The Serial Founder",
    answers: {
      1: "Anywhere on Earth",
      2: "Full-time, all-in, burn the boats",
      3: "Flexible based on contribution",
      4: "Bootstrap then raise",
      5: "This month",
      6: "Vision + leadership",
      7: "Someone who complements my chaos",
      8: 4, 9: 2, 10: 5, 11: 4, 12: 4, 13: 3, 14: 3, 15: 5, 16: 4, 17: 3,
      18: "Third company, second continent. I'm on a call with my Series A lead while my co-founder is shipping the feature we promised for next week — this week. We have 20 people now and the chaos is organized. I know exactly which fires to let burn.",
      19: "That most founders solve the wrong problem for too long because they're emotionally attached to their first idea. I've killed two of my own companies at the right time and I'm proud of that.",
      20: "Fired a co-founder. It was the hardest thing I've ever done in business. We sat down, I was direct, I explained why, and I gave them generous terms. We're still friends. The company survived.",
      21: "I'm weirdly deep on the psychology of founder breakups. I've studied every publicly documented co-founder divorce — Apple, Facebook, Snapchat, Zipcar — and I can pattern-match what goes wrong at each stage.",
      22: "A founder school that isn't about lectures or pitch decks. It's a year-long program where you build three companies, kill two, and learn to love the execution more than the idea.",
      23: "Negotiating our last acquisition. Eight hours in a conference room. Every move was chess. I could see three moves ahead and the adrenaline was better than any extreme sport I've tried.",
      24: "Marcus has the emotional range of a human-shaped Swiss Army knife. He'll give you the hardest feedback you've ever received and somehow you'll thank him for it. Do not play poker with this man.",
      25: "Careful acceleration with guardrails",
      26: "It depends on the context",
      27: 2,
      28: "I've failed enough to stop fearing it",
      29: 2,
      30: "Raw intensity and drive",
    },
  },
  {
    name: "Priya — The Research Scientist",
    answers: {
      1: "My continent only",
      2: "Part-time now, full-time if it works",
      3: "Open to creative structures",
      4: "Bootstrap then raise",
      5: "This quarter",
      6: "Technical skills (I build)",
      7: "Business / GTM co-founder",
      8: 2, 9: 5, 10: 2, 11: 1, 12: 2, 13: 1, 14: 1, 15: 2, 16: 1, 17: 5,
      18: "I'm at my desk at the university-adjacent lab we rented, running experiments on our latest model architecture. My co-founder is on a sales call I don't want to be on. The paper we published last quarter is driving inbound. There's a whiteboard full of math I haven't erased in months.",
      19: "That the best ML research is locked in papers no one reads and the worst ML products ship to millions. The gap between what's possible and what's deployed is a crime against progress.",
      20: "My PhD advisor wanted to block my paper submission because it contradicted his earlier work. I showed him the proof, acknowledged his foundational contribution explicitly, and proposed a joint framework that extended both our results. It was published in NeurIPS.",
      21: "The statistical mechanics of opinion formation in social networks. I can model how beliefs propagate through a population using the same math that describes magnetization in iron. It's beautiful and terrifying.",
      22: "An AI system that reads every scientific paper ever written and identifies the connections that no human researcher could see. Not a chatbot — a genuine reasoning engine for science. Like Ramanujan's intuition, automated.",
      23: "Proving a convergence theorem for our new optimization algorithm. Three days of writing, rewriting, finding the gap, closing it. When the proof clicked I literally stood up and walked around the building twice.",
      24: "Priya is the person who reads the footnotes. She'll quietly revolutionize a field while everyone else is tweeting about it. She makes complex things simple and she makes simple things precise.",
      25: "Careful acceleration with guardrails",
      26: "Collective wellbeing",
      27: 3,
      28: "Failure is data",
      29: 5,
      30: "Complementary skills",
    },
  },
  {
    name: "Devon — The Creative Operator",
    answers: {
      1: "My city only",
      2: "Full-time, all-in, burn the boats",
      3: "Equal split or bust",
      4: "Bootstrap forever",
      5: "This month",
      6: "I figure it out as I go",
      7: "Technical co-founder",
      8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 4, 14: 4, 15: 3, 16: 4, 17: 3,
      18: "Working from the studio apartment I converted into an office. Sketching wireframes in the morning, user interviews at lunch, prototyping in Figma until dinner. My co-founder and I are in the same city and we grab ramen twice a week to whiteboard.",
      19: "Why every SaaS product looks the same. We've cargo-culted enterprise UX patterns from 2015 and nobody stopped to ask whether users actually think in dashboards and data tables. They don't.",
      20: "A client wanted a complete redesign two days before launch. Instead of panicking or refusing, I pulled the three highest-impact changes, mocked them up live on the call, and we shipped a hybrid that satisfied everyone.",
      21: "The history of Japanese joinery — wood construction without nails or glue. Every joint is engineered to get stronger under load. I think about software architecture the same way.",
      22: "A design tool that works the way designers actually think — spatially, emotionally, iteratively. Not boxes in boxes in boxes. Something organic that lets you sketch, prototype, and ship without switching contexts.",
      23: "Animating a microinteraction for a loading state. Tweaking bezier curves for two hours until the timing felt exactly right. It was objectively a tiny detail but it made the whole product feel alive.",
      24: "Devon sees the world in gestures and transitions. They'll redesign your entire product on a napkin and it will be better than what your team spent months on. Feeds you well, argues gently, ships relentlessly.",
      25: "AI is a tool, not a trajectory",
      26: "It depends on the context",
      27: 3,
      28: "Failure is painful but necessary",
      29: 2,
      30: "Kindness and emotional intelligence",
    },
  },
  {
    name: "Zara — The Impact Maximizer",
    answers: {
      1: "Anywhere on Earth",
      2: "Full-time, all-in, burn the boats",
      3: "Open to creative structures",
      4: "Bootstrap then raise",
      5: "This quarter",
      6: "Vision + leadership",
      7: "Technical co-founder",
      8: 4, 9: 3, 10: 4, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 3,
      18: "In a village in East Africa, watching our solar microgrid monitoring system go live. The local team we trained is running it themselves. My co-founder is optimizing the firmware remotely. We have twelve more installations this quarter.",
      19: "Two billion people without reliable electricity and a climate crisis accelerating. The solutions exist technically. The distribution, financing, and maintenance layers don't. That's the startup, right there.",
      20: "A local government partner wanted to take credit for our pilot without acknowledging the community organizers who made it possible. I restructured the partnership agreement to name every contributor and made it a condition of continuing.",
      21: "Off-grid battery chemistry. I can tell you the cycle life of every lithium iron phosphate cell on the market, the degradation curves under tropical conditions, and which Chinese manufacturers actually test what they claim.",
      22: "A decentralized energy network where every village is both producer and consumer. Not a utility — a commons. Self-governing, self-financing, self-maintaining. Like the internet, but for electrons.",
      23: "Facilitating a community design session where thirty people who'd never seen software before were sketching their ideal energy dashboard on paper. Their ideas were better than anything I'd designed in grad school.",
      24: "Zara turns moral clarity into operational plans. She'll hold you accountable to your own values without making you feel bad about it. When she says 'we can do better' she already knows how.",
      25: "Careful acceleration with guardrails",
      26: "Collective wellbeing",
      27: 5,
      28: "Failure is painful but necessary",
      29: 2,
      30: "Shared vision of the future",
    },
  },
  {
    name: "Renn — The Capital Deployer",
    answers: {
      1: "Anywhere on Earth",
      2: "Part-time now, full-time if it works",
      3: "Open to creative structures",
      4: "Already have capital to deploy",
      5: "This quarter",
      6: "Capital + network",
      7: "Technical co-founder",
      8: 4, 9: 3, 10: 4, 11: 3, 12: 5, 13: 3, 14: 3, 15: 5, 16: 2, 17: 3,
      18: "On a call from my home office, connecting a founder I backed with a distribution partner I know from my Goldman days. Afternoon: reviewing three pitch decks. Evening: dinner with a technical co-founder candidate I've been courting for months.",
      19: "The talent mismatch. I see brilliant operators stuck in corporate jobs and brilliant ideas stuck without operators. The matching problem is the bottleneck for the entire ecosystem and nobody's solving it well.",
      20: "Two portfolio companies competing for the same enterprise client. Instead of picking sides, I introduced them to each other and they found a partnership model. Sometimes the best deal is the one you don't make.",
      21: "Wine auction economics. I've spent fifteen years studying how scarcity, provenance, and reputation interact in markets with radical information asymmetry. It maps directly to startup valuation dynamics.",
      22: "A real-time talent marketplace where the matching is so good that the concept of 'job hunting' becomes obsolete. Not LinkedIn. Not a job board. A routing layer for human potential.",
      23: "Structuring a complex deal with three parties, two currencies, and a regulatory constraint nobody else saw coming. Four hours of flow, whiteboard full of diagrams, and a term sheet that made everyone feel like they won.",
      24: "Renn is the person who knows someone for everything and somehow never makes it feel transactional. He gives advice like he's sharing a secret and picks up every check without anyone noticing.",
      25: "Careful acceleration with guardrails",
      26: "It depends on the context",
      27: 2,
      28: "Failure is data",
      29: 3,
      30: "Trust and communication",
    },
  },
  {
    name: "Sasha — The Polymath Explorer",
    answers: {
      1: "Anywhere on Earth",
      2: "Evenings & weekends only",
      3: "Flexible based on contribution",
      4: "Bootstrap forever",
      5: "When it's ready",
      6: "I figure it out as I go",
      7: "Someone who complements my chaos",
      8: 3, 9: 1, 10: 4, 11: 5, 12: 3, 13: 5, 14: 5, 15: 3, 16: 5, 17: 1,
      18: "Probably somewhere I didn't plan to be. Last February I was in Taipei learning Mandarin. This February maybe I'm finishing that Rust compiler project, or the fermentation business, or the generative music thing. One of them will stick.",
      19: "That I have seventeen half-built projects and the fear that the one I abandon is the one that would've worked. The explore/exploit tradeoff is my entire personality and I can't solve it.",
      20: "A collaborator accused me of being uncommitted because I was working on three things. I showed them how the three projects shared a common technical substrate and that my 'distraction' was actually cross-pollination. They got it eventually.",
      21: "Fermentation microbiology. I can culture a sourdough starter from scratch, explain the symbiotic relationship between lactobacillus and wild yeast, and tell you why San Francisco bread tastes different at the molecular level.",
      22: "A tool that lets you fork reality — spin up parallel universes where you pursued each path and peek at the outcomes. Not a simulation. Something stranger. Maybe a collective intelligence network where everyone's partial experiments feed into everyone else's.",
      23: "Building a synthesizer from discrete analog components. No microcontroller, no software. Just resistors, capacitors, and op-amps generating sound. Eight hours vanished. My desk was covered in solder and I'd forgotten to eat.",
      24: "Sasha is a beautiful disaster of curiosity. They'll teach you something you didn't know existed and forget to eat lunch while doing it. If you need someone to finish something, look elsewhere. If you need someone to start everything, call Sasha.",
      25: "Accelerate everything, safety emerges",
      26: "Individual freedom",
      27: 3,
      28: "Failure is data",
      29: 1,
      30: "Complementary skills",
    },
  },
  {
    name: "Tomás — The Steady Architect",
    answers: {
      1: "My continent only",
      2: "Full-time, all-in, burn the boats",
      3: "Flexible based on contribution",
      4: "Bootstrap forever",
      5: "This year",
      6: "Technical skills (I build)",
      7: "Business / GTM co-founder",
      8: 2, 9: 5, 10: 2, 11: 1, 12: 2, 13: 1, 14: 1, 15: 2, 16: 1, 17: 5,
      18: "At my desk with a cup of mate, writing infrastructure code that will still be running in ten years. No meetings until afternoon. My co-founder handles the outside world. I handle the systems. This arrangement has worked for four years.",
      19: "Technical debt. Not the glamorous kind — the slow rot that kills companies over years. I've seen three startups die not from bad ideas but from codebases that became unmaintainable. It haunts me because it's preventable.",
      20: "Our team wanted to adopt a new framework because it was popular. I didn't argue against it. I built a small proof of concept in both the old and new stack, benchmarked them, documented the migration cost, and let the team decide with data.",
      21: "Roman aqueduct engineering. They built water systems that lasted two thousand years using gravity, concrete, and geometry. No pumps, no electricity, no moving parts. That's the level of infrastructure I aspire to build.",
      22: "An operating system built from first principles with formal verification. Every layer proved correct mathematically. No buffer overflows, no undefined behavior, no security vulnerabilities. Just clean, proven computation.",
      23: "Designing a database schema that had to handle fourteen different entity relationships while remaining queryable without joins. Three days of thinking, one day of writing. The schema still hasn't needed a migration in two years.",
      24: "Tomás is the quietest person in every room and the reason the room still has electricity. He builds things that don't break and friendships that don't expire. He will not rush and you will be grateful.",
      25: "Pause until alignment is solved",
      26: "Collective wellbeing",
      27: 2,
      28: "I avoid failure through preparation",
      29: 5,
      30: "Trust and communication",
    },
  },
  {
    name: "Nia — The Community Builder",
    answers: {
      1: "Anywhere on Earth",
      2: "Full-time, all-in, burn the boats",
      3: "Equal split or bust",
      4: "Bootstrap then raise",
      5: "This month",
      6: "Capital + network",
      7: "Technical co-founder",
      8: 5, 9: 2, 10: 4, 11: 4, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 2,
      18: "On a stage somewhere, or in a group chat that's moving too fast, or hosting a dinner for twelve founders who didn't know each other yesterday. My co-founder shipped a feature while I was out building the movement. We debrief over voice notes.",
      19: "Loneliness in entrepreneurship. Everyone talks about product-market fit but nobody talks about the founder who hasn't had a real conversation in weeks. Community is infrastructure and we're underinvesting in it.",
      20: "Two community members had a public falling out on our forum. Instead of moderating from the top, I called each separately, listened for an hour each, then facilitated a conversation where they found the underlying misunderstanding. They co-hosted an event together a month later.",
      21: "The sociology of third places — spaces that are neither home nor work where community forms spontaneously. I've studied every successful third place from Parisian cafés to Korean jimjilbangs and I can tell you the design principles that make them work.",
      22: "A physical-digital hybrid space in every city where founders, artists, scientists, and weirdos collide accidentally. Not a coworking space — something closer to a Renaissance bottega. A place where serendipity is engineered.",
      23: "Moderating a live podcast with three guests who'd never met, and watching the conversation evolve from polite to profound in real-time. Two hours felt like twenty minutes. The audience was silent in the best way.",
      24: "Nia doesn't network — she weaves. Put her in a room of strangers and she'll find the thread that connects everyone. She'll remember your dog's name and your deepest ambition and she'll know which matters more today.",
      25: "Careful acceleration with guardrails",
      26: "They're inseparable",
      27: 4,
      28: "I've failed enough to stop fearing it",
      29: 1,
      30: "Kindness and emotional intelligence",
    },
  },
  {
    name: "Jin — The Stealth Mode Operator",
    answers: {
      1: "My city only",
      2: "Full-time, all-in, burn the boats",
      3: "Flexible based on contribution",
      4: "Already have capital to deploy",
      5: "This quarter",
      6: "Domain expertise (I know the market)",
      7: "Technical co-founder",
      8: 2, 9: 4, 10: 3, 11: 1, 12: 1, 13: 1, 14: 1, 15: 4, 16: 1, 17: 5,
      18: "In a quiet office, door closed. My co-founder and I review the metrics dashboard every morning at 9am — seven minutes, no more. The rest of my day is deep work on regulatory strategy and partnership contracts. Nobody outside the team knows what we're building yet.",
      19: "Cross-border payments are still broken for small businesses. Fourteen trillion dollars in SMB trade and the infrastructure looks like it was designed in 1997 because it was. I left my bank job over this.",
      20: "A partner tried to renegotiate terms after we'd already signed. Instead of getting emotional, I pulled the specific clauses they were violating, calculated the cost of their breach, and presented it calmly. They honored the original terms within a day.",
      21: "The correspondent banking network — SWIFT, nostro/vostro accounts, CHIPS clearing. I can trace a dollar from Kansas to Kenya through every intermediary and tell you exactly where the 3-5 day delay and the 6% fee comes from.",
      22: "A global settlement layer for small business trade that makes correspondent banking obsolete. Not crypto — something that works within existing regulatory frameworks but eliminates every unnecessary intermediary.",
      23: "Building a financial model for our market entry strategy. Twelve tabs, every assumption sourced, every scenario modeled. Six hours. When I finished, the strategy was obvious from the numbers alone.",
      24: "Jin is the person who reads the contract before signing and the person you want reading yours. Quiet until he isn't, precise always. He'll outwork you without ever looking busy.",
      25: "AI is a tool, not a trajectory",
      26: "Individual freedom",
      27: 1,
      28: "I avoid failure through preparation",
      29: 5,
      30: "Complementary skills",
    },
  },
];

// ── Seed logic ───────────────────────────────────────────────

const SLIDER_IDS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 27, 29];

function varyProfile(base, index) {
  const answers = { ...base.answers };

  // For repeated personas (when count > 12), add slight trait variation
  if (index >= PERSONAS.length) {
    for (const qId of SLIDER_IDS) {
      if (Math.random() > 0.5) {
        const delta = Math.random() > 0.5 ? 1 : -1;
        answers[qId] = Math.max(1, Math.min(5, answers[qId] + delta));
      }
    }
  }

  return answers;
}

async function seed(count, dryRun) {
  console.log(`\n  carbonrouter seed · generating ${count} profiles${dryRun ? ' (dry run)' : ''}\n`);

  const hasEmbeddingKey = !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
  if (hasEmbeddingKey) {
    console.log(`  embeddings: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter' : 'OpenAI'}`);
  } else {
    console.log('  embeddings: ✗ no key — profiles will be saved without vectors');
  }

  let pool;
  if (!dryRun) {
    if (!process.env.DATABASE_URL) {
      console.error('\n  ✗ DATABASE_URL not set. Use --dry-run to preview without a database.\n');
      process.exit(1);
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('  database: ✓ connected\n');
  } else {
    console.log('  database: skipped (dry run)\n');
  }

  for (let i = 0; i < count; i++) {
    const persona = PERSONAS[i % PERSONAS.length];
    const answers = varyProfile(persona, i);
    const traits = deriveTraits(answers);
    const vibeText = buildVibeText(answers);

    console.log(`  [${(i + 1).toString().padStart(2)}/${count}] ${persona.name}`);
    console.log(`        traits: ${Object.entries(traits).map(([k, v]) => `${k.slice(0, 3)}:${v}`).join(' ')}`);
    console.log(`        vibe: ${vibeText.length} chars`);

    let embedding = null;
    if (hasEmbeddingKey) {
      try {
        embedding = await getEmbedding(vibeText);
        console.log(`        embedded: ✓ ${embedding.length} dims`);
      } catch (err) {
        console.log(`        embedded: ✗ ${err.message}`);
      }
    }

    if (!dryRun) {
      const result = await pool.query(
        `INSERT INTO profiles (answers, traits, vibe_text, vibe_embedding)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          JSON.stringify(answers),
          JSON.stringify(traits),
          vibeText,
          embedding ? `[${embedding.join(',')}]` : null,
        ]
      );
      console.log(`        saved: ${result.rows[0].id}`);
    }

    console.log();
  }

  if (pool) await pool.end();
  console.log(`  done. ${count} profiles ${dryRun ? 'previewed' : 'seeded'}.\n`);
}

// ── CLI ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const countArg = args.find(a => !a.startsWith('--'));
const count = parseInt(countArg) || PERSONAS.length;

seed(count, dryRun);
