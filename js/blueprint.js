/* ==========================================================================
   ASN Bekker Construction — "From slab to snag list" 3D build sequence.

   A procedurally generated house assembles itself as the visitor scrolls
   through the process section: slab -> walls -> trusses/roof -> finishes.
   Everything is built from primitives, so there are no model downloads.

   If WebGL or the three.js module is unavailable, the canvas is swapped for
   a CSS gradient and the section reads perfectly well without it.
   ========================================================================== */

const canvas   = document.getElementById('scene');
const fallback = document.getElementById('sceneFallback');
const section  = document.querySelector('.proc');

// The fallback starts visible, so failing is the default and succeeding is the
// thing we have to opt into. Nothing to do on the failure path but hide canvas.
function degrade() {
  if (canvas) canvas.style.display = 'none';
}

function engage() {
  if (fallback) fallback.hidden = true;
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Below ~900px the copy and the step cards fill the whole section, so the
// build sequence would only ever sit behind text. Skip it entirely there —
// the visitor keeps the section, and phones skip the three.js download.
const roomFor3D = window.innerWidth >= 900;

if (!canvas || !section || !roomFor3D) {
  degrade();
} else {
  boot().catch(degrade);
}

async function boot() {
  const THREE = await import('three');

  /* ------------------------------------------------------------- renderer */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0d0d0d, 26, 62);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

  /* --------------------------------------------------------------- lights */
  scene.add(new THREE.HemisphereLight(0x9fb6d4, 0x0a0a0a, 0.55));

  const key = new THREE.DirectionalLight(0xfff2e4, 2.1);
  key.position.set(9, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 46;
  key.shadow.camera.left = -14;
  key.shadow.camera.right = 14;
  key.shadow.camera.top = 14;
  key.shadow.camera.bottom = -14;
  key.shadow.bias = -0.0012;
  scene.add(key);

  // brand-red rim light so the geometry reads against the dark section.
  // Kept low — any higher and it washes the whole backdrop maroon.
  const rim = new THREE.DirectionalLight(0xc4141c, 0.9);
  rim.position.set(-10, 5, -7);
  scene.add(rim);

  const fillLight = new THREE.PointLight(0x88aaff, 14, 34, 2);
  fillLight.position.set(-5, 4, 8);
  scene.add(fillLight);

  /* ------------------------------------------------------------ materials */
  const M = {
    slab:  new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.94, metalness: 0.02 }),
    brick: new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 0.86, metalness: 0.03 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x3e4147, roughness: 0.42, metalness: 0.82 }),
    timber:new THREE.MeshStandardMaterial({ color: 0xb07c46, roughness: 0.78, metalness: 0.02 }),
    roof:  new THREE.MeshStandardMaterial({ color: 0xc4141c, roughness: 0.5,  metalness: 0.24 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x0f1b26, roughness: 0.08, metalness: 0.6,
      transparent: true, opacity: 0.72
    }),
    trim:  new THREE.MeshStandardMaterial({ color: 0xe9e9e6, roughness: 0.6, metalness: 0.02 })
  };

  /* ------------------------------------------------------- build the house */
  const house = new THREE.Group();
  scene.add(house);

  // Every part registers with a stage (0-3) and its own little offset so the
  // assembly reads as a sequence rather than everything popping at once.
  const parts = [];

  function add(mesh, stage, order, from) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    house.add(mesh);
    parts.push({
      mesh,
      stage,
      order,
      to: mesh.position.clone(),
      from: from || mesh.position.clone().add(new THREE.Vector3(0, 9, 0))
    });
    return mesh;
  }

  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  /* ---- stage 0: ground + slab ---- */
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  // survey grid — the blueprint cue
  const grid = new THREE.GridHelper(44, 44, 0xc4141c, 0x2a2a2a);
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);

  const W = 9, D = 7;               // footprint
  const slab = new THREE.Mesh(box(W, 0.42, D), M.slab);
  slab.position.set(0, 0.21, 0);
  add(slab, 0, 0, new THREE.Vector3(0, -2.4, 0));

  // footings peeking out at the corners
  [[-W / 2 + 0.6, -D / 2 + 0.6], [W / 2 - 0.6, -D / 2 + 0.6],
   [-W / 2 + 0.6,  D / 2 - 0.6], [W / 2 - 0.6,  D / 2 - 0.6]].forEach((p, i) => {
    const f = new THREE.Mesh(box(1.1, 0.5, 1.1), M.slab);
    f.position.set(p[0], 0.1, p[1]);
    add(f, 0, i * 0.12, new THREE.Vector3(p[0], -2, p[1]));
  });

  /* ---- stage 1: walls ---- */
  const WH = 3.1, T = 0.34;          // wall height / thickness

  // back + front (front is split to leave a doorway and a window band)
  const back = new THREE.Mesh(box(W, WH, T), M.brick);
  back.position.set(0, 0.42 + WH / 2, -D / 2 + T / 2);
  add(back, 1, 0);

  const frontL = new THREE.Mesh(box(3.1, WH, T), M.brick);
  frontL.position.set(-W / 2 + 1.55, 0.42 + WH / 2, D / 2 - T / 2);
  add(frontL, 1, 0.3);

  const frontR = new THREE.Mesh(box(3.9, WH, T), M.brick);
  frontR.position.set(W / 2 - 1.95, 0.42 + WH / 2, D / 2 - T / 2);
  add(frontR, 1, 0.45);

  const lintel = new THREE.Mesh(box(2.0, 0.55, T), M.brick);
  lintel.position.set(-W / 2 + 4.1, 0.42 + WH - 0.275, D / 2 - T / 2);
  add(lintel, 1, 0.6);

  const left = new THREE.Mesh(box(T, WH, D - T * 2), M.brick);
  left.position.set(-W / 2 + T / 2, 0.42 + WH / 2, 0);
  add(left, 1, 0.15);

  const right = new THREE.Mesh(box(T, WH, D - T * 2), M.brick);
  right.position.set(W / 2 - T / 2, 0.42 + WH / 2, 0);
  add(right, 1, 0.22);

  // glazing in the front opening + a side window
  const glass1 = new THREE.Mesh(box(1.9, 1.9, 0.08), M.glass);
  glass1.position.set(-W / 2 + 4.1, 0.42 + 1.55, D / 2 - T / 2);
  add(glass1, 1, 0.75);

  const glass2 = new THREE.Mesh(box(0.08, 1.5, 2.2), M.glass);
  glass2.position.set(-W / 2 + T / 2, 0.42 + 1.7, 0.4);
  add(glass2, 1, 0.85);

  /* ---- stage 2: trusses + roof ---- */
  const RISE = 2.05;
  const wallTop = 0.42 + WH;

  // ridge beam
  const ridge = new THREE.Mesh(box(W + 0.5, 0.2, 0.2), M.timber);
  ridge.position.set(0, wallTop + RISE, 0);
  add(ridge, 2, 0);

  // rafter pairs
  const span = Math.sqrt((D / 2) * (D / 2) + RISE * RISE);
  const pitch = Math.atan2(RISE, D / 2);
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + 0.55 + i * ((W - 1.1) / 5);

    [-1, 1].forEach((side, j) => {
      const r = new THREE.Mesh(box(0.16, 0.26, span), M.timber);
      r.position.set(x, wallTop + RISE / 2, side * D / 4);
      r.rotation.x = side * pitch;
      add(r, 2, 0.1 + i * 0.06 + j * 0.03);
    });

    // ceiling tie
    const tie = new THREE.Mesh(box(0.14, 0.16, D), M.timber);
    tie.position.set(x, wallTop + 0.08, 0);
    add(tie, 2, 0.12 + i * 0.06);
  }

  // roof sheeting — two planes, brand red
  [-1, 1].forEach((side, i) => {
    const sheet = new THREE.Mesh(box(W + 0.9, 0.12, span + 0.5), M.roof);
    sheet.position.set(0, wallTop + RISE / 2 + 0.12, side * (D / 4 + 0.06));
    sheet.rotation.x = side * pitch;
    add(sheet, 2, 0.55 + i * 0.1);
  });

  /* ---- stage 3: finishes ---- */
  const door = new THREE.Mesh(box(1.0, 2.15, 0.1), M.roof);
  door.position.set(W / 2 - 4.35, 0.42 + 1.075, D / 2 - T / 2 + 0.02);
  add(door, 3, 0);

  // gutters
  [-1, 1].forEach((side, i) => {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, W + 0.8, 12), M.trim);
    g.rotation.z = Math.PI / 2;
    g.position.set(0, wallTop + 0.02, side * (D / 2 + 0.34));
    add(g, 3, 0.15 + i * 0.06);
  });

  // downpipe
  const dp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, WH, 12), M.trim);
  dp.position.set(W / 2 - 0.2, 0.42 + WH / 2, D / 2 + 0.3);
  add(dp, 3, 0.3);

  // paved apron + a low garden wall, tying back to the paving service
  const apron = new THREE.Mesh(box(W + 3.4, 0.12, 2.4), M.slab);
  apron.position.set(0, 0.06, D / 2 + 1.6);
  add(apron, 3, 0.4, new THREE.Vector3(0, -1.4, D / 2 + 1.6));

  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(box(1.5, 0.14, 0.9), M.brick);
    p.position.set(-4.6 + i * 1.6, 0.14, D / 2 + 2.1);
    add(p, 3, 0.5 + i * 0.05, new THREE.Vector3(-4.6 + i * 1.6, -1.2, D / 2 + 2.1));
  }

  // chimney — a nod to the waterproofing work in the gallery
  const chim = new THREE.Mesh(box(0.9, 2.2, 0.9), M.brick);
  chim.position.set(-W / 2 + 2.0, wallTop + 1.5, -0.9);
  add(chim, 3, 0.75);

  const cap = new THREE.Mesh(box(1.15, 0.16, 1.15), M.slab);
  cap.position.set(-W / 2 + 2.0, wallTop + 2.68, -0.9);
  add(cap, 3, 0.85);

  /* -------------------------------------------- initial (unbuilt) transform */
  parts.forEach((p) => {
    p.mesh.position.copy(p.from);
    p.mesh.scale.setScalar(0.001);
    p.mesh.visible = false;
  });

  /* ------------------------------------------------------------ scroll map */
  let progress = 0;      // 0..1 across the section
  let shown = -1;

  function readScroll() {
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the section top reaches the bottom of the viewport,
    // 1 by the time its bottom passes the top.
    const raw = (vh - r.top) / (vh + r.height);
    progress = Math.min(1, Math.max(0, raw));
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function applyBuild() {
    // Stretch the useful build range into the middle of the scroll pass.
    // `reach` has to clear the LAST part's start (3 + 0.9*0.85) plus the 1.0
    // it takes that part to finish — hence 5, not 4, or stage 3 never lands.
    const t = Math.min(1, Math.max(0, (progress - 0.10) / 0.55));
    const reach = t * 5;

    let live = -1;

    parts.forEach((p) => {
      const startsAt = p.stage + Math.min(p.order, 0.9) * 0.85;
      const k = Math.min(1, Math.max(0, reach - startsAt));
      const e = easeOut(k);

      p.mesh.visible = k > 0.001;
      p.mesh.scale.setScalar(Math.max(0.001, e));
      p.mesh.position.lerpVectors(p.from, p.to, e);
      p.mesh.rotation.y = (1 - e) * 0.5;

      if (k > 0.35 && p.stage > live) live = p.stage;
    });

    if (live !== shown) {
      shown = live;
      document.querySelectorAll('.step').forEach((el) => {
        el.classList.toggle('is-done', Number(el.dataset.step) <= live);
      });
    }
  }

  /* ----------------------------------------------------------------- size */
  const baseCam = new THREE.Vector3();
  const target  = new THREE.Vector3();

  function resize() {
    const r = section.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const wide = w >= 900;

    // On desktop the copy fills the left column and the step cards fill the
    // bottom band, so aim low and to the left of the house — that lifts the
    // build into the clear top-right quadrant. Narrow screens just centre it.
    target.set(wide ? -7.0 : 0, wide ? -1.4 : 1.2, 0);
    house.scale.setScalar(wide ? 0.72 : 0.58);

    const narrow = Math.min(1, w / 1100);
    baseCam.set(
      15.5 + (1 - narrow) * 9,
      9.5 + (1 - narrow) * 4,
      18 + (1 - narrow) * 11
    );
    camera.position.copy(baseCam);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }

  /* ------------------------------------------------------------- run loop */
  let visible = false;
  let pointerX = 0, pointerY = 0;

  if (!reduced) {
    window.addEventListener('pointermove', (e) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  const io = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { rootMargin: '120px' }
  );
  io.observe(section);

  let raf = 0;
  const clock = new THREE.Clock();

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;

    readScroll();
    applyBuild();

    const t = clock.getElapsedTime();

    // slow turntable + a touch of parallax from the pointer
    house.rotation.y = -0.62 + progress * 0.9 + (reduced ? 0 : Math.sin(t * 0.14) * 0.06);
    grid.rotation.y = house.rotation.y;

    if (!reduced) {
      camera.position.x += (baseCam.x + pointerX * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (baseCam.y - pointerY * 1.0 - camera.position.y) * 0.05;
    }
    camera.lookAt(target);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  readScroll();
  applyBuild();
  tick();
  engage();   // scene is live — stand the fallback down

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) tick();
  });
}
