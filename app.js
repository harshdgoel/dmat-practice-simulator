"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const LETTERS = "ABCDE";
const OPTION_LETTERS = "ABCD";

const PATHS = {
  perimeter: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[3,0],[2,0],[1,0]],
  inner: [[1,1],[1,2],[1,3],[2,3],[3,3],[3,2],[3,1],[2,1]],
  row: [[2,0],[2,1],[2,2],[2,3],[2,4],[2,3],[2,2],[2,1]],
  col: [[0,2],[1,2],[2,2],[3,2],[4,2],[3,2],[2,2],[1,2]],
  diag: [[0,0],[1,1],[2,2],[3,3],[4,4],[3,3],[2,2],[1,1]],
  adiag: [[0,4],[1,3],[2,2],[3,1],[4,0],[3,1],[2,2],[1,3]],
};

const SHAPE_COLORS = ["#0077b6", "#e76f51", "#2a9d8f", "#7b2cbf", "#f4a261"];

const figureRaw = [
  ["low", [["circle","perimeter",0,1,0,0,0,0,0]]],
  ["low", [["square","row",0,1,0,2,0,0,0]]],
  ["low", [["diamond","diag",1,1,0,4,0,0,0]]],
  ["low", [["triangle","inner",0,2,0,1,0,0,0]]],
  ["low", [["square","perimeter",12,2,0,0,1,0,0]]],
  ["low", [["circle","inner",2,1,1,3,0,0,0]]],
  ["low", [["arrow","col",0,1,0,1,0,0,90]]],
  ["medium", [["circle","perimeter",0,1,0,0,0,0,0],["square","inner",3,-1,0,2,0,0,0]]],
  ["medium", [["triangle","row",0,1,0,4,0,0,90],["diamond","perimeter",5,2,0,3,0,0,0]]],
  ["medium", [["arrow","diag",0,1,0,1,0,0,90],["circle","adiag",3,1,0,0,1,0,0]]],
  ["medium", [["square","perimeter",1,3,0,2,0,0,0],["triangle","inner",4,1,0,4,0,0,90]]],
  ["medium", [["diamond","col",0,1,1,0,0,0,0],["arrow","perimeter",8,-1,0,1,0,0,-90]]],
  ["medium", [["circle","inner",0,2,0,3,1,0,0],["square","row",4,-1,0,2,0,0,0]]],
  ["medium", [["arrow","perimeter",2,1,0,4,0,0,90],["diamond","diag",0,1,0,0,0,0,0]]],
  ["high", [["circle","perimeter",0,1,0,0,1,0,0],["triangle","inner",3,-1,0,4,0,0,90],["square","col",0,1,0,2,0,0,0]]],
  ["high", [["arrow","perimeter",4,2,0,1,0,0,90],["diamond","inner",0,1,1,0,0,0,0],["circle","adiag",1,1,0,3,0,0,0]]],
  ["high", [["square","perimeter",9,-1,0,2,1,0,0],["arrow","row",0,1,0,4,0,0,-90],["diamond","diag",4,-1,0,0,0,0,0]]],
  ["high", [["triangle","perimeter",1,3,0,4,0,0,90],["circle","inner",6,-2,0,1,1,0,0],["arrow","col",0,1,1,2,0,0,90]]],
  ["high", [["diamond","perimeter",14,1,1,0,0,0,0],["square","adiag",0,1,0,3,1,0,0],["arrow","inner",2,-1,0,4,0,0,90]]],
  ["high", [["circle","perimeter",7,-2,0,1,1,0,0],["arrow","diag",0,1,0,0,0,0,90],["triangle","inner",5,1,1,2,0,0,-90]]],
];

const correctM5 = [0,2,1,1,2,0,2,1,0,2,0,1,2,1,0,2,1,0,2,1];
const correctM6 = [1,0,2,0,1,2,1,2,1,0,2,0,1,2,1,0,2,1,0,2];

function shapeRule(data) {
  const [kind, pathName, start, step, accel, color0, colorStep, angle0, angleStep] = data;
  return { kind, pathName, path: PATHS[pathName], start, step, accel, color0, colorStep, angle0, angleStep };
}

function shapeIndex(rule, t) {
  const jump = rule.step * t + rule.accel * t * (t - 1) / 2;
  return ((rule.start + jump) % rule.path.length + rule.path.length) % rule.path.length;
}

function shapeState(rule, t) {
  return {
    kind: rule.kind,
    pos: rule.path[shapeIndex(rule, t)],
    color: SHAPE_COLORS[((rule.color0 + rule.colorStep * t) % SHAPE_COLORS.length + SHAPE_COLORS.length) % SHAPE_COLORS.length],
    angle: ((rule.angle0 + rule.angleStep * t) % 360 + 360) % 360,
  };
}

function buildFigureQuestion(difficulty, rawShapes, id, variant, correctIndices) {
    const shapes = rawShapes.map((raw,shapeNumber) => {
      const rule=shapeRule(raw);
      if(variant){
        rule.start=(rule.start+variant*(shapeNumber+1))%rule.path.length;
        rule.color0=(rule.color0+variant+shapeNumber)%SHAPE_COLORS.length;
        if(["arrow","triangle"].includes(rule.kind))rule.angle0=(rule.angle0+90*(variant%4))%360;
      }
      return rule;
    });
    for (let j = 1; j < shapes.length; j++) {
      const original = shapes[j].start;
      for (let d = 0; d < shapes[j].path.length; d++) {
        shapes[j].start = (original + d) % shapes[j].path.length;
        const valid = [0,1,2,3,4,5].every(t => {
          const positions = shapes.slice(0, j + 1).map(s => shapeState(s, t).pos.join(","));
          return new Set(positions).size === positions.length;
        });
        if (valid) break;
      }
    }
    return {
      id,
      type: "figure",
      difficulty,
      shapes,
      correctIndices,
      correct: { m5: "ABC"[correctIndices.m5], m6: "ABC"[correctIndices.m6] },
      explanation: shapes.map((s, i) => `Figure ${i + 1} ${figureRuleText(s)}`).join("; ") + ".",
    };
}

function makeFigureQuestions() {
  return figureRaw.map(([difficulty, rawShapes], index) => {
    return buildFigureQuestion(difficulty,rawShapes,`figure-${index+1}`,0,{m5:correctM5[index],m6:correctM6[index]});
  });
}

function makeFigurePracticeSet(day) {
  const pool=figureRaw.slice(7);
  return Array.from({length:6},(_,i)=>{
    const poolIndex=(day*4+i)%pool.length;
    const [baseDifficulty,rawShapes]=pool[poolIndex];
    const difficulty=i<3?"medium":"high";
    const indices={m5:(day+i)%3,m6:(day*2+i+1)%3};
    return buildFigureQuestion(difficulty,rawShapes,`daily-${day+1}-figure-${i+1}`,day+1,indices);
  });
}

function makeFigureAdvancedFullSet() {
  const pool=figureRaw.slice(7);
  return Array.from({length:20},(_,i)=>{
    const [difficulty,rawShapes]=pool[i%pool.length];
    return buildFigureQuestion(difficulty,rawShapes,`figure-${i+1}`,Math.floor(i/pool.length)+1,{m5:correctM5[i],m6:correctM6[i]});
  });
}

function figureRuleText(s) {
  const pathText = { perimeter: "moves along the outer boundary", inner: "moves around the inner ring", row: "moves horizontally and bounces", col: "moves vertically and bounces", diag: "moves diagonally and bounces", adiag: "moves diagonally and bounces" }[s.pathName];
  const bits = [pathText];
  if (s.accel) bits.push("increasing its jump by one cell per frame");
  else if (Math.abs(s.step) !== 1) bits.push(`in ${Math.abs(s.step)}-cell jumps`);
  if (s.colorStep) bits.push("cycling through colours");
  if (s.angleStep && ["arrow","triangle"].includes(s.kind)) bits.push(`rotating ${Math.abs(s.angleStep)} degrees per frame`);
  return bits.join(", ");
}

const equationSpecs = [
  ["low",["A","B"],[4,9],[[1,2],[0,1]]],
  ["low",["A","B"],[7,14],[[2,-1],[1,1]]],
  ["low",["A","B"],[12,5],[[1,1],[1,-1]]],
  ["low",["A","B"],[6,18],[[3,-1],[2,1]]],
  ["low",["A","B"],[8,16],[[2,-1],[1,1]]],
  ["low",["A","B"],[10,4],[[1,2],[1,-1]]],
  ["medium",["A","B","C"],[6,14,4],[[1,1,0],[1,0,2],[0,1,-1]]],
  ["medium",["A","B","C"],[5,11,6],[[-2,1,0],[-1,1,-1],[0,0,1]]],
  ["medium",["A","B","C"],[9,3,12],[[1,1,0],[-1,0,1],[0,1,2]]],
  ["medium",["A","B","C"],[4,15,7],[[2,0,1],[1,1,0],[0,1,-2]]],
  ["medium",["A","B","C"],[8,5,18],[[1,2,0],[-2,0,1],[-1,2,0]]],
  ["medium",["A","B","C"],[12,7,5],[[1,-1,0],[0,1,1],[1,0,-2]]],
  ["medium",["A","B","C"],[3,16,10],[[2,1,0],[0,1,-1],[1,0,1]]],
  ["high",["A","B","C","D"],[5,12,8,17],[[1,1,0,0],[0,0,1,1],[0,1,-1,0],[-2,0,0,1]]],
  ["high",["A","B","C","D"],[9,4,15,6],[[1,1,0,0],[0,0,1,-1],[1,0,0,1],[0,1,1,0]]],
  ["high",["A","B","C","D"],[14,7,3,18],[[1,-1,0,0],[0,0,1,1],[0,1,1,0],[1,0,0,1]]],
  ["high",["A","B","C","D"],[6,13,19,4],[[1,1,0,0],[0,0,1,-1],[0,1,0,1],[1,0,1,0]]],
  ["high",["A","B","C","D"],[11,5,16,8],[[1,-1,0,0],[0,0,1,1],[0,1,0,1],[1,0,1,0]]],
  ["high",["A","B","C","D"],[4,18,7,12],[[1,1,0,0],[0,0,1,1],[0,1,-1,0],[-2,0,0,1]]],
  ["high",["A","B","C","D"],[15,9,6,20],[[1,-1,0,0],[0,0,1,1],[0,1,1,0],[1,0,0,1]]],
];

function formatLinear(row, vars) {
  const out = [];
  row.forEach((coef, i) => {
    if (!coef) return;
    const sign = coef > 0 ? "+" : "-";
    const mag = Math.abs(coef);
    const term = mag === 1 ? vars[i] : `${mag} x ${vars[i]}`;
    if (!out.length) out.push(coef > 0 ? term : `-${term}`);
    else out.push(` ${sign} ${term}`);
  });
  return out.join("");
}

const equationQuestions = equationSpecs.map(([difficulty, vars, solution, matrix], i) => {
  const rhs = matrix.map(row => row.reduce((sum, c, j) => sum + c * solution[j], 0));
  return {
    id: `equation-${i + 1}`, type: "equation", difficulty, vars, solution,
    equations: matrix.map((row, j) => `${formatLinear(row, vars)} = ${rhs[j]}`),
    explanation: `The unique values are ${vars.map((v,j) => `${v} = ${solution[j]}`).join(", ")}. Substitution satisfies every equation.`,
  };
});

function makeEquationPracticeSet(day) {
  const pool=equationSpecs.slice(6);
  return Array.from({length:6},(_,i)=>{
    const [baseDifficulty,vars,baseSolution,matrix]=pool[(day*3+i)%pool.length];
    const solution=baseSolution.map((value,j)=>((value+day*3+i*2+j-1)%20)+1);
    const rhs=matrix.map(row=>row.reduce((sum,c,j)=>sum+c*solution[j],0));
    return {id:`daily-${day+1}-equation-${i+1}`,type:"equation",difficulty:baseDifficulty==="high"||i>=3?"high":"medium",vars:[...vars],solution,equations:matrix.map((row,j)=>`${formatLinear(row,vars)} = ${rhs[j]}`),explanation:`The unique values are ${vars.map((v,j)=>`${v} = ${solution[j]}`).join(", ")}. Substitution satisfies every equation.`};
  });
}

function makeEquationAdvancedFullSet() {
  const pool=equationSpecs.slice(6);
  return Array.from({length:20},(_,i)=>{
    const [difficulty,vars,baseSolution,matrix]=pool[i%pool.length];
    const cycle=Math.floor(i/pool.length);
    const solution=baseSolution.map((value,j)=>((value+cycle*5+i+j-1)%20)+1);
    const rhs=matrix.map(row=>row.reduce((sum,c,j)=>sum+c*solution[j],0));
    return {id:`equation-${i+1}`,type:"equation",difficulty,vars:[...vars],solution,equations:matrix.map((row,j)=>`${formatLinear(row,vars)} = ${rhs[j]}`),explanation:`The unique values are ${vars.map((v,j)=>`${v} = ${solution[j]}`).join(", ")}. Substitution satisfies every equation.`};
  });
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffled(array, rng) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeLatinQuestion(index,forcedDifficulty) {
  const difficulty = forcedDifficulty || (index < 7 ? "low" : index < 14 ? "medium" : "high");
  const rng = mulberry32(9500 + index * 31);
  const symbols = shuffled([...LETTERS], rng);
  const rows = shuffled([0,1,2,3,4], rng);
  const cols = shuffled([0,1,2,3,4], rng);
  const base = Array.from({length:5}, (_,r) => Array.from({length:5}, (_,c) => symbols[(r+c)%5]));
  const full = Array.from({length:5}, (_,r) => Array.from({length:5}, (_,c) => base[rows[r]][cols[c]]));
  const tr = Math.floor(rng()*5), tc = Math.floor(rng()*5);
  const clues = new Set();
  let method = "";
  if (difficulty === "low") {
    for (let c=0;c<5;c++) if (c!==tc) clues.add(`${tr},${c}`);
    method = "The target row already contains the other four letters.";
  } else if (difficulty === "medium") {
    const x = full[tr][tc];
    const choices = shuffled([0,1,2,3,4].filter(c => c!==tc), rng);
    const c2 = choices[0], y = full[tr][c2];
    for (let c=0;c<5;c++) if (c!==tc && c!==c2) clues.add(`${tr},${c}`);
    const z = shuffled([...LETTERS].filter(s => s!==x && s!==y), rng)[0];
    for (let r=0;r<5;r++) if (r!==tr && full[r][tc]!==x && full[r][tc]!==z) clues.add(`${r},${tc}`);
    method = "Intersect the missing-letter set of the target row with that of the target column.";
  } else {
    const c2 = shuffled([0,1,2,3,4].filter(c => c!==tc), rng)[0];
    for (let c=0;c<5;c++) if (c!==tc && c!==c2) clues.add(`${tr},${c}`);
    for (let r=0;r<5;r++) if (r!==tr) clues.add(`${r},${c2}`);
    method = "Complete the linked blank from its column, then eliminate it from the target row.";
  }
  const extras = difficulty === "low" ? 6 : difficulty === "medium" ? 5 : 3;
  const candidates = shuffled(Array.from({length:25}, (_,k) => `${Math.floor(k/5)},${k%5}`).filter(k => k!==`${tr},${tc}` && !clues.has(k)), rng);
  candidates.slice(0, extras).forEach(k => clues.add(k));
  const grid = Array.from({length:5}, (_,r) => Array.from({length:5}, (_,c) => {
    if (r===tr && c===tc) return "?";
    return clues.has(`${r},${c}`) ? full[r][c] : "";
  }));
  return { id:`latin-${index+1}`, type:"latin", difficulty, grid, correct:full[tr][tc], explanation:method };
}

const latinQuestions = Array.from({length:20}, (_,i) => makeLatinQuestion(30+i,i<10?"medium":"high"));

function makeLatinPracticeSet(day) {
  return Array.from({length:6},(_,i)=>{
    const q=makeLatinQuestion(100+day*6+i,i<3?"medium":"high");
    q.id=`daily-${day+1}-latin-${i+1}`;
    return q;
  });
}

const passages = [
  {
    domain:"Mathematics", title:"Expected Value and Decision-Making",
    text:"Expected value is a weighted average of possible numerical outcomes. If outcome x_i occurs with probability p_i, then E(X) = sum(p_i x_i). The probabilities must sum to 1. Expected value is not a promise about one trial; it describes the long-run average over many comparable trials. A risk-neutral decision-maker comparing alternatives only by expected monetary value chooses the larger expectation. A risk-averse person may prefer a lower but more certain outcome. Consider two projects. Project A yields a profit of 80 units with probability 0.60 and a loss of 20 units with probability 0.40. Project B yields a certain profit of 35 units. For repeated independent trials, variances add, but standard deviations do not add directly. The expected value of a sum is the sum of the expected values even when the variables are not independent.",
    qs:[
      ["What is the expected profit of Project A?",["28 units","40 units","48 units","60 units"],"B","0.60 x 80 + 0.40 x (-20) = 40."],
      ["Which project would a strictly risk-neutral decision-maker choose?",["A, because its expected profit is larger","B, because certainty is always rational","A, because it can never make a loss","Neither; expected values are equal"],"A","Project A has expectation 40, exceeding Project B's certain 35."],
      ["Which statement follows from the passage?",["Project A will earn exactly 40 in its next trial","A risk-averse person must choose A","Expected value describes a long-run average, not a guaranteed single result","Expected values can be added only for independent variables"],"C","Expectation is not a single-trial guarantee."],
      ["A third project pays 10 with probability 0.25 and 30 otherwise. What is its expected value?",["15","20","25","30"],"C","0.25 x 10 + 0.75 x 30 = 25."],
      ["If X and Y are dependent, which calculation remains valid?",["E(X + Y) = E(X) + E(Y)","SD(X + Y) = SD(X) + SD(Y)","P(X and Y) = P(X)P(Y)","Var(X + Y) = Var(X) + Var(Y) in every case"],"A","Linearity of expectation does not require independence."],
    ]
  },
  {
    domain:"Computational Sciences", title:"Search Methods and Runtime",
    text:"A linear search inspects entries one after another and can be used on unsorted data. In the worst case it inspects all n entries. A binary search repeatedly halves the remaining search interval, but it requires data ordered by the search key. In this model, the maximum number of comparisons for binary search is C(n) = ceiling(log2(n + 1)). Building a sorted copy costs additional time, so sorting only to perform one search may be inefficient. A hash table uses a function to map keys to storage locations. With a suitable function and controlled load, lookup is approximately constant on average, but collisions can make worst-case lookup linear. Collection R contains 1,023 sorted records; collection S contains 500 unsorted records; collection T is a well-sized hash table with 50,000 records.",
    qs:[
      ["What is the stated maximum number of binary-search comparisons for collection R?",["9","10","11","1,023"],"B","ceiling(log2(1024)) = 10."],
      ["Which method can be applied directly to collection S without preprocessing?",["Only binary search","Linear search","Binary search after assuming the order","No search method"],"B","Linear search does not require sorted input."],
      ["Which claim about collection T is justified?",["Every lookup takes one comparison","Worst-case lookup is always constant","Average lookup may be approximately constant","Collisions are impossible"],"C","The passage gives approximate constant average lookup, not a guarantee."],
      ["Why might sorting S be inefficient for one search?",["Sorting changes every key","The preprocessing cost may exceed the benefit of one faster lookup","Binary search cannot search 500 entries","Linear search also requires sorting"],"B","Sorting overhead may exceed the benefit of one lookup."],
      ["If R grows from 1,023 to 2,047 sorted records, what happens to the stated binary-search maximum?",["It stays 10","It becomes 11","It doubles to 20","It becomes 2,047"],"B","ceiling(log2(2048)) = 11."],
    ]
  },
  {
    domain:"Natural Sciences", title:"Heating, Phase Change and Energy",
    text:"The energy needed to change a body's temperature without changing its phase is Q = m c DeltaT. Here m is mass, c is specific heat capacity and DeltaT is the temperature change. During a phase change, temperature can remain constant while energy is absorbed or released; the energy is Q = m L, where L is latent heat. An electric heater with efficiency eta transfers only eta times its electrical input energy to the sample. For water, c = 4.2 kJ/(kg K) and latent heat of fusion L_f = 334 kJ/kg. For aluminium, c = 0.90 kJ/(kg K). Assume heat losses other than the stated efficiency are negligible.",
    qs:[
      ["How much energy heats 2 kg of water by 10 K?",["42 kJ","84 kJ","334 kJ","840 kJ"],"B","Q = 2 x 4.2 x 10 = 84 kJ."],
      ["How much energy melts 0.50 kg of ice already at its melting point?",["83.5 kJ","167 kJ","334 kJ","668 kJ"],"B","Q = 0.50 x 334 = 167 kJ."],
      ["What happens to temperature during the idealized melting step?",["It must rise linearly","It remains constant while energy changes the phase","It falls to zero kelvin","It is unrelated to energy transfer"],"B","Latent energy changes phase while temperature remains constant."],
      ["A heater supplies 200 kJ electrically at 75% efficiency. How much reaches the sample?",["50 kJ","125 kJ","150 kJ","267 kJ"],"C","0.75 x 200 = 150 kJ."],
      ["Equal masses of water and aluminium receive equal energy with no phase change. Which warms more?",["Water, because its c is larger","Aluminium, because its c is smaller","Both equally","It cannot be inferred from c"],"B","For fixed Q and m, smaller c gives a larger temperature rise."],
    ]
  },
  {
    domain:"Engineering", title:"Direct-Current Circuits",
    text:"Ohm's law relates voltage V, current I and resistance R: V = I R. Resistors in series carry the same current and have equivalent resistance R_s = R1 + R2 + .... Resistors in parallel have the same voltage and satisfy 1/R_p = 1/R1 + 1/R2 + .... Electrical power can be calculated as P = V I = I^2 R = V^2/R. A 12 V ideal source is connected to two resistors, R1 = 4 ohm and R2 = 8 ohm. Components are assumed ideal and wire resistance is negligible.",
    qs:[
      ["If R1 and R2 are connected in series, what is the equivalent resistance?",["2.67 ohm","4 ohm","8 ohm","12 ohm"],"D","Series resistances add: 4 + 8 = 12 ohm."],
      ["What current flows in that series circuit?",["0.5 A","1 A","1.5 A","3 A"],"B","I = V/R = 12/12 = 1 A."],
      ["If R1 and R2 are connected in parallel, which statement is true?",["Both carry the same current","Both have 12 V across them","Their equivalent resistance is 12 ohm","The 8-ohm resistor carries more current"],"B","Parallel branches share the source voltage."],
      ["What is the current through R1 in the parallel circuit?",["1 A","1.5 A","3 A","6 A"],"C","I1 = 12/4 = 3 A."],
      ["What total power is drawn by the parallel circuit?",["18 W","36 W","54 W","72 W"],"C","Branch powers are 36 W and 18 W; total 54 W."],
    ]
  },
  {
    domain:"Business Administration", title:"Break-Even Analysis",
    text:"A simple break-even model separates fixed costs F from variable cost per unit v. If a firm sells q units at price p, revenue is R(q) = p q and total cost is C(q) = F + v q. Contribution margin per unit is p - v. Provided p > v, break-even quantity is q* = F/(p - v). The model assumes constant price and variable cost, all produced units are sold and fixed costs remain unchanged in the relevant range. A workshop has fixed monthly costs of EUR 24,000, sells each unit for EUR 80 and has variable cost of EUR 50 per unit.",
    qs:[
      ["What is the contribution margin per unit?",["EUR 30","EUR 50","EUR 80","EUR 130"],"A","80 - 50 = EUR 30."],
      ["What is the monthly break-even quantity?",["300","480","800","1,200"],"C","24,000/30 = 800 units."],
      ["What profit results from selling 1,000 units?",["EUR 6,000","EUR 24,000","EUR 30,000","EUR 56,000"],"A","Profit = 1,000 x 30 - 24,000 = EUR 6,000."],
      ["If variable cost rises while price and fixed cost stay unchanged, what happens to break-even quantity?",["It falls","It rises","It cannot change","It becomes zero"],"B","The contribution margin shrinks, requiring more units."],
      ["Which situation violates a stated assumption of the model?",["All produced units are sold","Price stays at EUR 80","Fixed cost jumps after capacity exceeds 1,100 units","Variable cost is EUR 50 throughout"],"C","The simple model assumes fixed cost remains unchanged."],
    ]
  },
  {
    domain:"Economics", title:"Price Elasticity and Revenue",
    text:"Price elasticity of demand measures the percentage response of quantity demanded to a percentage change in price: epsilon = (% change in quantity demanded)/(% change in price). The value is usually negative because price and quantity demanded move in opposite directions. Analysts often discuss its absolute value. Demand is elastic when |epsilon| > 1, inelastic when |epsilon| < 1 and unit elastic when |epsilon| = 1. For a small price change, if demand is elastic, a price increase tends to reduce total revenue; if demand is inelastic, a price increase tends to raise total revenue. These statements hold other relevant factors constant.",
    qs:[
      ["Price rises by 5% and quantity demanded falls by 10%. What is elasticity?",["-2","-0.5","0.5","2"],"A","-10%/5% = -2."],
      ["How is that demand classified?",["Perfectly inelastic","Inelastic","Unit elastic","Elastic"],"D","Absolute elasticity is 2, greater than 1."],
      ["What is the likely effect of this small price increase on total revenue?",["Revenue rises","Revenue falls","Revenue is unchanged by definition","The sign of elasticity becomes positive"],"B","With elastic demand, quantity falls proportionally more than price rises."],
      ["Which elasticity describes inelastic demand?",["-1.8","-1.0","-0.4","1.4"],"C","The absolute value 0.4 is below 1."],
      ["Why does the passage qualify its revenue statements?",["Elasticity is never measurable","They apply to small changes with other relevant factors held constant","Price and quantity always move together","Total revenue excludes price"],"B","The conclusion assumes other factors are held constant."],
    ]
  },
  {
    domain:"Social Sciences", title:"Research Design and Causal Claims",
    text:"A correlation between two variables does not by itself establish causation. An observed relationship may reflect reverse causation, chance or a confounding variable that influences both variables. Random assignment in an experiment aims to distribute confounders across treatment groups, strengthening causal inference. Random sampling serves a different purpose: it helps a sample represent a target population. Reliability concerns consistency of measurement; validity concerns whether an instrument measures the intended concept. A researcher studies whether a new study-planning app improves examination performance. Volunteers choose whether to use the app, and app users later achieve higher marks. Users also report studying more hours before adopting the app.",
    qs:[
      ["What design problem most directly weakens the causal claim?",["The outcome is an examination mark","Participants self-select into app use","The sample contains students","The app records planning"],"B","Self-selection permits pre-existing differences."],
      ["Study hours may be what type of variable?",["A confounder","A randomization device","The dependent variable only","Proof of causation"],"A","Study hours may affect both app uptake and marks."],
      ["What would random assignment mainly improve?",["Representativeness of all students","Causal comparability of treatment groups","The spelling of survey items","The number of concepts measured"],"B","Random assignment strengthens causal comparability."],
      ["What would random sampling mainly improve?",["Population representativeness","Perfect measurement validity","Elimination of every confounder","Guaranteeing higher marks"],"A","Random sampling supports population generalization."],
      ["A questionnaire gives very similar scores repeatedly but measures motivation rather than planning skill. It is...",["valid but unreliable","reliable but not valid for planning skill","neither consistent nor interpretable","causal because it is consistent"],"B","Consistency indicates reliability; the wrong construct undermines validity."],
    ]
  },
  {
    domain:"Humanities", title:"Evaluating Historical Evidence",
    text:"Historians distinguish a source's proximity to an event from its reliability. A diary written during an event is a primary source, but the author may possess limited information or strong interests. A later scholarly study is a secondary source; it may synthesize many records but can still reflect its author's assumptions. Corroboration compares independent sources. Agreement among sources can strengthen a claim, especially when the sources had different access and incentives. Silence is harder to interpret: a record may omit an event because it did not occur, because it seemed unimportant, or because the author wished to conceal it. Selection bias also matters when only records that survived are studied. Imagine that a factory owner wrote that a strike ended peacefully, while two workers' letters describe injuries. A police log from the same day records that medical assistance was requested.",
    qs:[
      ["Which item is a secondary source?",["A worker's letter written that day","The police log","A modern scholarly study comparing the records","The factory owner's same-day account"],"C","A later analytical study is secondary."],
      ["What does the police log do in this example?",["It independently corroborates that injuries or medical needs may have existed","It proves every detail in the workers' letters","It makes the owner's account a secondary source","It shows the strike never occurred"],"A","The request supports part of the workers' account without proving every detail."],
      ["Why should the owner's primary account not automatically be treated as fully reliable?",["Primary sources are always false","Proximity removes all bias","The owner may have limited information or an interest in minimizing harm","Secondary sources must replace it"],"C","Primary status does not eliminate limited access or incentives."],
      ["Which inference from silence is most defensible?",["An omitted event certainly did not happen","Omission alone has several possible explanations","Silence proves deliberate concealment","Only surviving sources may be used"],"B","The passage lists multiple reasons for omission."],
      ["What is selection bias in this context?",["Comparing independent sources","Studying only the records that happened to survive","Using a source written close to the event","Identifying the author's occupation"],"B","Surviving records may not represent all records originally produced."],
    ]
  },
  {
    domain:"Mathematics", title:"Bayesian Updating in Diagnostic Decisions",
    text:"A screening test has sensitivity 0.90 and specificity 0.80. Sensitivity is the probability of a positive result when the condition is present; specificity is the probability of a negative result when it is absent. In a population where prevalence is 0.10, imagine 1,000 representative people. About 100 have the condition: 90 test positive and 10 negative. Of the 900 without it, 180 test positive and 720 negative. The positive predictive value is the proportion of all positive results that are true positives. Changing prevalence changes predictive values even if sensitivity and specificity remain fixed.",
    qs:[
      ["What is the positive predictive value in the described population?",["10%","33.3%","50%","90%"],"B","There are 90 true positives among 270 total positives, so 90/270 = 33.3%."],
      ["What is the probability that a person with a negative result actually has the condition?",["10/730","90/270","180/900","720/730"],"A","There are 10 false negatives among 730 total negative results."],
      ["If prevalence falls while test characteristics remain fixed, what generally happens to positive predictive value?",["It increases","It decreases","It equals sensitivity","It becomes independent of false positives"],"B","With fewer true cases, true positives form a smaller share of all positives."],
      ["Which change directly reduces the number of false positives among people without the condition?",["Higher sensitivity","Higher specificity","Higher prevalence","A larger sample alone"],"B","Specificity is the true-negative rate, so increasing it lowers the false-positive rate."],
      ["Why is the statement 'a positive result means a 90% chance of disease' incorrect here?",["It confuses sensitivity with the probability of disease given a positive result","Specificity must equal sensitivity","Prevalence cannot be used in probability","The test has no false negatives"],"A","Sensitivity conditions on disease; predictive value conditions on the observed positive result."],
    ]
  },
  {
    domain:"Computational Sciences", title:"Replication, Quorums and Consistency",
    text:"A replicated key-value store keeps N = 5 copies of each item. A write is acknowledged after W replicas confirm it, while a read queries R replicas and uses the newest version returned. If R + W > N, every read quorum overlaps every successful write quorum, assuming version metadata identifies the newest value. Larger quorums can improve consistency but may increase latency and reduce availability during failures. Configuration A uses W = 3 and R = 3. Configuration B uses W = 1 and R = 1. Network partitions can prevent some replicas from communicating, and overlapping quorums alone do not solve every conflict without suitable version handling.",
    qs:[
      ["Why does Configuration A guarantee read-write quorum overlap?",["R equals W","R + W = 6, which exceeds N = 5","N is an odd number","Each operation contacts every replica"],"B","Any sets of three replicas chosen from five must overlap when their sizes sum to more than five."],
      ["Compared with A, what is the principal advantage of Configuration B?",["Stronger consistency","Lower contact requirement and potentially lower latency","Guaranteed newest reads","Automatic conflict resolution"],"B","Only one replica must respond to each operation."],
      ["Which failure is possible under Configuration B?",["A read may contact a replica that missed the latest write","No write can ever complete","Every read contacts the last writer","R + W always exceeds N"],"A","The single read replica need not be the single replica that acknowledged the write."],
      ["If W is raised from 3 to 5 while R remains 3, what trade-off is most direct?",["Writes require more replicas and become less available during failures","Reads no longer overlap writes","Read latency must become zero","Version metadata becomes unnecessary"],"A","All five replicas must confirm a write, so one unavailable replica can block completion."],
      ["What additional mechanism is required to choose the newest value among overlapping responses?",["A smaller N","Version metadata or an ordering rule","R + W below N","Random selection"],"B","Overlap exposes versions; metadata is needed to identify their order."],
    ]
  },
  {
    domain:"Natural Sciences", title:"Measurement Uncertainty and Model Testing",
    text:"A sensor is used to test the model y = kx. Five repeated readings at the same input vary because of random error. Their mean reduces random fluctuation, while calibration against a trusted reference addresses systematic bias. If every reading is 2 units too high, repeating the measurement many times will not remove that offset. A residual is observed minus predicted value. Residuals scattered randomly around zero support the model more than residuals that grow steadily with x. Instrument resolution limits the smallest distinguishable change, and reported precision should not imply more information than the measurement provides.",
    qs:[
      ["What does averaging repeated readings primarily reduce?",["A constant calibration offset","Random error in the estimated mean","Instrument resolution itself","The model's number of parameters"],"B","Independent random fluctuations partially cancel in an average."],
      ["Which procedure best addresses readings that are consistently 2 units too high?",["Collect more readings only","Calibrate against a trusted reference","Round to more decimal places","Discard the mean"],"B","A fixed offset is systematic and requires calibration, not repetition alone."],
      ["Residuals increase from negative to positive as x grows. What is the strongest inference?",["The model may be missing curvature or another systematic effect","Random error has certainly vanished","The sensor has infinite resolution","The proportional model is proved"],"A","A structured residual pattern indicates model mismatch rather than random scatter."],
      ["A display resolves 0.1 units. Which report is least defensible without further information?",["12.4","12.4 ± 0.2","12.40000","Approximately 12.4"],"C","Extra decimal places imply precision beyond the instrument's resolution."],
      ["Which result most supports y = kx over the measured range?",["Residuals cluster randomly around zero","All residuals are positive and grow with x","Repeated values are identical because they were copied","The fitted line ignores uncertainty"],"A","Random zero-centred residuals show no obvious systematic departure."],
    ]
  },
  {
    domain:"Engineering", title:"Feedback Control and Stability",
    text:"A negative-feedback controller compares a target r with measured output y and acts on the error e = r - y. Proportional control applies u = Kp e. Raising Kp usually reduces steady error and speeds response, but excessive gain can cause overshoot or instability when delays are present. Integral action accumulates error and can remove persistent offset, yet it may worsen overshoot. Derivative action responds to the rate of change and can add damping, but measurement noise makes an unfiltered derivative term problematic. A temperature loop shows a constant 3-degree error under proportional control and oscillates after Kp is doubled.",
    qs:[
      ["Which action most directly targets the persistent 3-degree offset?",["Integral action","Removing the sensor","Increasing delay","Derivative action alone at steady state"],"A","Integral action accumulates sustained error and drives the offset toward zero."],
      ["What does the oscillation after doubling Kp suggest?",["The loop has become less damped and may be near instability","The target is irrelevant","The sensor has no output","Integral gain is necessarily zero"],"A","Higher proportional gain can amplify delayed corrective action and reduce stability margin."],
      ["Why might raw derivative action be unsuitable with a noisy sensor?",["It amplifies rapid measurement changes","It removes every transient","It cannot use an error signal","It always creates steady offset"],"A","Differentiation gives large responses to fast noise fluctuations."],
      ["At an instant r = 50, y = 46 and Kp = 2, what is proportional command u?",["2","4","8","96"],"C","e = 50 - 46 = 4 and u = 2 x 4 = 8."],
      ["Which redesign is best supported by the passage?",["Increase Kp without limit","Tune gain with delay in mind and introduce integral/filtered derivative action cautiously","Delete feedback and assume the output","Use derivative action without filtering"],"B","The stated trade-offs require balanced tuning rather than maximizing one gain."],
    ]
  },
  {
    domain:"Business Administration", title:"Discounted Cash Flow and Project Choice",
    text:"Net present value discounts future cash flows because a euro received later is worth less than a euro received now. For a one-period project, NPV = -I0 + C1/(1+r), where I0 is the initial investment, C1 the future cash flow and r the discount rate. A positive NPV adds value under the model. Project X costs EUR 100 now and pays EUR 115 after one year. Project Y costs EUR 200 now and pays EUR 226 after one year. Capital is limited to EUR 200, projects cannot be divided, and the appropriate discount rate is 10%. Risk and later cash flows are otherwise ignored.",
    qs:[
      ["What is Project X's NPV to the nearest cent?",["EUR -5.45","EUR 0","EUR 4.55","EUR 15"],"C","-100 + 115/1.10 = EUR 4.55."],
      ["What is Project Y's NPV to the nearest cent?",["EUR -5.45","EUR 0","EUR 5.45","EUR 26"],"C","-200 + 226/1.10 = EUR 5.45."],
      ["If only one project can be chosen, which maximizes value under the stated model?",["X because its percentage return is higher","Y because its NPV is higher","Neither because both require investment","They are equivalent because both are positive"],"B","For mutually exclusive choices under this model, the larger absolute NPV adds more value."],
      ["If the discount rate rises sufficiently, what happens to both NPVs?",["They rise","They fall because discounted future cash flows shrink","They remain fixed","They equal the future cash flows"],"B","A larger denominator lowers each present value."],
      ["Which omitted factor could invalidate the comparison most directly?",["Different project risk requiring different discount rates","Writing EUR before every number","The fact that 200 exceeds 100","Using one-year cash flows"],"A","A common discount rate may be inappropriate if project risks differ."],
    ]
  },
  {
    domain:"Economics", title:"Comparative Advantage and Opportunity Cost",
    text:"Two countries each have 100 labour hours. In one hour, North can produce 4 units of software services or 2 units of machinery; South can produce 3 units of software services or 3 units of machinery. The opportunity cost of one software unit is the machinery output forgone. Comparative advantage depends on lower opportunity cost, not on producing more of everything. With constant productivity and no transaction costs, specialization and trade can permit consumption beyond each country's own production frontier, but the terms of trade must fall between the countries' opportunity costs for both to gain.",
    qs:[
      ["What is North's opportunity cost of one software unit?",["0.5 machinery units","1 machinery unit","2 machinery units","4 machinery units"],"A","In the time for four software units North forgoes two machinery units, or 0.5 per software unit."],
      ["What is South's opportunity cost of one software unit?",["0.5 machinery units","1 machinery unit","1.5 machinery units","3 machinery units"],"B","South gives up three machinery units to produce three software units."],
      ["Which country has comparative advantage in software services?",["North, because 0.5 machinery units is the lower opportunity cost","South, because it produces equal quantities","South, because its machinery productivity is higher","Neither"],"A","Comparative advantage follows the lower opportunity cost."],
      ["Which exchange rate could benefit both countries?",["1 software for 0.25 machinery","1 software for 0.75 machinery","1 software for 1.5 machinery","1 software for 2 machinery"],"B","A mutually beneficial term lies between 0.5 and 1 machinery units per software unit."],
      ["Why does North's higher software productivity not by itself settle every specialization decision?",["Absolute productivity and comparative advantage are identical","Opportunity costs, not output levels alone, determine comparative advantage","Trade requires equal wages","Machinery cannot be traded"],"B","Relative sacrifices determine comparative advantage."],
    ]
  },
];

const subjectQuestions = [];
passages.forEach((passage, pIndex) => passage.qs.forEach((q, qIndex) => {
  subjectQuestions.push({
    id:`subject-${subjectQuestions.length+1}`, type:"subject", difficulty:qIndex < 3 ? "application" : "evaluation",
    passage:{domain:passage.domain,title:passage.title,text:passage.text}, prompt:q[0], options:q[1], correct:q[2], explanation:q[3], passageIndex:pIndex,
  });
}));

const sections = [
  {id:"figure", baseId:"figure", short:"Figures", title:"Figure Sequences", time:25*60, questions:makeFigureAdvancedFullSet(), max:40, description:"Track multiple movement, colour and orientation rules. Predict matrices 5 and 6."},
  {id:"equation", baseId:"equation", short:"Equations", title:"Mathematical Equations", time:25*60, questions:makeEquationAdvancedFullSet(), max:20, description:"Solve medium/high systems with three or four constrained values."},
  {id:"latin", baseId:"latin", short:"Latin", title:"Latin Squares", time:25*60, questions:latinQuestions, max:20, description:"Complete linked medium/high 5 x 5 letter constraints mentally."},
  {id:"subject", baseId:"subject", short:"Academic", title:"General Academic Module", time:90*60, questions:subjectQuestions, max:70, description:"Apply information from fourteen academic sources, formulas and scenarios."},
];

const dailySetConfigs = [
  ["Quantitative foundations","Probability and search systems"],
  ["Science and engineering","Energy and electrical reasoning"],
  ["Business decisions","Break-even and elasticity"],
  ["Evidence and argument","Research design and historical sources"],
  ["Advanced inference","Bayesian decisions and distributed systems"],
  ["Systems thinking","Measurement and feedback control"],
  ["Strategic analysis","Discounted cash flow and comparative advantage"],
];

function buildDailySections(day) {
  const sourceIndexes=new Set([day*2,day*2+1]);
  const academicQuestions=subjectQuestions.filter(q=>sourceIndexes.has(q.passageIndex)).map((q,i)=>({...q,id:`daily-${day+1}-subject-${i+1}`}));
  return [
    {id:`daily-${day+1}-figure`,baseId:"figure",short:"Figures",title:`Figure Sequences / Day ${day+1}`,time:8*60,questions:makeFigurePracticeSet(day),description:"Six original medium/high visual sequences."},
    {id:`daily-${day+1}-equation`,baseId:"equation",short:"Equations",title:`Mathematical Equations / Day ${day+1}`,time:8*60,questions:makeEquationPracticeSet(day),description:"Six original three- and four-variable systems."},
    {id:`daily-${day+1}-latin`,baseId:"latin",short:"Latin",title:`Latin Squares / Day ${day+1}`,time:8*60,questions:makeLatinPracticeSet(day),description:"Six medium/high row-column constraints."},
    {id:`daily-${day+1}-subject`,baseId:"subject",short:"Academic",title:`General Academic / Day ${day+1}`,time:15*60,questions:academicQuestions,description:"Two source tasks with ten application/evaluation questions."},
  ];
}

const state = {
  screen:"landing",
  session:null,
  active:null,
  pendingSection:null,
  breakData:null,
  allResults:{},
  modal:null,
  timerId:null,
  toast:null,
};

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

function moduleVolume(section) {
  if (sectionKind(section) === "figure") return `${section.questions.length} series`;
  if (sectionKind(section) === "subject") return `${new Set(section.questions.map(q=>q.passageIndex)).size} source tasks / ${section.questions.length} questions`;
  return `${section.questions.length} tasks`;
}

function sectionKind(section) { return section?.baseId||section?.id; }
function sessionSections() { return state.session?.sectionPool||sections; }

function render() {
  clearInterval(state.timerId);
  $$(".modal-backdrop, .toast", document.body).forEach(el => el.remove());
  if (state.screen === "landing") renderLanding();
  else if (state.screen === "instructions") renderInstructions();
  else if (state.screen === "break") renderBreak();
  else if (state.screen === "exam") renderExam();
  else renderResults();
  if (state.modal) renderModal();
  if (state.toast) renderToast();
}

function renderLanding() {
  document.title = "dMAT General Academic Practice";
  $("#app").innerHTML = `
    <main class="page">
      <div class="container">
        <header class="topbar">
          <div class="brand"><span class="brand-mark">dM</span><span>dMAT Practice<small>General Academic Module</small></span></div>
          <div class="unofficial">Original unofficial preparation set</div>
        </header>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">Interactive localhost mock test</div>
            <h1>Train the format.<br>Build the speed.</h1>
            <p>A complete digital practice environment based on the official General Academic mechanics: timed sections, no-note simulation, navigation, flags, scoring and worked review.</p>
            <div class="hero-actions">
              <button class="btn btn-primary" data-action="start-full">Start real-test simulation</button>
              <button class="btn btn-secondary" data-action="scroll-daily">Daily practice sets</button>
              <button class="btn btn-secondary" data-action="scroll-sections">Choose a section</button>
              <button class="btn btn-secondary" data-action="scroll-plan">View 2027 application plan</button>
            </div>
            <div class="note"><span class="note-dot"></span><span>Real flow: Core Module (about 90 minutes including instructions) + 30-minute break + 90-minute General Academic Module.</span></div>
          </div>
          <aside class="hero-card" aria-label="Test structure">
            ${sections.map((s,i) => `<div class="module-row"><div class="module-icon">${i+1}</div><div><div class="module-title">${s.title}</div><div class="module-meta">${moduleVolume(s)}</div></div><div class="module-time">${Math.round(s.time/60)} min</div></div>`).join("")}
          </aside>
        </section>
        <section class="format-comparison" aria-labelledby="format-comparison-title">
          <div class="format-comparison-heading">
            <div>
              <div class="eyebrow">Know the real format</div>
              <h2 id="format-comparison-title">Demo version vs real test</h2>
            </div>
            <span class="format-badge">Important distinction</span>
          </div>
          <p class="format-intro">The official preparation demo teaches the task mechanics. The real dMAT uses a fixed sequence, fixed processing times and substantially more tasks.</p>
          <div class="comparison-table-wrap">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Test feature</th>
                  <th scope="col"><span class="column-kicker">Preparation</span>Demo version</th>
                  <th scope="col"><span class="column-kicker">Exam day</span>Real test</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Module sequence</th>
                  <td><strong>Selectable</strong><span>You choose the order.</span></td>
                  <td><strong>Defined</strong><span>Core module, then specialist module.</span></td>
                </tr>
                <tr>
                  <th scope="row">Subtest processing times</th>
                  <td><strong>Unlimited</strong><span>Work through the demonstration at your own pace.</span></td>
                  <td><strong>Determined</strong><span>Each subtest has a fixed time limit.</span></td>
                </tr>
                <tr>
                  <th scope="row">Number of tasks</th>
                  <td>
                    <strong>Short demonstration</strong>
                    <span>Each core subtest: <b>6 tasks</b></span>
                    <span>Per subject module: <b>4 tasks</b></span>
                  </td>
                  <td>
                    <strong>Full test volume</strong>
                    <span>Each core subtest: <b>20 tasks</b></span>
                    <span>Per subject module: <b>8–15 tasks</b></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="comparison-callout"><span aria-hidden="true">!</span><p><strong>Train for the real workload.</strong> Do not estimate exam speed from the shorter official demo alone. Live-test questions are confidential, so this simulator uses original medium/high material calibrated to the documented task mechanics.</p></div>
        </section>
        <section class="section daily-practice" id="daily-practice">
          <div class="section-heading"><div class="eyebrow">Seven-day practice cycle</div><h2>A fresh complete set every day</h2><p>Each 39-minute set covers all four sections with original medium/high questions. Finish the set in one sitting to unlock section, difficulty, knowledge-area and pacing analysis.</p></div>
          <div class="daily-grid">${dailySetConfigs.map((set,day)=>`<article class="daily-card"><div class="daily-card-top"><span class="day-number">${String(day+1).padStart(2,"0")}</span><span class="difficulty-pair">MEDIUM / HIGH</span></div><h3>${escapeHTML(set[0])}</h3><p>${escapeHTML(set[1])}</p><div class="daily-volume"><span><b>6</b> Figures</span><span><b>6</b> Equations</span><span><b>6</b> Latin</span><span><b>10</b> Academic</span></div><button class="btn btn-secondary" data-action="start-daily" data-day="${day}">Start Day ${day+1}</button></article>`).join("")}</div>
          <div class="cycle-note"><strong>Recommended:</strong> complete Days 1-6 as training, review every error, then use Day 7 as a closed-book weekly checkpoint.</div>
        </section>
        <section class="section" id="sections">
          <div class="section-heading"><div class="eyebrow">Section practice</div><h2>Work one skill at a time</h2><p>Each section is timed exactly as described in the official preparation material. Solutions remain hidden until submission.</p></div>
          <div class="start-grid">
            ${sections.map((s,i) => `<article class="start-card"><span class="pill">${s.time/60} minutes</span><h3>${s.title}</h3><p>${s.description}</p><button class="btn btn-secondary" data-action="start-section" data-section="${s.id}">Start section</button></article>`).join("")}
          </div>
        </section>
        <section class="section application-plan" id="application-plan">
          <div class="target-banner">
            <div>
              <div class="eyebrow target-eyebrow">Recommended target</div>
              <h2>One portfolio, four countries, Autumn 2027</h2>
              <p>Target Germany Winter Semester 2027/28 plus the Netherlands, Ireland and Scotland September 2027 intakes. Treat Germany Summer 2027 as a stretch only if your English score and complete application documents are ready by October 2026.</p>
            </div>
            <div class="target-date"><strong>SEP/OCT</strong><span>2027 start</span></div>
          </div>

          <div class="section-heading plan-heading"><div class="eyebrow">Master timeline</div><h2>What to do, and when</h2><p>This schedule assumes an Indian Master's applicant starting on 5 September 2026 and requiring the dMAT General Academic Module.</p></div>
          <div class="timeline">
            <article class="timeline-item urgent"><div class="timeline-date">Now–15 Sep 2026</div><div><h3>Lock the mandatory items</h3><p>Register for dMAT and choose a test centre. Submit the complete APS document package now if APS applies; the dMAT certificate can be added later. Book an accepted English test and request transcripts and references.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">16–26 Sep</div><div><h3>dMAT sprint</h3><p>Complete timed practice, error review and two full simulations. Sit dMAT on 26 September.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">27 Sep–12 Oct</div><div><h3>Build the application engine</h3><p>Prepare a programme spreadsheet, CV, master SOP, recommendation pack and finance plan. Shortlist 12–16 programmes across the four countries.</p></div></article>
            <article class="timeline-item milestone"><div class="timeline-date">12 Oct</div><div><h3>dMAT result day</h3><p>Download the certificate and send it to APS immediately. APS can issue the certificate only after checking the dMAT result.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">Oct–Nov 2026</div><div><h3>English score + early applications</h3><p>Finish IELTS/TOEFL/PTE as accepted by each programme. Tailor the SOP and submit strong early applications in the Netherlands, Ireland and Scotland as portals open.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">Dec 2026–14 Jan 2027</div><div><h3>First major submission wave</h3><p>Finish selective Dutch programmes and early scholarship applications. Submit any genuinely suitable Germany Summer 2027 stretch applications.</p></div></article>
            <article class="timeline-item deadline"><div class="timeline-date">15 Jan 2027</div><div><h3>Dutch numerus-fixus checkpoint</h3><p>This is the national general deadline for numerus-fixus programmes; programme-specific and non-EEA deadlines may be earlier.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">Feb–Mar</div><div><h3>Offers, interviews and backups</h3><p>Reply to information requests, compare total cost and outcomes, and submit remaining Ireland/Scotland applications. Keep deposits and refund rules in view.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">Apr–May</div><div><h3>Dutch final window + German launch</h3><p>Complete Dutch applications before the institution's deadline. Start Germany Winter 2027/28 applications and any required uni-assist VPD early.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">May–Jun</div><div><h3>Finish Germany early</h3><p>Aim to submit at least eight weeks before the stated deadline. Do not wait for the common 15 July date because many Master's and non-EU deadlines are earlier.</p></div></article>
            <article class="timeline-item"><div class="timeline-date">Jun–Aug</div><div><h3>Choose, fund, visa and house</h3><p>Accept one offer, meet deposit conditions, assemble regulated proof of funds, start the correct visa/residence process, and secure accommodation.</p></div></article>
            <article class="timeline-item milestone"><div class="timeline-date">Sep–Oct 2027</div><div><h3>Arrival and enrolment</h3><p>Travel only after permission is granted. Complete university enrolment and the required local residence registration.</p></div></article>
          </div>

          <div class="section-heading country-heading"><div class="eyebrow">Country playbooks</div><h2>Full process from shortlist to arrival</h2><p>dMAT and APS belong to the Germany route. The other three countries use their own university and immigration processes.</p></div>
          <div class="country-grid">
            <details class="country-card" open>
              <summary><span class="country-code">DE</span><span><strong>Germany</strong><small>Winter Semester 2027/28</small></span></summary>
              <ol>
                <li><strong>Verify eligibility:</strong> check your institution and degree in anabin, then match your Bachelor's modules and credits to every Master's prerequisite.</li>
                <li><strong>Complete dMAT + APS:</strong> register by 15 September 2026, test on 26 September, receive the certificate on 12 October, and add it to the APS file. Send all other APS documents in the initial package.</li>
                <li><strong>Apply:</strong> use the university portal, uni-assist, or obtain a VPD if the programme requires it. The common winter deadline is often 15 July, but Master's/non-EU deadlines may be earlier.</li>
                <li><strong>After admission:</strong> accept the place, arrange health insurance and proof of funds, and organise accommodation. The 2026 blocked-account reference is €11,904; recheck the 2027 figure.</li>
                <li><strong>Visa and arrival:</strong> apply online through the Consular Services Portal, then complete the VFS/mission appointment with admission, APS, passport, finance, insurance and language evidence. Enrol and register locally after arrival.</li>
              </ol>
              <div class="source-links"><a href="https://aps-india.de/dmat/" target="_blank" rel="noreferrer">APS/dMAT rules</a><a href="https://www.uni-assist.de/en/how-to-apply/plan-your-application/deadlines-processing-time/" target="_blank" rel="noreferrer">uni-assist deadlines</a><a href="https://india.diplo.de/in-en/service/2756350-2756350" target="_blank" rel="noreferrer">German study visa</a></div>
            </details>

            <details class="country-card">
              <summary><span class="country-code">NL</span><span><strong>Netherlands</strong><small>September 2027</small></span></summary>
              <ol>
                <li><strong>Choose and check:</strong> select an accredited Master's and read its exact diploma, subject-credit, GPA and English requirements.</li>
                <li><strong>Apply:</strong> most programmes begin with Studielink and then use an institution portal. General national dates are 15 January for numerus fixus and 1 May for other programmes, but non-EEA and programme deadlines can be earlier.</li>
                <li><strong>Accept and fund:</strong> satisfy conditions, pay the required tuition/deposit and provide the institution's immigration documents. The 2026 study norm is €1,130.77 per month for 12 months, excluding tuition; recheck for 2027.</li>
                <li><strong>Residence process:</strong> the recognised-sponsor institution applies for the MVV and residence permit. Legal decision time is 60 days. Official foreign documents may need legalisation and translation.</li>
                <li><strong>Travel:</strong> after approval, collect the MVV sticker within three months; it is valid for 90 days. Travel, collect the residence permit and complete any instructed TB or municipal registration steps.</li>
              </ol>
              <div class="source-links"><a href="https://www.studyinnl.org/plan-your-stay/how-to-apply" target="_blank" rel="noreferrer">Study in NL</a><a href="https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education" target="_blank" rel="noreferrer">IND student permit</a><a href="https://ind.nl/en/required-amounts-income-requirements" target="_blank" rel="noreferrer">IND funds</a></div>
            </details>

            <details class="country-card">
              <summary><span class="country-code">IE</span><span><strong>Ireland</strong><small>September 2027</small></span></summary>
              <ol>
                <li><strong>Choose:</strong> confirm the full-time Master's and institution are eligible for non-EEA student immigration and that your academic and English profile meets the university rules.</li>
                <li><strong>Apply directly:</strong> most institutions take applications on their own websites. Upload academics, English result, CV, SOP, references and any requested portfolio; apply in the October–January wave where possible.</li>
                <li><strong>Accept:</strong> meet conditions and pay the required deposit. For the study visa, courses costing under €6,000 must be paid in full; above €6,000, at least €6,000 must normally be paid before applying.</li>
                <li><strong>Long-stay D visa:</strong> apply through AVATS no earlier than three months before travel. Include the acceptance letter, fee evidence, academics, English proof, explanation of study/employment gaps, private medical insurance and finances.</li>
                <li><strong>Finance and arrival:</strong> current rules require immediate access to at least €10,000 plus tuition, supported by the required evidence such as six months of bank activity. After arrival, register immigration permission within 90 days.</li>
              </ol>
              <div class="source-links"><a href="https://www.educationinireland.com/en/plan-your-study-abroad/the-application-process" target="_blank" rel="noreferrer">Application process</a><a href="https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/" target="_blank" rel="noreferrer">Long-stay study visa</a><a href="https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/a-fee-paying-private-primary-or-secondary-school/information-on-student-finances/" target="_blank" rel="noreferrer">Finance evidence</a></div>
            </details>

            <details class="country-card">
              <summary><span class="country-code">SCT</span><span><strong>Scotland (UK)</strong><small>September 2027</small></span></summary>
              <ol>
                <li><strong>Choose:</strong> check each Scottish university's entry and English requirements. Many postgraduate programmes take direct applications and set their own deadlines.</li>
                <li><strong>Apply:</strong> submit academics, English proof, CV, statement and references. Apply October–January for the strongest course and scholarship access even if a later deadline is advertised.</li>
                <li><strong>Accept + CAS:</strong> meet all offer conditions and deposit requirements. The university issues a Confirmation of Acceptance for Studies only when it is ready to sponsor the visa.</li>
                <li><strong>Pre-visa checks:</strong> obtain ATAS if your subject/CAS requires it and a valid TB certificate from a UK-approved clinic in India. Prepare tuition plus living funds held for the prescribed 28-day period.</li>
                <li><strong>Student visa:</strong> the current outside-London maintenance figure is £1,171 per month for up to nine months, plus outstanding first-year fees. Apply up to six months before the course; current standard decisions are usually about three weeks. Pay the visa fee and immigration health surcharge at the current rate.</li>
              </ol>
              <div class="source-links"><a href="https://www.scotland.org/study/how-to-apply" target="_blank" rel="noreferrer">Apply in Scotland</a><a href="https://www.gov.uk/student-visa/course" target="_blank" rel="noreferrer">CAS and eligibility</a><a href="https://www.gov.uk/student-visa/money" target="_blank" rel="noreferrer">UK finance rules</a><a href="https://www.gov.uk/tb-test-visa/countries-where-you-need-a-tb-test-to-enter-the-uk" target="_blank" rel="noreferrer">TB requirement</a></div>
            </details>
          </div>

          <div class="portfolio-card">
            <div><div class="eyebrow">Application mix</div><h3>Build a 12–16 programme portfolio</h3><p>Use prerequisites—not rankings—to classify each programme. A sensible starting split is 5–6 Germany, 3–4 Netherlands, 2–3 Ireland and 2–3 Scotland, with ambitious, realistic and safer choices in every group.</p></div>
            <div class="portfolio-counts"><span><strong>5–6</strong>Germany</span><span><strong>3–4</strong>Netherlands</span><span><strong>2–3</strong>Ireland</span><span><strong>2–3</strong>Scotland</span></div>
          </div>
          <p class="plan-footnote">Official amounts and immigration rules shown are current on 5 September 2026. Recheck every figure and deadline before a 2027 payment or submission.</p>
        </section>
      </div>
    </main>`;
  bindCommonActions();
}

function bindCommonActions() {
  $$('[data-action="start-full"]').forEach(b => b.onclick = () => beginSession("full", sections.map(s=>s.id)));
  $$('[data-action="start-section"]').forEach(b => b.onclick = () => beginSession("section", [b.dataset.section]));
  $$('[data-action="start-daily"]').forEach(b => b.onclick = () => {const pool=buildDailySections(Number(b.dataset.day));beginSession("daily",pool.map(s=>s.id),pool);});
  $$('[data-action="scroll-sections"]').forEach(b => b.onclick = () => $("#sections").scrollIntoView({behavior:"smooth"}));
  $$('[data-action="scroll-daily"]').forEach(b => b.onclick = () => $("#daily-practice").scrollIntoView({behavior:"smooth"}));
  $$('[data-action="scroll-plan"]').forEach(b => b.onclick = () => $("#application-plan").scrollIntoView({behavior:"smooth"}));
}

function beginSession(mode, order, sectionPool=sections) {
  state.session = {mode, order, sectionPool, cursor:0, startedAt:Date.now(), breakSeconds:0};
  state.allResults = {};
  if (mode === "full" || mode === "daily") showInstructions(order[0]);
  else startSection(order[0]);
}

function showInstructions(sectionId) {
  state.pendingSection = sectionId;
  state.active = null;
  state.screen = "instructions";
  state.modal = null;
  render();
}

function renderInstructions() {
  const pool=sessionSections();
  const section = pool.find(s => s.id === state.pendingSection);
  const index = state.session.order.indexOf(section.id);
  const isFirst = index === 0;
  const kind=sectionKind(section);
  const isSubject = kind === "subject";
  const isDaily=state.session.mode==="daily";
  const stage = isDaily?`Daily Practice / Part ${index+1} of 4`:isSubject ? "Subject Module" : `Core Module / Subtest ${index + 1} of 3`;
  const rules = {
    figure:["Track position, colour and orientation independently.","Choose one response for Matrix 5 and one for Matrix 6.",`${section.questions.length} series / ${Math.round(section.time/60)} minutes.`],
    equation:["Every letter is an integer from 1 to 20.","Enter values that satisfy every equation in the system.",`${section.questions.length} systems / ${Math.round(section.time/60)} minutes.`],
    latin:["Each letter A-E occurs once in every row and column.","Resolve the question mark without writing notes.",`${section.questions.length} tasks / ${Math.round(section.time/60)} minutes.`],
    subject:["Read each source and answer its single-choice questions.","Sources may use text, formulas, tables or quantitative information.",`${new Set(section.questions.map(q=>q.passageIndex)).size} source tasks / ${section.questions.length} questions / ${Math.round(section.time/60)} minutes.`],
  }[kind];
  document.title = `${section.title} instructions | dMAT Simulation`;
  $("#app").innerHTML = `<main class="briefing-page"><div class="briefing-shell">
    <header class="briefing-top"><div class="brand"><span class="brand-mark">dM</span><span>${isDaily?"dMAT Daily Practice":"dMAT Simulation"}<small>General Academic Module</small></span></div><span class="live-label">${isDaily?"DAILY MODE":"EXAM MODE"}</span></header>
    <div class="sequence-strip" aria-label="Fixed test sequence">${pool.map((s,i)=>`<span class="${i<index?"done":i===index?"current":""}"><b>${i+1}</b>${escapeHTML(s.short)}</span>`).join("")}</div>
    <section class="briefing-card">
      <div class="eyebrow">${stage}</div><h1>${escapeHTML(section.title)}</h1>
      <div class="briefing-metrics"><span><strong>${Math.round(section.time/60)}</strong>minutes</span><span><strong>${isSubject?new Set(section.questions.map(q=>q.passageIndex)).size:section.questions.length}</strong>${isSubject?"source tasks":kind==="figure"?"series":"tasks"}</span><span><strong>${index+1}/4</strong>${isDaily?"daily part":"test stage"}</span></div>
      ${isFirst?`<div class="exam-warning"><strong>${isDaily?"Daily-set protocol":"Simulation protocol"}</strong><p>The order is fixed. Every section is automatically submitted at zero. Solutions remain locked until the entire set ends. Do not use notes, a calculator, a phone or outside help.</p></div>`:""}
      <h2>Short processing reminder</h2><ul class="instruction-list">${rules.map(rule=>`<li>${escapeHTML(rule)}</li>`).join("")}</ul>
      <p class="briefing-note">The timer begins only after you press the button below. ${isDaily?"All questions in this cycle are medium or high difficulty.":"Difficulty labels are hidden in exam mode."}</p>
      <div class="briefing-actions"><button class="btn btn-ghost" data-action="abort-before">${isDaily?"Exit set":"Exit simulation"}</button><button class="btn btn-primary" data-action="begin-timed">Begin timed ${isDaily?"section":"subtest"}</button></div>
    </section>
  </div></main>`;
  window.scrollTo(0,0);
  $("[data-action='abort-before']").onclick = () => { state.screen="landing"; state.session=null; state.pendingSection=null; render(); };
  $("[data-action='begin-timed']").onclick = () => startSection(section.id);
}

function startSection(sectionId) {
  const section = sessionSections().find(s => s.id === sectionId);
  const now = Date.now();
  state.active = {sectionId, index:0, answers:{}, flags:new Set(), startedAt:now, endAt:now+section.time*1000, questionTimes:{}, viewStartedAt:now};
  state.pendingSection = null;
  state.screen = "exam";
  state.modal = null;
  render();
  window.scrollTo(0,0);
}

function startBreak() {
  const now = Date.now();
  state.breakData = {startedAt:now, endAt:now+30*60*1000};
  state.active = null;
  state.screen = "break";
  state.modal = null;
  render();
}

function finishBreak() {
  if (!state.breakData) return;
  state.session.breakSeconds = Math.min(30*60, Math.max(0, Math.round((Date.now()-state.breakData.startedAt)/1000)));
  state.breakData = null;
  showInstructions("subject");
}

function updateBreakTimer() {
  const el = $("#break-timer"); if (!el || !state.breakData) return;
  const remaining = Math.max(0, Math.ceil((state.breakData.endAt-Date.now())/1000));
  el.textContent = `${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
  if (remaining <= 0) { clearInterval(state.timerId); $("[data-action='finish-break']").textContent = "Break complete - continue"; }
}

function renderBreak() {
  document.title = "30-minute break | dMAT Simulation";
  $("#app").innerHTML = `<main class="break-page"><div class="break-card"><div class="brand break-brand"><span class="brand-mark">dM</span><span>dMAT Simulation<small>Core Module complete</small></span></div><div class="break-icon">II</div><div class="eyebrow">Official interval</div><h1>30-minute break</h1><p>Your Core Module answers are locked. Step away from the screen and return before the countdown reaches zero.</p><div class="break-timer" id="break-timer">30:00</div><button class="btn btn-primary" data-action="finish-break">End break and continue</button><small>Continuing early records the shorter break in your final report.</small></div></main>`;
  window.scrollTo(0,0);
  $("[data-action='finish-break']").onclick = finishBreak;
  updateBreakTimer();
  state.timerId = setInterval(updateBreakTimer,1000);
}

function renderExam() {
  const section = currentSection();
  const q = section.questions[state.active.index];
  const completed = section.questions.filter(item => isAnswered(item, state.active.answers[item.id])).length;
  const pct = completed / section.questions.length * 100;
  const isSimulation = state.session?.mode === "full";
  const isDaily=state.session?.mode === "daily";
  const stageLabel = isDaily?`Daily Set / Part ${state.session.cursor+1} of 4`:sectionKind(section) === "subject" ? "Subject Module" : `Core Module / ${state.session.cursor + 1} of 3`;
  document.title = `${section.title} | ${isSimulation?"dMAT Simulation":"dMAT Practice"}`;
  $("#app").innerHTML = `
    <main class="exam-page">
      <header class="exam-header">
        <div class="container exam-header-main">
          <div class="exam-brand">${section.title}<small>${isSimulation||isDaily ? `${isSimulation?"Live simulation":"Timed daily practice"} / ${stageLabel}` : "Focused section practice"}</small></div>
          <div class="timer" id="timer" aria-label="Time remaining">--:--</div>
          <div class="exam-actions"><button class="btn" data-action="exit">${isSimulation?"Abort":"Exit"}</button><button class="btn" data-action="submit">${isSimulation?"End subtest":"Submit section"}</button></div>
        </div>
        <div class="progress-line"><div class="progress-fill" style="width:${pct}%"></div></div>
      </header>
      <div class="container exam-layout">
        <aside class="question-sidebar">
          <div class="sidebar-title">${completed}/${section.questions.length} answered</div>
          <div class="question-grid">${section.questions.map((item,i) => `<button class="q-dot ${i===state.active.index?"current":""} ${isAnswered(item,state.active.answers[item.id])?"answered":""} ${state.active.flags.has(item.id)?"flagged":""}" data-goto="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join("")}</div>
          <div class="legend"><span><i class="l-answered"></i>Answered</span><span><i class="l-current"></i>Current</span><span><i style="box-shadow:inset 0 0 0 2px var(--gold)"></i>Flagged</span></div>
        </aside>
        <section class="question-panel">
          <div class="question-top"><div class="question-number">Question ${state.active.index+1} of ${section.questions.length}</div>${isSimulation?`<div class="exam-mode-chip">EXAM MODE</div>`:`<div class="difficulty">${q.difficulty}</div>`}</div>
          ${renderQuestion(q)}
          <footer class="question-footer">
            <button class="btn btn-ghost flag-btn ${state.active.flags.has(q.id)?"active":""}" data-action="flag">${state.active.flags.has(q.id)?"Flagged":"Flag for review"}</button>
            <div><button class="btn btn-secondary" data-action="previous" ${state.active.index===0?"disabled":""}>Previous</button><button class="btn btn-primary" data-action="next">${state.active.index===section.questions.length-1?"Review section":"Next"}</button></div>
          </footer>
        </section>
      </div>
    </main>`;
  bindExamActions(q);
  updateTimer();
  state.timerId = setInterval(updateTimer, 1000);
  state.active.viewStartedAt = Date.now();
  if (q.type === "figure") requestAnimationFrame(drawAllMatrices);
}

function currentSection() { return sessionSections().find(s => s.id === state.active.sectionId); }

function isAnswered(q, answer) {
  if (!answer) return false;
  if (q.type === "figure") return Boolean(answer.m5 && answer.m6);
  if (q.type === "equation") return q.vars.every(v => answer[v] !== undefined && answer[v] !== "");
  return Boolean(answer);
}

function renderQuestion(q) {
  if (q.type === "figure") return renderFigure(q);
  if (q.type === "equation") return renderEquation(q);
  if (q.type === "latin") return renderLatin(q);
  return renderSubject(q);
}

function renderFigure(q) {
  const answer = state.active.answers[q.id] || {};
  return `<div class="prompt">Determine matrices 5 and 6.</div><p class="subprompt">Track every figure separately. Select one option in each group.</p>
    <div class="matrix-series">${[0,1,2,3].map(t=>`<div class="matrix-wrap"><canvas class="matrix" data-matrix="frame" data-t="${t}"></canvas><span>Matrix ${t+1}</span></div>`).join("")}<div class="matrix-wrap"><div class="matrix question-mark">?</div><span>Matrix 5</span></div><div class="matrix-wrap"><div class="matrix question-mark">?</div><span>Matrix 6</span></div></div>
    <div class="matrix-groups">${[5,6].map(target=>`<div class="matrix-group"><h3>Matrix ${target} options</h3><div class="matrix-options">${[0,1,2].map(i=>`<button class="matrix-option ${answer[`m${target}`]==="ABC"[i]?"selected":""}" data-figure-target="m${target}" data-choice="${"ABC"[i]}"><canvas data-matrix="option" data-target="${target}" data-option="${i}"></canvas><strong>${"ABC"[i]}</strong></button>`).join("")}</div></div>`).join("")}</div>`;
}

function renderEquation(q) {
  const answer = state.active.answers[q.id] || {};
  return `<div class="prompt">Find the value of every letter.</div><p class="subprompt">Each letter is an integer from 1 to 20. All equations must be correct.</p><div class="equations">${q.equations.map(e=>`<div class="equation">${escapeHTML(e)}</div>`).join("")}</div><div class="value-grid">${q.vars.map(v=>`<div class="value-field"><label for="value-${v}">${v}</label><input id="value-${v}" type="number" min="1" max="20" inputmode="numeric" data-var="${v}" value="${answer[v]??""}" placeholder="1-20"></div>`).join("")}</div>`;
}

function renderLatin(q) {
  const answer = state.active.answers[q.id] || "";
  return `<div class="prompt">Which letter replaces the question mark?</div><p class="subprompt">A-E must each appear once in every row and column.</p><div class="latin-area"><div class="latin-grid">${q.grid.flat().map(v=>`<div class="latin-cell ${v==="?"?"target":""}">${v}</div>`).join("")}</div><div><div class="latin-choices">${[...LETTERS].map(l=>`<button class="latin-choice ${answer===l?"selected":""}" data-latin="${l}">${l}</button>`).join("")}</div></div></div>`;
}

function renderSubject(q) {
  const answer = state.active.answers[q.id] || "";
  return `<article class="passage"><div class="passage-tag">${escapeHTML(q.passage.domain)}</div><h2>${escapeHTML(q.passage.title)}</h2><p>${escapeHTML(q.passage.text)}</p></article><div class="prompt">${escapeHTML(q.prompt)}</div><div class="option-list">${q.options.map((opt,i)=>`<button class="option ${answer===OPTION_LETTERS[i]?"selected":""}" data-subject="${OPTION_LETTERS[i]}"><span class="option-letter">${OPTION_LETTERS[i]}</span><span>${escapeHTML(opt)}</span></button>`).join("")}</div>`;
}

function bindExamActions(q) {
  $$('[data-goto]').forEach(b => b.onclick = () => { captureQuestionTime(); state.active.index=Number(b.dataset.goto); render(); });
  $('[data-action="previous"]').onclick = () => { if(state.active.index>0){captureQuestionTime();state.active.index--;render();} };
  $('[data-action="next"]').onclick = () => {
    const section=currentSection();
    if(state.active.index<section.questions.length-1){captureQuestionTime();state.active.index++;render();}
    else openSubmitModal();
  };
  $('[data-action="flag"]').onclick = () => { captureQuestionTime(); state.active.flags.has(q.id)?state.active.flags.delete(q.id):state.active.flags.add(q.id);render(); };
  $('[data-action="exit"]').onclick = () => { state.modal={type:"exit"};render(); };
  $('[data-action="submit"]').onclick = openSubmitModal;
  $$('[data-figure-target]').forEach(b => b.onclick = () => {
    captureQuestionTime();
    const current=state.active.answers[q.id]||{}; current[b.dataset.figureTarget]=b.dataset.choice; state.active.answers[q.id]=current; render();
  });
  $$('[data-var]').forEach(input => input.oninput = () => {
    const current=state.active.answers[q.id]||{}; current[input.dataset.var]=input.value; state.active.answers[q.id]=current;
    const section=currentSection(); const completed=section.questions.filter(item=>isAnswered(item,state.active.answers[item.id])).length;
    $(".sidebar-title").textContent=`${completed}/${section.questions.length} answered`;
  });
  $$('[data-latin]').forEach(b => b.onclick = () => {captureQuestionTime();state.active.answers[q.id]=b.dataset.latin;render();});
  $$('[data-subject]').forEach(b => b.onclick = () => {captureQuestionTime();state.active.answers[q.id]=b.dataset.subject;render();});
}

function captureQuestionTime() {
  if (!state.active?.viewStartedAt) return;
  const section = currentSection();
  const q = section?.questions[state.active.index];
  if (!q) return;
  const elapsed = Math.max(0, (Date.now()-state.active.viewStartedAt)/1000);
  state.active.questionTimes[q.id] = (state.active.questionTimes[q.id]||0) + elapsed;
  state.active.viewStartedAt = Date.now();
}

function updateTimer() {
  const el=$("#timer"); if(!el)return;
  const remaining=Math.max(0,Math.ceil((state.active.endAt-Date.now())/1000));
  el.textContent=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
  el.classList.toggle("warning",remaining<=300);
  if(remaining<=0){clearInterval(state.timerId);captureQuestionTime();finishSection(true);}
}

function openSubmitModal() {
  captureQuestionTime();
  const section=currentSection();
  const unanswered=section.questions.filter(q=>!isAnswered(q,state.active.answers[q.id])).length;
  state.modal={type:"submit",unanswered}; render();
}

function renderModal() {
  const m=state.modal;
  let body="";
  if(m.type==="exit") body=`<h2>${state.session?.mode==="full"?"Abort the simulation?":"Exit this attempt?"}</h2><p>${state.session?.mode==="full"?"All answers from this simulation will be discarded.":"Your current section answers will be discarded."}</p><div class="modal-actions"><button class="btn btn-secondary" data-modal="cancel">Continue test</button><button class="btn btn-danger" data-modal="exit-confirm">Exit</button></div>`;
  else if(m.type==="submit") body=`<h2>${state.session?.mode==="full"?"End":"Submit"} ${escapeHTML(currentSection().title)}?</h2><p>${m.unanswered?`You still have <strong>${m.unanswered}</strong> unanswered question${m.unanswered===1?"":"s"}.`:"Every question has an answer."} This subtest is locked after submission and remaining time cannot be recovered.</p><div class="modal-actions"><button class="btn btn-secondary" data-modal="cancel">Keep working</button><button class="btn btn-primary" data-modal="submit-confirm">${state.session?.mode==="full"?"End subtest":"Submit"}</button></div>`;
  else body=`<h2>${m.break?"Core complete - take your break":"Section complete"}</h2><p>${m.break?"The official format includes a break between the Core and Subject modules. Continue when you are ready.":`Next: ${escapeHTML(m.next.title)}.`}</p><div class="modal-actions"><button class="btn btn-primary" data-modal="continue">${m.break?"Start General Academic":"Start next section"}</button></div>`;
  document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop"><div class="modal">${body}</div></div>`);
  $('[data-modal="cancel"]')?.addEventListener("click",()=>{state.modal=null;render();});
  $('[data-modal="exit-confirm"]')?.addEventListener("click",()=>{state.modal=null;state.screen="landing";state.active=null;state.session=null;render();});
  $('[data-modal="submit-confirm"]')?.addEventListener("click",()=>finishSection(false));
  $('[data-modal="continue"]')?.addEventListener("click",()=>{const id=state.session.order[state.session.cursor];startSection(id);});
}

function finishSection(auto) {
  const section=currentSection();
  captureQuestionTime();
  const elapsedSeconds=Math.min(section.time,Math.max(0,Math.round((Date.now()-state.active.startedAt)/1000)));
  state.allResults[section.id]={answers:structuredClone(state.active.answers),flags:[...state.active.flags],autoSubmitted:auto,elapsedSeconds,questionTimes:structuredClone(state.active.questionTimes)};
  state.session.cursor++;
  if(state.session.cursor<state.session.order.length){
    const nextId=state.session.order[state.session.cursor];
    clearInterval(state.timerId);
    if(state.session.mode==="full") {
      if(section.id==="latin"&&nextId==="subject") startBreak();
      else showInstructions(nextId);
    } else {
      showInstructions(nextId);
    }
  } else {
    state.modal=null; state.screen="results"; state.active=null; render();
  }
}

function renderResults() {
  document.title="Results | dMAT Practice";
  const completedSections=sessionSections().filter(s=>state.allResults[s.id]);
  const metrics=completedSections.map(sectionMetrics);
  const total=metrics.reduce((n,s)=>n+s.score,0), max=metrics.reduce((n,s)=>n+s.max,0);
  const totalTasks=metrics.reduce((n,s)=>n+s.tasks,0), answered=metrics.reduce((n,s)=>n+s.answered,0);
  const totalSeconds=metrics.reduce((n,s)=>n+s.elapsedSeconds,0);
  const percent=max?Math.round(total/max*100):0;
  const responseRate=totalTasks?Math.round(answered/totalTasks*100):0;
  const band=performanceBand(percent);
  const difficulty=difficultyMetrics(completedSections);
  const domains=domainMetrics(completedSections);
  const sorted=[...metrics].sort((a,b)=>a.percent-b.percent);
  const strongest=[...metrics].sort((a,b)=>b.percent-a.percent)[0];
  const weakest=sorted[0];
  const recommendations=buildRecommendations(metrics,domains,responseRate);
  $("#app").innerHTML=`<main class="page results"><div class="container">
    <header class="topbar"><div class="brand"><span class="brand-mark">dM</span><span>${state.session?.mode==="daily"?"dMAT Daily Practice":"dMAT Simulation"}<small>Diagnostic report</small></span></div><div class="unofficial">Original unofficial preparation set</div></header>
    <section class="results-hero diagnostic-hero"><div><div class="eyebrow" style="color:#bfe1f0">Post-test diagnostic</div><h1>${total} / ${max}</h1><p>${percent}% raw accuracy across ${completedSections.length} completed section${completedSections.length===1?"":"s"}. This is not an official dMAT score, percentile or admission prediction.</p><div class="diagnostic-band"><span>${escapeHTML(band.label)}</span>${escapeHTML(band.message)}</div></div><div class="result-actions"><button class="btn btn-secondary" data-action="home">Return home</button><button class="btn btn-ghost result-print" data-action="print">Print report</button></div></section>
    <div class="score-grid report-summary">
      <div class="score-card"><strong>${percent}%</strong><span>Raw accuracy</span></div>
      <div class="score-card"><strong>${responseRate}%</strong><span>Tasks fully answered</span></div>
      <div class="score-card"><strong>${formatClock(totalSeconds)}</strong><span>Active test time</span></div>
      <div class="score-card"><strong>${state.session?.mode==="full"?formatClock(state.session.breakSeconds||0):"Practice"}</strong><span>${state.session?.mode==="full"?"Break taken":"Attempt mode"}</span></div>
    </div>

    <section class="report-section"><div class="section-heading"><div class="eyebrow">Section analysis</div><h2>Accuracy, completion and pacing</h2><p>Use the lowest accuracy and highest omission rate to decide what to practise next.</p></div>
      <div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>Section</th><th>Score</th><th>Accuracy</th><th>Completed</th><th>Time used</th><th>Average pace</th><th>Status</th></tr></thead><tbody>${metrics.map(m=>`<tr><th>${escapeHTML(m.section.title)}</th><td>${m.score}/${m.max}</td><td><strong>${m.percent}%</strong><div class="mini-bar"><i style="width:${m.percent}%"></i></div></td><td>${m.answered}/${m.tasks}</td><td>${formatClock(m.elapsedSeconds)}</td><td>${formatPace(m.pace)}</td><td><span class="status-pill ${m.autoSubmitted?"timed-out":"submitted"}">${m.autoSubmitted?"Time expired":"Submitted"}</span></td></tr>`).join("")}</tbody></table></div>
    </section>

    <section class="insight-grid">
      <article class="insight-card strength"><div class="eyebrow">Strongest area</div><h3>${escapeHTML(strongest.section.title)}</h3><strong>${strongest.percent}%</strong><p>${strongest.score?strengthText(sectionKind(strongest.section)):"No section produced a correct response in this attempt; begin with untimed foundation drills."}</p></article>
      <article class="insight-card priority"><div class="eyebrow">First priority</div><h3>${escapeHTML(weakest.section.title)}</h3><strong>${weakest.percent}%</strong><p>${adviceText(sectionKind(weakest.section))}</p></article>
    </section>

    <section class="report-section split-analysis"><div><div class="section-heading compact-heading"><div class="eyebrow">Difficulty profile</div><h2>Foundation to advanced</h2></div><div class="metric-list">${difficulty.map(metricRow).join("")}</div></div>
      <div><div class="section-heading compact-heading"><div class="eyebrow">Action plan</div><h2>Your next three moves</h2></div><ol class="recommendation-list">${recommendations.map(item=>`<li>${escapeHTML(item)}</li>`).join("")}</ol></div></section>

    ${domains.length?`<section class="report-section"><div class="section-heading"><div class="eyebrow">General Academic breakdown</div><h2>Performance by knowledge area</h2><p>This separates subject knowledge from general reading accuracy.</p></div><div class="domain-grid">${domains.map(metricRow).join("")}</div></section>`:""}

    <section class="report-section"><div class="section-heading"><div class="eyebrow">Worked review</div><h2>Check every response</h2><p>Green items were correct. Review red items and reconstruct the solution without notes before reading the explanation.</p></div><div class="review-list">${completedSections.flatMap(s=>reviewItems(s)).join("")}</div></section>
  </div></main>`;
  window.scrollTo(0,0);
  $('[data-action="home"]').onclick=()=>{state.screen="landing";state.session=null;state.allResults={};render();};
  $('[data-action="print"]').onclick=()=>window.print();
}

function pointStats(q,a) {
  if(q.type==="figure") {
    const score=Number(a?.m5===q.correct.m5)+Number(a?.m6===q.correct.m6);
    return {score,max:2,answered:Boolean(a?.m5&&a?.m6)};
  }
  if(q.type==="equation") return {score:Number(q.vars.every((v,i)=>Number(a?.[v])===q.solution[i])),max:1,answered:isAnswered(q,a)};
  return {score:Number(a===q.correct),max:1,answered:isAnswered(q,a)};
}

function sectionMetrics(section) {
  const result=state.allResults[section.id];
  const items=section.questions.map(q=>pointStats(q,result.answers[q.id]));
  const score=items.reduce((n,x)=>n+x.score,0),max=items.reduce((n,x)=>n+x.max,0);
  const answered=items.filter(x=>x.answered).length;
  const elapsedSeconds=result.elapsedSeconds??section.time;
  return {section,score,max,percent:max?Math.round(score/max*100):0,answered,tasks:items.length,elapsedSeconds,pace:elapsedSeconds/items.length,autoSubmitted:result.autoSubmitted};
}

function scoreSection(section) {
  const m=sectionMetrics(section);
  return {section,score:m.score,max:m.max};
}

function formatClock(seconds) {
  const s=Math.max(0,Math.round(seconds||0));
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),r=s%60;
  return h?`${h}h ${String(m).padStart(2,"0")}m`:`${m}:${String(r).padStart(2,"0")}`;
}

function formatPace(seconds) {
  const s=Math.round(seconds||0);
  return s>=60?`${Math.floor(s/60)}m ${s%60}s / task`:`${s}s / task`;
}

function performanceBand(percent) {
  if(percent>=85)return {label:"Strong diagnostic",message:"Accuracy is stable; now protect it under repeated full-length timing."};
  if(percent>=70)return {label:"Competitive foundation",message:"Target omissions and advanced items before adding more mock volume."};
  if(percent>=55)return {label:"Developing",message:"Your fundamentals are visible, but speed and consistency still need structured work."};
  return {label:"Priority rebuild",message:"Return to untimed method practice, then reintroduce strict section timers."};
}

function difficultyMetrics(completedSections) {
  const groups=new Map();
  const labels={low:"Foundation",direct:"Foundation",medium:"Applied",application:"Applied",high:"Advanced",evaluation:"Advanced"};
  completedSections.forEach(section=>{
    const answers=state.allResults[section.id].answers;
    section.questions.forEach(q=>{
      const key=labels[q.difficulty]||"Mixed";
      const stat=pointStats(q,answers[q.id]);
      const group=groups.get(key)||{label:key,score:0,max:0};
      group.score+=stat.score;group.max+=stat.max;groups.set(key,group);
    });
  });
  return ["Foundation","Applied","Advanced","Mixed"].filter(k=>groups.has(k)).map(k=>{const g=groups.get(k);return {...g,percent:Math.round(g.score/g.max*100),detail:`${g.score}/${g.max} points`};});
}

function domainMetrics(completedSections) {
  const subject=completedSections.find(s=>sectionKind(s)==="subject");
  if(!subject)return [];
  const answers=state.allResults[subject.id].answers,groups=new Map();
  subject.questions.forEach(q=>{const key=q.passage.domain;const stat=pointStats(q,answers[q.id]);const g=groups.get(key)||{label:key,score:0,max:0};g.score+=stat.score;g.max+=stat.max;groups.set(key,g);});
  return [...groups.values()].map(g=>({...g,percent:Math.round(g.score/g.max*100),detail:`${g.score}/${g.max} correct`})).sort((a,b)=>a.percent-b.percent);
}

function metricRow(item) {
  return `<div class="metric-row"><div><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.detail)}</span></div><div class="metric-track"><i style="width:${item.percent}%"></i></div><b>${item.percent}%</b></div>`;
}

function strengthText(id) {
  return ({figure:"Your visual-rule tracking produced your highest return.",equation:"Your algebraic constraint solving was the most reliable section.",latin:"Your row-column elimination was your strongest method.",subject:"Your source interpretation and applied knowledge led the report."})[id];
}

function adviceText(id) {
  return ({figure:"Track each symbol separately: movement first, then colour and rotation. Aim for 75 seconds per series.",equation:"Translate every relationship before calculating. Substitute the shortest equation first and verify all letters.",latin:"List the missing row set mentally, intersect it with the column set, and resolve linked blanks first.",subject:"Read the question demand, locate the governing information, and separate given facts from outside assumptions."})[id];
}

function buildRecommendations(metrics,domains,responseRate) {
  const weakest=[...metrics].sort((a,b)=>a.percent-b.percent)[0];
  const out=[adviceText(sectionKind(weakest.section))];
  if(responseRate<95)out.push(`Reduce omissions: ${100-responseRate}% of tasks were incomplete. Guess before a timer expires because the official instructions encourage a best estimate.`);
  else out.push("Completion is controlled. Preserve the final two minutes of each subtest for flagged questions and accidental blanks.");
  if(domains.length){const d=domains[0];out.push(`Your lowest General Academic area was ${d.label} (${d.percent}%). Do two source-based drills in that area, then retest under a single timer.`);}
  else out.push("After two focused drills, repeat this exact section under its official 25-minute limit and compare accuracy rather than raw speed alone.");
  return out.slice(0,3);
}

function reviewItems(section) {
  const answers=state.allResults[section.id].answers;
  return section.questions.map((q,i)=>{
    const a=answers[q.id];
    let correct=false, given="Not answered", expected="";
    if(q.type==="figure") { correct=a?.m5===q.correct.m5&&a?.m6===q.correct.m6; given=`M5 ${a?.m5||"-"}, M6 ${a?.m6||"-"}`; expected=`M5 ${q.correct.m5}, M6 ${q.correct.m6}`; }
    else if(q.type==="equation") { correct=q.vars.every((v,j)=>Number(a?.[v])===q.solution[j]); given=q.vars.map(v=>`${v}=${a?.[v]||"-"}`).join(", "); expected=q.vars.map((v,j)=>`${v}=${q.solution[j]}`).join(", "); }
    else { correct=a===q.correct; given=a||"Not answered"; expected=q.correct; }
    return `<article class="review-item ${correct?"correct":""}"><h3>${escapeHTML(section.short)} ${i+1} - ${correct?"Correct":"Review"}</h3><p class="answer-line"><strong>Your answer:</strong> ${escapeHTML(given)} &nbsp; <strong>Correct:</strong> ${escapeHTML(expected)}</p><p>${escapeHTML(q.explanation)}</p></article>`;
  });
}

function renderToast() {
  document.body.insertAdjacentHTML("beforeend",`<div class="toast">${escapeHTML(state.toast)}</div>`);
  setTimeout(()=>{state.toast=null;$(".toast")?.remove();},2500);
}

function matrixStates(q,t) { return q.shapes.map(s=>shapeState(s,t)); }

function optionStates(q,target,index) {
  const t=target-1;
  const correctIndex=target===5?q.correctIndices.m5:q.correctIndices.m6;
  if(index===correctIndex)return matrixStates(q,t);
  const offsets=[-1,1];
  const distractorIndex=index<correctIndex?index:index-1;
  const states=matrixStates(q,t).map(x=>({...x,pos:[...x.pos]}));
  const s=q.shapes[0], alt=(shapeIndex(s,t)+offsets[distractorIndex]+s.path.length)%s.path.length;
  states[0].pos=[...s.path[alt]];
  return states;
}

function drawAllMatrices() {
  const q=currentSection().questions[state.active.index];
  $$('canvas[data-matrix="frame"]').forEach(c=>drawMatrix(c,matrixStates(q,Number(c.dataset.t))));
  $$('canvas[data-matrix="option"]').forEach(c=>drawMatrix(c,optionStates(q,Number(c.dataset.target),Number(c.dataset.option))));
}

function drawMatrix(canvas,states) {
  const size=100,dpr=Math.max(1,window.devicePixelRatio||1);
  canvas.width=size*dpr;canvas.height=size*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);ctx.clearRect(0,0,size,size);ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);
  ctx.strokeStyle="#667989";ctx.lineWidth=.6;
  for(let i=0;i<=5;i++){const p=i*20;ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,100);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(100,p);ctx.stroke();}
  ctx.strokeStyle="#122b45";ctx.lineWidth=1.2;ctx.strokeRect(.6,.6,98.8,98.8);
  states.forEach(s=>drawShape(ctx,s));
}

function drawShape(ctx,s) {
  const [r,c]=s.pos,x=(c+.5)*20,y=(r+.5)*20,z=6.2;
  ctx.save();ctx.translate(x,y);ctx.rotate(s.angle*Math.PI/180);ctx.fillStyle=s.color;ctx.strokeStyle="#17212b";ctx.lineWidth=1;
  ctx.beginPath();
  if(s.kind==="circle")ctx.arc(0,0,z,0,Math.PI*2);
  else if(s.kind==="square")ctx.rect(-z,-z,z*2,z*2);
  else if(s.kind==="diamond"){ctx.moveTo(0,-z*1.25);ctx.lineTo(z*1.25,0);ctx.lineTo(0,z*1.25);ctx.lineTo(-z*1.25,0);ctx.closePath();}
  else if(s.kind==="triangle"){ctx.moveTo(0,-z*1.35);ctx.lineTo(z*1.2,z);ctx.lineTo(-z*1.2,z);ctx.closePath();}
  else {ctx.moveTo(-z*1.3,-z*.55);ctx.lineTo(z*.15,-z*.55);ctx.lineTo(z*.15,-z);ctx.lineTo(z*1.35,0);ctx.lineTo(z*.15,z);ctx.lineTo(z*.15,z*.55);ctx.lineTo(-z*1.3,z*.55);ctx.closePath();}
  ctx.fill();ctx.stroke();ctx.restore();
}

render();
