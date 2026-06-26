export interface PersonalityResult {
  id: string;
  type: string;
  icon: string;
  description: string;
  stats: {
    drip: number;
    fit: number;
    sauciness: number;
  };
}

export const PERSONALITY_RESULTS: PersonalityResult[] = [
  { id: 'nonchalant', type: 'The Nonchalant', icon: '😶', description: 'Unbothered. Drips quietly. Doesn\'t need validation. You literally just throw this on, and somehow it works.', stats: { drip: 92, fit: 88, sauciness: 95 } },
  { id: 'chill', type: 'The Chill One', icon: '😎', description: 'Effortless style. Never overdressed, never under. You prioritize comfort but you always look clean.', stats: { drip: 85, fit: 95, sauciness: 80 } },
  { id: 'party', type: 'Life of the Party', icon: '🔥', description: 'Loud fits. First noticed in every room. No apologies. You are the moment, every single time.', stats: { drip: 95, fit: 80, sauciness: 98 } },
  { id: 'hustler', type: 'The Hustler', icon: '💼', description: 'Clean and calculated. Style means business. You look like money even when the account says otherwise.', stats: { drip: 90, fit: 92, sauciness: 88 } },
  { id: 'ghost', type: 'The Ghost', icon: '👻', description: 'Rare sightings. But when they show up, they go crazy. You disappear for months then drop a fit that stops the internet.', stats: { drip: 98, fit: 85, sauciness: 92 } },
  { id: 'creative', type: 'The Creative', icon: '🎨', description: 'Experimental. Mixes things nobody else would even try. You don\'t follow trends, you break them.', stats: { drip: 88, fit: 90, sauciness: 96 } },
];

export const ANSWER_MAP: Record<string, Record<string, string>> = {
  q1: { a: 'nonchalant', b: 'party', c: 'hustler', d: 'creative' },
  q2: { a: 'chill', b: 'hustler', c: 'party', d: 'creative' },
  q3: { a: 'nonchalant', b: 'hustler', c: 'party', d: 'creative' },
  q4: { a: 'ghost', b: 'party', c: 'hustler', d: 'creative' },
  q5: { a: 'nonchalant', b: 'chill', c: 'hustler', d: 'creative' },
  q6: { a: 'creative', b: 'chill', c: 'ghost', d: 'hustler' },
  q7: { a: 'party', b: 'chill', c: 'nonchalant', d: 'creative' },
  q8: { a: 'nonchalant', b: 'chill', c: 'hustler', d: 'ghost' },
  q9: { a: 'hustler', b: 'party', c: 'chill', d: 'creative' },
  q10: { a: 'party', b: 'creative', c: 'nonchalant', d: 'ghost' }
};

export const QUIZ_QUESTIONS = [
  { 
    question: "You're heading out to valid a CBD weekend linkup. What are you copping?", 
    options: ["Vintage Oversized Tee", "Fresh White AF1s", "Local Brand Tracksuit", "Cargos and a Hoodie"] 
  },
  { 
    question: "Pick your Harare energy right now:", 
    options: ["Avondale Vibes", "CBD Hustle", "Borrowdale Village", "Highfield Energy"] 
  },
  { 
    question: "Your go-to artist on the speakers?", 
    options: ["Winky D", "Holy Ten", "Burna Boy", "Saintfloew"] 
  },
  { 
    question: "Friday night — how are you stepping?", 
    options: ["All black everything", "Loud colours & chains", "Clean and minimalist", "Vintage thrifted heat"] 
  },
  { 
    question: "Someone's wearing the same fit as you. Reaction?", 
    options: ["Unbothered (I still look better)", "Dap them up (Good taste)", "Lowkey annoyed", "Time for a quick change"] 
  },
  { 
    question: "Where's the best thrift in HRE?", 
    options: ["Mupedzanhamo", "Avondale Flea Market", "The Thrift Lab", "CBD Street Vendors"] 
  },
  { 
    question: "Pick a footwear vibe:", 
    options: ["Jordan 4s", "Yeezy Slides", "Timberlands", "Classic Vans"] 
  },
  { 
    question: "Getting dressed takes you:", 
    options: ["5 mins (No capping)", "20 mins", "45 mins", "However long it takes"] 
  },
  { 
    question: "What's the goal for the fit?", 
    options: ["Respect & Status", "Attention", "Comfort First", "Artistic Expression"] 
  },
  { 
    question: "You just copped some fire heat. What's next?", 
    options: ["Straight to the Gram", "Wait for a special event", "Rock it quietly", "Tell the close circle only"] 
  }
];
