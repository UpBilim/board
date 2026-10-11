# UpBilim Board: command reference

Every command is one JSON object with `op`. This page doubles as the part of a system prompt that teaches a language model to draw: you can paste the block below as is.

```text
The board is 320×180 units, origin top-left, x to the right, y down (decimals allowed). Keep everything inside 4..315 × 4..175.
Colors — this palette looks best: #1D2B53 dark blue, #7E2553 plum, #008751 green, #AB5236 brown, #5F574F grey, #C2C3C7 light grey,
#FFF1E8 white, #FF004D red, #FFA300 orange, #FFEC27 yellow, #00E436 lime, #29ADFF sky, #83769C lavender, #FF77A8 pink, #FFCCAA peach, #000000 black.
The background is #1D2B53 unless you set another with clear.

Commands ("lw" = line width 1–3, default 2; "dash":true = dashed line; "alpha":0.3 = semi-transparent fill):
{"op":"clear","bg":"#1D2B53"}
{"op":"title","s":"Water cycle"}   (title shown above the board, 2–5 words)
{"op":"icon","name":"cloud","x":120,"y":50,"s":48}   (x,y = CENTER, s = size. names: ball, sun, cloud, drop, tree, house, star, heart, apple, planet, moon, person, book, bulb, flask, mountain, fish, flower, battery, car, bus; optional "c" = main color; car and bus face right)
{"op":"rect","x":20,"y":40,"w":60,"h":40,"c":"#FFA300","fill":true,"stroke":"#FFF1E8","r":4}
{"op":"circle","x":160,"y":100,"r":40,"c":"#29ADFF","fill":false,"lw":2}
{"op":"ellipse","x":160,"y":100,"rx":70,"ry":25,"c":"#C2C3C7","fill":false,"lw":1,"dash":true}
{"op":"poly","pts":[[40,160],[100,60],[160,160]],"c":"#008751","fill":true,"stroke":"#FFF1E8"}
{"op":"path","pts":[[20,100],[60,80],[100,100]],"c":"#FFF1E8","arrow":true}   (open polyline; "arrow" puts a head at the end)
{"op":"line","x1":20,"y1":165,"x2":300,"y2":165,"c":"#C2C3C7","lw":2}
{"op":"arrow","x1":80,"y1":80,"x2":140,"y2":80,"c":"#FFEC27","lw":2}
{"op":"pie","x":160,"y":100,"r":50,"from":0,"to":90,"c":"#FF004D"}   (degrees, 0 = up, clockwise; for fractions and charts)
{"op":"text","x":230,"y":60,"s":"Key idea","c":"#FFF1E8","size":2}   (size 1 ≈ 12, 2 ≈ 22, 3 ≈ 34 units; x,y = top-left, or top-center with "align":"center")
{"op":"label","x":232,"y":60,"s":"cloud","c":"#FFF1E8","to":{"x":200,"y":55}}   (short text on a dark plate; "to" draws a pointer line to the object)
{"op":"box","id":"b1","x":20,"y":30,"w":90,"h":34,"s":"text inside","c":"#29ADFF"}   (rounded block with text that fits itself)
{"op":"pixels","x":140,"y":60,"scale":3,"rows":["..##..",".####.","######"],"pal":{"#":"#FF004D"}}   (small pixel sprite when no icon fits)
Labels never overlap each other: the board moves a label to the nearest free place.

READY OBJECTS (drawn and animated exactly right):
{"op":"pendulum","id":"p","x":160,"y":20,"len":110,"angle":25,"period":2,"c":"#FF004D"}   (pivot x,y, string length, swing amplitude°; parts "p.string", "p.bob")
{"op":"atom","id":"atom","x":160,"y":95,"shells":[2,8],"protons":10}   (nucleus + shells with orbiting electrons; ≤ 3 shells)
{"op":"wave","id":"w","x1":20,"x2":300,"y":95,"amp":30,"len":90,"period":2,"c":"#29ADFF"}   (running sine wave)
{"op":"road","id":"road","y":118,"h":44}   (road across the board; "dir":"v" + "x" for a road going down)
{"op":"crosswalk","id":"zebra","x":120,"y":118,"h":44}   (zebra crossing on that road: x = its center, the same y and h as the road)
{"op":"trafficlight","id":"tl","x":250,"y":30,"on":"red"}   ("on": red | yellow | green; draw again with the same id to switch)

LIVE BOARD:
Any object may have "id" and "anim". Animation types ("period" = seconds per cycle):
  {"type":"orbit","cx":160,"cy":100,"period":3}   move around a center
  {"type":"fall","dy":40,"period":1.2} / {"type":"rise","dy":-40,"period":2}   repeat falling / rising, fading at the end
  {"type":"move","dx":60,"dy":0,"period":2,"loop":"pingpong"}   (loop: pingpong | repeat | once)
  {"type":"swing","cx":160,"cy":30,"angle":30,"period":2}   {"type":"spin","period":4}   {"type":"pulse","scale":1.2,"period":1}   {"type":"blink","period":1}   {"type":"shake"}
{"op":"anim","id":"e1","type":"orbit","cx":160,"cy":100,"period":3}   (animate an existing object; "type":"stop" to stop)
{"op":"point","id":"nucleus"}   (point at an object: it is highlighted for a few seconds; or {"op":"point","x":..,"y":..})
{"op":"mark","id":"sol.3","style":"box","c":"#00E436"}   (permanent marker highlight: circle | underline | box | cross | check)
{"op":"erase","id":"steam"}   (remove an object and all its parts)
The same id again replaces the object. Parts of composite objects are "id.something"; pointing at / erasing "id" covers all parts.

MATH (inside JSON write every backslash twice, e.g. "\\frac{1}{2}"):
{"op":"formula","id":"f1","x":180,"y":20,"s":"x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}","size":2}   (size 1 small, 2 normal, 3 big; "align":"center" makes x the center)
  TeX subset: \\frac{a}{b}, \\sqrt{x}, \\sqrt[3]{x}, x^{2}, a_{n}, \\cdot, \\times, \\div, \\pm, \\le, \\ge, \\ne, \\approx, \\pi, \\alpha…\\omega, \\Delta, \\angle, 90^\\circ, \\infty,
  \\to, \\Rightarrow, \\left( … \\right), \\begin{cases} 2x+y=5 \\\\ x-y=1 \\end{cases}, \\text{km/h}, \\vec{F}, \\overline{AB}, \\sin, \\log, \\sum,
  \\color{#FF004D}{x}, \\hl{…} (highlighted), \\boxed{x = 4}, \\cancel{3} (crossed out). Plain "2x + 3 = 11" works too.
  "text" and "label" with TeX inside are rendered as formulas automatically.
{"op":"step","id":"sol","x":175,"y":14,"s":"2x + 3 = 11"}   (worked solution: each "step" with the same id adds a line under the previous one;
  "=" signs line up; x,y only on the first line; "note":"-3" = what was done to both sides, shown on the right; lines are "sol.1", "sol.2"…)

GRAPHS:
{"op":"axes","id":"ax","x":20,"y":10,"w":160,"h":160,"xmin":-4,"xmax":4,"ymin":-2,"ymax":6}   (plane with grid, arrows, numbers; "grid":false, "labels":false, "step", "xl"/"yl" axis names)
{"op":"plot","axes":"ax","id":"f","fn":"x^2 - 2","c":"#29ADFF","s":"y = x^2 - 2"}   (+ - * / ^, implicit multiplication (2x), sqrt, abs, sin, cos, tan, log, ln, exp, pi, e; "from"/"to" limit x)
{"op":"dot","axes":"ax","x":2,"y":2,"s":"A(2; 2)","proj":true}   ("proj" draws dashed lines to the axes)
  Any command with "axes":"ax" takes coordinates of that plane (line, arrow, poly, path, text, label, angle, dot, mark, point).
{"op":"numberline","id":"nl","x1":20,"x2":300,"y":100,"from":-5,"to":5}
{"op":"interval","on":"nl","from":-1,"to":null,"closed":[true,false],"c":"#FF004D"}   (hatched; null = to infinity; closed end = filled dot, open = hollow)

GEOMETRY:
{"op":"poly","pts":[[60,150],[160,40],[260,150]],"fill":false,"c":"#FFF1E8","names":["A","B","C"]}   (vertex names are placed outside)
{"op":"line","x1":60,"y1":150,"x2":260,"y2":150,"c":"#FFF1E8","s":"8 cm","ticks":1}   (length label; "ticks" 1–3 = equal-side marks; "both":true = double arrow)
{"op":"angle","x":60,"y":150,"a":[260,150],"b":[160,40],"s":"45^\\circ","c":"#FFEC27"}   (angle at x,y between rays to a and b; "right":true = square; "double":true; "r" = radius)
{"op":"grid","step":10}   (squared paper on the whole board, or "x","y","w","h")

DIAGRAMS WITH AUTOMATIC LAYOUT (optional "x","y","w","h" = area, default the whole board):
{"op":"schema","id":"s","type":"cycle","items":["Evaporation","Condensation","Precipitation","Collection"],"center":"Water"}   (2–8 items)
{"op":"schema","id":"s","type":"flow","items":["Seed","Sprout","Flower","Fruit"]}   (up to 10; "dir":"v" = top to bottom)
{"op":"schema","id":"s","type":"timeline","items":[{"t":"1903","s":"First flight"},{"t":"1969","s":"Moon landing"}]}   (up to 8)
{"op":"schema","id":"s","type":"compare","items":[{"title":"Plants","points":["make their own food","stay in place"]},{"title":"Animals","points":["eat food","move around"]}]}   (2–3 columns)
{"op":"schema","id":"s","type":"tree","root":{"s":"Animals","kids":[{"s":"Vertebrates","kids":["Fish","Birds"]},{"s":"Invertebrates"}]}}   (up to 20 nodes)
{"op":"schema","id":"s","type":"venn","sets":["Cats","Dogs"],"a":["meow"],"b":["bark"],"ab":["pets","4 legs"]}   (2 or 3 sets; for 3 sets "abc" in the middle)
{"op":"schema","id":"s","type":"table","head":["Substance","Formula"],"rows":[["Water","H₂O"],["Salt","NaCl"]]}   (up to 6 columns, 8 rows)
  Parts get ids: "s.1", "s.2"… (compare points "s.1.2"; table rows "s.r1", header "s.h"). Parts appear one by one; point at them while explaining.
```

## Board memory

`board.scene()` describes the current board for the model, for example:

```text
title: "Linear equation"
sol: steps @20,30 120×60 — parts: sol.1 "3x - 5 = 10", sol.2 "3x = 15 | +5", sol.3 "x = 5 | :3"
ax: axes x∈[-2;6] y∈[-8;12] @165,9 147×146
f: plot y=3x - 5 @168,15 130×140
o4: dot with projections @240,30 40×14 "(5; 10)"
free areas: x 0–160, y 100–180; x 0–160, y 0–25
```

Objects without an id get automatic ids (`o4`), so the model can point at them too. A short instruction that works well next to it:

```text
THE BOARD NOW (your drawing is still on the board): <scene>
Same topic → keep it and continue: point at / mark / animate objects by these ids, add new things into the free areas,
erase what is no longer needed. Never redraw something that is already there. Clear only for a new topic.
```
