'use client';

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// A miniature room rendered with real WebGL lighting/shadows (Three.js),
// split by an animated clipping plane: raw/unfinished construction on one
// side, a finished luxury interior on the other. The seam sweeps back and
// forth, literally showing the remodel happening — the room never falls
// apart into disconnected pieces because it's one continuous 3D space.
export default function HeroRoomScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Building the scene (and especially the PMREM environment convolution)
    // is a multi-hundred-millisecond synchronous main-thread task. Deferring
    // it to idle time keeps it from delaying the hero text/CTA's first paint
    // and scroll-reveal animation.
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId: number = w.requestIdleCallback
      ? w.requestIdleCallback(init, { timeout: 1500 })
      : w.setTimeout(init, 50);

    function init() {
      if (cancelled || !mount) return;
      cleanup = build(mount);
    }

    return () => {
      cancelled = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
      cleanup?.();
    };
  }, []);

  return <div className="room-scene" ref={mountRef} aria-hidden="true" />;
}

function build(mount: HTMLDivElement) {
  let disposed = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.innerWidth < 768;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x080808, 4.5, 13);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(5.4, 2.15, 6.4);
  const lookTarget = new THREE.Vector3(0, 1, -0.4);
  camera.lookAt(lookTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  // VSM (variance shadow maps) trades a little precision for genuinely soft,
  // feathered shadow edges — the diffused, "studio render" look — instead of
  // PCF's slightly harder edge.
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  mount.appendChild(renderer.domElement);

  // Soft studio environment so gold/glass/metal actually reflect something,
  // instead of reading as flat matte color. A slightly higher blur (0.07
  // instead of near-mirror-sharp) gives broad, soft highlights rather than
  // pinpoint reflections — closer to the polished, soft-lit look of a
  // Spline/product-render scene.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.07).texture;

  // ---- Post-processing: bloom on the bright accents (lamp, seam, gold) ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), isSmall ? 0.55 : 0.8, 0.65, 0.75);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---- Clip planes: negative-x half is "before", positive-x half is "after".
  // curtainPlane/furniturePlane share the same normal as afterPlane but lag
  // behind it (see the render loop), so surfaces finish first, then curtains,
  // then furniture — a staggered build-out instead of everything at once. ----
  const beforePlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.05);
  const afterPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.05);
  const curtainPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.05);
  const furniturePlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0.05);

  const gold = 0xd4af37;

  // ---- Procedural textures (canvas-based, no network asset needed) ----
  function makePlankTexture(hex: number, planks = 8) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const base = new THREE.Color(hex);
    const plankW = c.width / planks;
    for (let i = 0; i < planks; i++) {
      const shade = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
      ctx.fillStyle = `#${shade.getHexString()}`;
      ctx.fillRect(i * plankW, 0, plankW, c.height);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(i * plankW, 0, 2, c.height);
      for (let g = 0; g < 3; g++) {
        ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.04})`;
        ctx.fillRect(i * plankW, Math.random() * c.height, plankW, 1);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function makePaintTexture(hex: number, contrast = 8) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const base = new THREE.Color(hex);
    ctx.fillStyle = `#${base.getHexString()}`;
    ctx.fillRect(0, 0, c.width, c.height);
    const img = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * contrast;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const floorTexture = makePlankTexture(0x3a2a18);
  floorTexture.repeat.set(40, 40);
  const wallTexture = makePaintTexture(0x1c1a17);
  wallTexture.repeat.set(9, 4.5);

  // ---- Materials ----
  const rawConcrete = new THREE.MeshStandardMaterial({
    color: 0x47443f, roughness: 0.97, metalness: 0.02,
    clippingPlanes: [beforePlane],
  });
  const rawStud = new THREE.MeshStandardMaterial({
    color: 0x8a6a45, roughness: 0.9, metalness: 0,
    clippingPlanes: [beforePlane],
  });
  const rawCeiling = new THREE.MeshStandardMaterial({
    color: 0x3a3733, roughness: 1, metalness: 0,
    clippingPlanes: [beforePlane],
  });
  const finishedFloor = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: floorTexture, roughness: 0.28, metalness: 0.2,
    clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.9,
    clippingPlanes: [afterPlane],
  });
  const finishedWall = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: wallTexture, roughness: 0.55, metalness: 0.12,
    clearcoat: 0.15, clearcoatRoughness: 0.4,
    clippingPlanes: [afterPlane],
  });
  const finishedCeiling = new THREE.MeshStandardMaterial({
    color: 0x211f1c, roughness: 0.8, metalness: 0.05,
    clippingPlanes: [afterPlane],
  });
  const goldTrim = new THREE.MeshPhysicalMaterial({
    color: gold, roughness: 0.25, metalness: 0.9,
    clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.3,
    clippingPlanes: [afterPlane],
  });
  // Same finish as goldTrim, but tied to furniturePlane so the table leg and
  // lamp pole arrive with the rest of the furniture wave, not with the
  // baseboards (which use goldTrim itself, on afterPlane).
  const furnitureGold = new THREE.MeshPhysicalMaterial({
    color: gold, roughness: 0.25, metalness: 0.9,
    clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.3,
    clippingPlanes: [furniturePlane],
  });
  const glassTop = new THREE.MeshPhysicalMaterial({
    color: 0x111111, roughness: 0.03, metalness: 0,
    transmission: 0.55, thickness: 0.3, ior: 1.45,
    transparent: true, opacity: 0.85, envMapIntensity: 1.2,
    clippingPlanes: [furniturePlane],
  });
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a2e, roughness: 0.95, metalness: 0,
    clippingPlanes: [furniturePlane],
  });
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbb994, roughness: 0.65, metalness: 0,
    sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(gold),
    side: THREE.DoubleSide, clippingPlanes: [curtainPlane],
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x241f1a, roughness: 0.6, metalness: 0.2,
    clippingPlanes: [afterPlane],
  });
  const artMat = new THREE.MeshStandardMaterial({
    color: 0x6b5a3a, roughness: 0.9, metalness: 0,
    emissive: 0x2a2010, emissiveIntensity: 0.3,
    clippingPlanes: [afterPlane],
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2f4a34, roughness: 0.8, metalness: 0,
    clippingPlanes: [afterPlane],
  });
  const potMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622, roughness: 0.6, metalness: 0.3,
    clippingPlanes: [afterPlane],
  });
  const debrisMat = new THREE.MeshStandardMaterial({
    color: 0x5c5650, roughness: 1, metalness: 0,
    clippingPlanes: [beforePlane],
  });
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0x707070, roughness: 0.5, metalness: 0.6,
    clippingPlanes: [beforePlane],
  });
  const glowGoldMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });

  const room = new THREE.Group();
  scene.add(room);

  // Floor/ceiling/walls are sized far larger than the actual furnished area
  // and rely on fog to fade out, rather than ending at a hard edge — since
  // the scene now fills the whole page, the camera sees well past the old
  // 6x6 "diorama" bounds, and a finite plane there would show its corner as
  // a hard silhouette against the void instead of dissolving naturally.
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorBefore = new THREE.Mesh(floorGeo, rawConcrete);
  floorBefore.rotation.x = -Math.PI / 2;
  floorBefore.receiveShadow = true;
  const floorAfter = new THREE.Mesh(floorGeo, finishedFloor);
  floorAfter.rotation.x = -Math.PI / 2;
  floorAfter.receiveShadow = true;
  room.add(floorBefore, floorAfter);

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(40, 40);
  const ceilBefore = new THREE.Mesh(ceilGeo, rawCeiling);
  ceilBefore.rotation.x = Math.PI / 2;
  ceilBefore.position.y = 3;
  const ceilAfter = new THREE.Mesh(ceilGeo, finishedCeiling);
  ceilAfter.rotation.x = Math.PI / 2;
  ceilAfter.position.y = 3;
  room.add(ceilBefore, ceilAfter);

  // Back wall
  const backGeo = new THREE.PlaneGeometry(40, 3);
  const backBefore = new THREE.Mesh(backGeo, rawConcrete);
  backBefore.position.set(0, 1.5, -3);
  backBefore.receiveShadow = true;
  const backAfter = new THREE.Mesh(backGeo, finishedWall);
  backAfter.position.set(0, 1.5, -3);
  backAfter.receiveShadow = true;
  room.add(backBefore, backAfter);

  // Left wall
  const sideGeo = new THREE.PlaneGeometry(40, 3);
  const sideBefore = new THREE.Mesh(sideGeo, rawConcrete);
  sideBefore.position.set(-3, 1.5, 0);
  sideBefore.rotation.y = Math.PI / 2;
  sideBefore.receiveShadow = true;
  const sideAfter = new THREE.Mesh(sideGeo, finishedWall);
  sideAfter.position.set(-3, 1.5, 0);
  sideAfter.rotation.y = Math.PI / 2;
  sideAfter.receiveShadow = true;
  room.add(sideBefore, sideAfter);

  // Window cut into the back wall: frame + glowing "daylight" pane
  const windowFrameMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8e2d5, roughness: 0.5, metalness: 0.1,
    clearcoat: 0.3, clearcoatRoughness: 0.3, clippingPlanes: [afterPlane],
  });
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.08), windowFrameMat);
  windowFrame.position.set(1.5, 1.85, -2.96);
  const windowMullionV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.1), windowFrameMat);
  windowMullionV.position.set(1.5, 1.85, -2.94);
  const windowMullionH = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.1), windowFrameMat);
  windowMullionH.position.set(1.5, 1.85, -2.94);
  const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.15), glowGoldMat);
  windowPane.position.set(1.5, 1.85, -2.9);
  room.add(windowFrame, windowMullionV, windowMullionH, windowPane);

  // Curtains flanking the window, with soft vertical pleats (per-vertex Z
  // ripple) instead of a flat panel — arrive on their own staggered plane.
  function makeCurtainGeometry(width: number, height: number) {
    const geo = new THREE.PlaneGeometry(width, height, 10, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const fold = Math.sin((x / width) * Math.PI * 7) * 0.045;
      pos.setZ(i, fold);
    }
    geo.computeVertexNormals();
    return geo;
  }
  const curtainLeft = new THREE.Mesh(makeCurtainGeometry(0.75, 2.6), curtainMat);
  curtainLeft.position.set(0.55, 1.55, -2.82);
  curtainLeft.castShadow = true;
  curtainLeft.receiveShadow = true;
  const curtainRight = new THREE.Mesh(makeCurtainGeometry(0.75, 2.6), curtainMat);
  curtainRight.position.set(2.55, 1.55, -2.82);
  curtainRight.castShadow = true;
  curtainRight.receiveShadow = true;
  room.add(curtainLeft, curtainRight);

  // Exposed studs + construction debris, only visible on the "before" side
  for (let i = 0; i < 5; i++) {
    const stud = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3, 0.08), rawStud);
    stud.position.set(-2.9, 1.5, -2.9 + i * 0.5);
    stud.castShadow = true;
    room.add(stud);
  }
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 5.6, 10), pipeMat);
  conduit.rotation.z = Math.PI / 2;
  conduit.position.set(-1.3, 2.7, -2.9);
  room.add(conduit);
  for (let i = 0; i < 4; i++) {
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(0.15 + Math.random() * 0.15, 0.1, 0.15 + Math.random() * 0.15), debrisMat);
    chunk.position.set(-2 + i * 0.35, 0.06, -0.6 - i * 0.2);
    chunk.rotation.y = Math.random() * Math.PI;
    chunk.castShadow = true;
    room.add(chunk);
  }

  // Furniture + decor, only on the "after" side.
  // The sofa is a real modeled asset (Khronos glTF-Sample-Assets "GlamVelvetSofa",
  // CC-BY 4.0), not hand-built primitives — genuine PBR geometry and materials.
  const gltfLoader = new GLTFLoader();
  gltfLoader.load("/models/glam-velvet-sofa.glb", (gltf) => {
    if (disposed) return;
    const sofa = gltf.scene;
    sofa.scale.setScalar(1.35);
    sofa.position.set(1, 0, -2.05);
    sofa.rotation.y = 0;
    sofa.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
            m.clippingPlanes = [furniturePlane];
          }
        });
      }
    });
    room.add(sofa);
    // In the reduced-motion path the scene is only rendered once, synchronously,
    // right after setup — which is before this async model fetch can possibly
    // resolve. Without this, the sofa would never appear in that static frame.
    if (reduceMotion) render();
  });

  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(1.1, 0.011, -0.6);
  rug.receiveShadow = true;
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32), glassTop);
  tableTop.position.set(1, 0.42, -0.5);
  tableTop.castShadow = true;
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12), furnitureGold);
  tableLeg.position.set(1, 0.2, -0.5);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 12), furnitureGold);
  lampPole.position.set(2.1, 0.7, -2.6);
  const lampShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf4d570, emissive: 0xf4d570, emissiveIntensity: 2.2,
    roughness: 0.5, side: THREE.DoubleSide, clippingPlanes: [furniturePlane],
  });
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 24, 1, true), lampShadeMat);
  lampShade.position.set(2.1, 1.42, -2.6);
  const baseboard = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, 0.03), goldTrim);
  baseboard.position.set(0, 0.06, -2.98);
  const baseboardSide = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 6), goldTrim);
  baseboardSide.position.set(-2.98, 0.06, 0);

  // Wall art
  const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.04), frameMat);
  artFrame.position.set(-1.4, 2, -2.96);
  const artCanvas = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.53), artMat);
  artCanvas.position.set(-1.4, 2, -2.93);

  // Potted plant, tucked in the corner
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 16), potMat);
  pot.position.set(-2.5, 0.15, -2.5);
  pot.castShadow = true;
  const plantGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 6), leafMat);
    leaf.position.set(-2.5 + Math.cos(i * 1.1) * 0.08, 0.55, -2.5 + Math.sin(i * 1.1) * 0.08);
    leaf.rotation.z = Math.cos(i * 1.1) * 0.3;
    leaf.rotation.x = Math.sin(i * 1.1) * 0.3;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }

  // Modern ceiling fan with an integrated LED light ring, over the seating
  // area. Blades spin slowly (paused under reduced motion, like everything
  // else); the whole fixture arrives with the rest of the furniture wave.
  const fanBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1a, roughness: 0.35, metalness: 0.85,
    clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.1,
    clippingPlanes: [furniturePlane],
  });
  const fanBladeMat = new THREE.MeshPhysicalMaterial({
    color: 0x554a3a, roughness: 0.35, metalness: 0.7,
    clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.2,
    clippingPlanes: [furniturePlane],
  });
  const fanLightMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cf, emissive: 0xfff2cf, emissiveIntensity: 2.6,
    roughness: 0.4, clippingPlanes: [furniturePlane],
  });

  const fanGroup = new THREE.Group();
  // Closer to camera and hanging lower than a flush mount, so its silhouette
  // actually reads at this shallow viewing angle instead of disappearing
  // edge-on against the ceiling.
  const fanX = 0.3;
  const fanZ = -0.9;
  const fanCeilingY = 3;
  const fanDrop = 0.34;

  const fanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, fanDrop, 10), furnitureGold);
  fanRod.position.set(fanX, fanCeilingY - fanDrop / 2, fanZ);

  const fanMount = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.05, 20), fanBodyMat);
  fanMount.position.set(fanX, fanCeilingY - fanDrop - 0.02, fanZ);

  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 8, 32), furnitureGold);
  fanRing.rotation.x = Math.PI / 2;
  fanRing.position.set(0, -0.02, 0);
  fanGroup.add(fanRing);

  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24), fanBodyMat);
  fanHub.position.set(0, -0.05, 0);
  fanHub.castShadow = true;
  fanGroup.add(fanHub);

  const bladeCount = 4;
  for (let i = 0; i < bladeCount; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.018, 0.18), fanBladeMat);
    blade.position.set(Math.cos((i / bladeCount) * Math.PI * 2) * 0.46, -0.06, Math.sin((i / bladeCount) * Math.PI * 2) * 0.46);
    // Pitched like a real propeller blade (not flat against the ceiling) —
    // otherwise, viewed from roughly eye level, a perfectly horizontal blade
    // is seen edge-on and is essentially invisible.
    blade.rotation.x = THREE.MathUtils.degToRad(14);
    blade.rotation.y = (i / bladeCount) * Math.PI * 2;
    blade.castShadow = true;
    fanGroup.add(blade);
  }

  const fanLight = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 24), fanLightMat);
  fanLight.position.set(0, -0.11, 0);
  fanGroup.add(fanLight);

  fanGroup.position.set(fanX, fanCeilingY - fanDrop - 0.02, fanZ);
  const fanDownlight = new THREE.PointLight(0xfff2cf, 2, 3.5, 2);
  fanDownlight.position.set(fanX, fanCeilingY - fanDrop - 0.13, fanZ);

  room.add(fanRod, fanMount, fanGroup, fanDownlight);

  room.add(
    rug, tableTop, tableLeg, lampPole, lampShade,
    baseboard, baseboardSide, artFrame, artCanvas, pot, plantGroup
  );

  // The glowing seam marking the transformation boundary
  const seamGeo = new THREE.PlaneGeometry(3.05, 0.02);
  const seamMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.95 });
  const seam = new THREE.Mesh(seamGeo, seamMat);
  seam.rotation.x = -Math.PI / 2;
  room.add(seam);

  const seamWallGeo = new THREE.PlaneGeometry(0.02, 3);
  const seamWall = new THREE.Mesh(seamWallGeo, seamMat);
  room.add(seamWall);

  const lampLight = new THREE.PointLight(0xf4d570, 7, 4, 2);
  lampLight.position.set(2.1, 1.3, -2.6);
  room.add(lampLight);

  // ---- Lighting ----
  scene.add(new THREE.AmbientLight(0x8899aa, 0.35));

  const windowLight = new THREE.SpotLight(0xfff3d6, 10, 12, Math.PI / 5, 0.5, 1.2);
  windowLight.position.set(3.5, 3.2, 1.5);
  windowLight.target.position.set(0.5, 0.5, -1);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(1024, 1024);
  windowLight.shadow.radius = 6;
  windowLight.shadow.blurSamples = 16;
  room.add(windowLight, windowLight.target);

  const coolFill = new THREE.PointLight(0x6b7d9e, 2.4, 6, 2);
  coolFill.position.set(-2.2, 2, 0.5);
  room.add(coolFill);

  const rimLight = new THREE.DirectionalLight(0xd4af37, 0.5);
  rimLight.position.set(-2, 3, 3);
  room.add(rimLight);

  // ---- Resize ----
  function resize() {
    if (!mount) return;
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- Subtle mouse parallax ----
  let pointerX = 0;
  let pointerY = 0;
  function onPointerMove(e: PointerEvent) {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  }
  if (!reduceMotion) window.addEventListener("pointermove", onPointerMove);

  // ---- Animate ----
  let raf = 0;
  const timer = new THREE.Timer();
  function render() {
    timer.update();
    const t = timer.getElapsed();
    const sweep = reduceMotion ? 0 : Math.sin(t * 0.35) * 2.2; // sweeps between -2.2 and 2.2
    beforePlane.constant = -sweep;
    afterPlane.constant = sweep;
    // Curtains and furniture lag behind the surfaces so the room visibly
    // builds up in stages — floor/walls/paint first, then curtains, then
    // furniture — instead of everything appearing at once. In the static
    // reduced-motion frame, skip the lag so the "after" side reads complete.
    curtainPlane.constant = reduceMotion ? sweep : sweep - 0.7;
    furniturePlane.constant = reduceMotion ? sweep : sweep - 1.6;
    seam.position.x = sweep;
    seamWall.position.set(sweep, 1.5, 0);
    if (!reduceMotion) {
      fanGroup.rotation.y = t * 1.8;
      room.rotation.y = Math.sin(t * 0.12) * 0.35 - 0.15;
      camera.position.x = 5.4 + pointerX * 0.5;
      camera.position.y = 2.15 - pointerY * 0.3;
      camera.lookAt(lookTarget);
      composer.render();
      raf = requestAnimationFrame(render);
    } else {
      composer.render();
    }
  }
  render();

  // Fade the canvas in once the first frame is actually on screen, instead
  // of popping in abruptly whenever idle time happened to free up.
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity 0.8s ease";
  requestAnimationFrame(() => {
    renderer.domElement.style.opacity = "1";
  });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    mount.removeChild(renderer.domElement);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => {
            if (v instanceof THREE.Texture) v.dispose();
          });
          m.dispose();
        });
      }
    });
    scene.environment?.dispose();
    pmrem.dispose();
    composer.dispose();
    renderer.dispose();
  };
}
