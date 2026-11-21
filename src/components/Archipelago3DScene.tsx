import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface Archipelago3DSceneProps {
  paused?: boolean;
}

const _targetCamPos = new THREE.Vector3();
// Frame the archipelago cleanly in the lower-right stage beside the login form
const _lookTarget = new THREE.Vector3(-1.15, 0.85, -0.35);
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyScale = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _tmpColor = new THREE.Color();

function createOceanGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#061224';
  ctx.fillRect(0, 0, 512, 512);

  const grad = ctx.createRadialGradient(256, 256, 24, 256, 256, 256);
  grad.addColorStop(0, 'rgba(22, 78, 138, 0.42)');
  grad.addColorStop(1, 'rgba(6, 18, 36, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(76, 138, 206, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(120, 185, 245, 0.25)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createIslandShape(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([x, y], idx) => {
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function buildSupplyBeaconGroup(
  colorHex: number,
  heightScale: number,
  sharedGeos: {
    plinthGeo: THREE.CylinderGeometry;
    mastGeo: THREE.CylinderGeometry;
    collarGeo: THREE.TorusGeometry;
    capGeo: THREE.SphereGeometry;
    finGeo: THREE.BoxGeometry;
  },
  sharedMats: {
    plinthMat: THREE.MeshStandardMaterial;
    mastMat: THREE.MeshStandardMaterial;
    collarMat: THREE.MeshStandardMaterial;
  }
): { group: THREE.Group; ring: THREE.Mesh; beaconMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const plinth = new THREE.Mesh(sharedGeos.plinthGeo, sharedMats.plinthMat);
  plinth.position.y = 0.04;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const mast = new THREE.Mesh(sharedGeos.mastGeo, sharedMats.mastMat);
  mast.scale.y = heightScale;
  mast.position.y = 0.08 + 0.22 * heightScale;
  mast.castShadow = true;
  group.add(mast);

  const fin1 = new THREE.Mesh(sharedGeos.finGeo, sharedMats.plinthMat);
  fin1.position.set(0, 0.14, 0);
  group.add(fin1);

  const fin2 = new THREE.Mesh(sharedGeos.finGeo, sharedMats.plinthMat);
  fin2.position.set(0, 0.14, 0);
  fin2.rotation.y = Math.PI / 2;
  group.add(fin2);

  const ring = new THREE.Mesh(sharedGeos.collarGeo, sharedMats.collarMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08 + 0.36 * heightScale;
  group.add(ring);

  const beaconMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.25,
    roughness: 0.2,
    metalness: 0.1,
  });
  const cap = new THREE.Mesh(sharedGeos.capGeo, beaconMat);
  cap.position.y = 0.08 + 0.45 * heightScale;
  group.add(cap);

  return { group, ring, beaconMat };
}

function buildViirsSatellite(): {
  group: THREE.Group;
  geos: THREE.BufferGeometry[];
  mats: THREE.Material[];
} {
  // Composite 4-part procedural orbital satellite (bus, 2 solar wings, optical nadir cone)
  const group = new THREE.Group();

  const busGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 6);
  const wingGeo = new THREE.BoxGeometry(0.56, 0.014, 0.16);
  const lensGeo = new THREE.ConeGeometry(0.065, 0.11, 12);
  const dishGeo = new THREE.TorusGeometry(0.07, 0.01, 8, 18);

  const busMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.85,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x1e40af,
    emissiveIntensity: 0.35,
    roughness: 0.18,
    metalness: 0.72,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.1,
    roughness: 0.15,
    metalness: 0.3,
  });

  const bus = new THREE.Mesh(busGeo, busMat);
  group.add(bus);

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.36, 0, 0);
  group.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.36, 0, 0);
  group.add(rightWing);

  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.position.set(0, -0.14, 0);
  group.add(lens);

  const dish = new THREE.Mesh(dishGeo, busMat);
  dish.rotation.x = Math.PI / 2;
  dish.position.set(0, 0.12, 0);
  group.add(dish);

  return {
    group,
    geos: [busGeo, wingGeo, lensGeo, dishGeo],
    mats: [busMat, wingMat, lensMat],
  };
}

export const Archipelago3DScene: React.FC<Archipelago3DSceneProps> = ({ paused = false }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x061224;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(-0.6, 4.9, 7.2);
    camera.lookAt(_lookTarget);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0b1a30, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    keyLight.position.set(6, 9, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-7, 4, -5);
    scene.add(rimLight);

    // Ocean datum
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const oceanTex = createOceanGridTexture(maxAniso);
    const oceanGeo = new THREE.PlaneGeometry(36, 24);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: oceanTex,
      roughness: 0.78,
      metalness: 0.15,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    const archipelagoGroup = new THREE.Group();
    archipelagoGroup.position.x = 0.55;
    scene.add(archipelagoGroup);

    const islandMatPrimary = new THREE.MeshStandardMaterial({
      color: 0x0f3d56,
      roughness: 0.55,
      metalness: 0.25,
    });
    const islandMatDryAlert = new THREE.MeshStandardMaterial({
      color: 0x6b2814,
      roughness: 0.48,
      metalness: 0.2,
    });

    const islandSpecs: { points: [number, number][]; depth: number; dry?: boolean }[] = [
      {
        points: [
          [-4.8, 1.3],
          [-4.2, 1.45],
          [-3.1, 0.6],
          [-2.4, -0.3],
          [-2.7, -0.65],
          [-3.7, 0.15],
          [-4.5, 0.9],
        ],
        depth: 0.16,
      },
      {
        points: [
          [-2.35, -0.75],
          [-1.3, -0.82],
          [-0.25, -0.95],
          [-0.2, -1.2],
          [-1.4, -1.12],
          [-2.3, -1.0],
        ],
        depth: 0.18,
        dry: true,
      },
      {
        points: [
          [0.05, -1.08],
          [1.65, -1.18],
          [1.6, -1.36],
          [0.02, -1.26],
        ],
        depth: 0.12,
        dry: true,
      },
      {
        points: [
          [-1.45, 0.85],
          [-0.45, 1.25],
          [0.25, 0.75],
          [0.15, -0.25],
          [-0.95, -0.32],
          [-1.5, 0.15],
        ],
        depth: 0.17,
      },
      {
        points: [
          [0.75, 0.65],
          [1.45, 0.78],
          [1.25, 0.25],
          [1.5, -0.45],
          [1.05, -0.65],
          [0.85, -0.15],
        ],
        depth: 0.16,
        dry: true,
      },
      {
        points: [
          [2.55, 0.25],
          [3.65, 0.08],
          [4.45, -0.45],
          [4.35, -0.95],
          [3.35, -0.75],
          [2.65, -0.25],
        ],
        depth: 0.18,
      },
    ];

    const islandGeos: THREE.ExtrudeGeometry[] = [];
    for (const spec of islandSpecs) {
      const shape = createIslandShape(spec.points);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: spec.depth,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 2,
      });
      geo.rotateX(-Math.PI / 2);
      islandGeos.push(geo);

      const mesh = new THREE.Mesh(geo, spec.dry ? islandMatDryAlert : islandMatPrimary);
      mesh.position.y = 0.02;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      archipelagoGroup.add(mesh);
    }

    // VIIRS Night-Time Lights InstancedMesh (36 glowing regional luminosity nodes)
    const viirsCoords: [number, number, number][] = [
      [-4.2, 0.2, -1.1], [-3.7, 0.2, -0.7], [-3.3, 0.2, -0.2], [-2.9, 0.2, 0.2], [-2.6, 0.2, 0.5],
      [-2.1, 0.22, 0.85], [-1.95, 0.22, 0.92], [-1.75, 0.22, 0.89], [-1.5, 0.22, 0.98],
      [-1.3, 0.22, 0.95], [-1.1, 0.22, 1.02], [-0.85, 0.22, 1.0], [-0.65, 0.22, 1.05], [-0.4, 0.22, 1.08],
      [0.2, 0.16, 1.14], [0.55, 0.16, 1.18], [1.05, 0.16, 1.22],
      [-1.1, 0.21, -0.45], [-0.6, 0.21, -0.65], [-0.2, 0.21, -0.2], [-0.8, 0.21, 0.1], [-0.35, 0.21, 0.15],
      [1.0, 0.2, -0.55], [1.25, 0.2, -0.4], [1.15, 0.2, 0.15], [1.08, 0.2, 0.4], [1.3, 0.2, 0.35],
      [2.85, 0.22, 0.05], [3.3, 0.22, 0.25], [3.75, 0.22, 0.55], [4.05, 0.22, 0.68],
    ];
    const viirsGeo = new THREE.CylinderGeometry(0.025, 0.032, 0.12, 8);
    const viirsMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const viirsMesh = new THREE.InstancedMesh(viirsGeo, viirsMat, viirsCoords.length);
    viirsCoords.forEach(([x, y, z], idx) => {
      const hScale = 0.6 + ((idx * 37) % 10) * 0.14;
      _dummyPos.set(x, y + 0.04 * hScale, z);
      _dummyScale.set(1, hScale, 1);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      viirsMesh.setMatrixAt(idx, _dummyMatrix);
      _tmpColor.setHSL(0.11 + (idx % 4) * 0.015, 0.95, 0.6);
      viirsMesh.setColorAt(idx, _tmpColor);
    });
    viirsMesh.instanceMatrix.needsUpdate = true;
    if (viirsMesh.instanceColor) viirsMesh.instanceColor.needsUpdate = true;
    viirsMesh.computeBoundingSphere();
    archipelagoGroup.add(viirsMesh);

    // Composite 5-Part Supply & Economic Beacons
    const sharedGeos = {
      plinthGeo: new THREE.CylinderGeometry(0.11, 0.14, 0.08, 6),
      mastGeo: new THREE.CylinderGeometry(0.028, 0.042, 0.44, 8),
      collarGeo: new THREE.TorusGeometry(0.08, 0.014, 8, 20),
      capGeo: new THREE.SphereGeometry(0.065, 14, 14),
      finGeo: new THREE.BoxGeometry(0.18, 0.06, 0.02),
    };
    const sharedMats = {
      plinthMat: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.72, metalness: 0.35 }),
      mastMat: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.88 }),
      collarMat: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.8 }),
    };

    const hubs: { pos: [number, number, number]; color: number; scale: number }[] = [
      { pos: [-3.55, 0.19, -0.25], color: 0xf59e0b, scale: 1.05 },
      { pos: [-1.85, 0.21, 0.88], color: 0xef4444, scale: 1.3 },
      { pos: [-1.25, 0.21, 0.96], color: 0xf97316, scale: 1.15 },
      { pos: [-0.6, 0.21, 1.04], color: 0xf59e0b, scale: 1.25 },
      { pos: [-0.55, 0.2, -0.25], color: 0x38bdf8, scale: 0.95 },
      { pos: [1.1, 0.19, 0.32], color: 0xf97316, scale: 1.1 },
      { pos: [3.45, 0.21, 0.48], color: 0x22c55e, scale: 0.95 },
    ];

    const beacons: { group: THREE.Group; ring: THREE.Mesh; beaconMat: THREE.MeshStandardMaterial }[] = [];
    for (const h of hubs) {
      const b = buildSupplyBeaconGroup(h.color, h.scale, sharedGeos, sharedMats);
      b.group.position.set(h.pos[0], h.pos[1], h.pos[2]);
      archipelagoGroup.add(b.group);
      beacons.push(b);
    }

    // Supply & Digital Payment Arcs
    const routes: [number, number][] = [
      [3, 1],
      [3, 4],
      [3, 0],
      [5, 4],
      [5, 6],
      [2, 1],
    ];
    const arcGeos: THREE.TubeGeometry[] = [];
    const arcMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3,
    });
    const packetGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const packetMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.6,
      roughness: 0.15,
    });
    const movers: { curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh; speed: number; offset: number }[] = [];

    routes.forEach(([fromIdx, toIdx], idx) => {
      const p0 = new THREE.Vector3(...hubs[fromIdx].pos).add(new THREE.Vector3(0, 0.35, 0));
      const p2 = new THREE.Vector3(...hubs[toIdx].pos).add(new THREE.Vector3(0, 0.35, 0));
      const mid = p0.clone().lerp(p2, 0.5);
      mid.y += 0.65 + p0.distanceTo(p2) * 0.22;

      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
      const tubeGeo = new THREE.TubeGeometry(curve, 28, 0.015, 6, false);
      arcGeos.push(tubeGeo);

      const tubeMesh = new THREE.Mesh(tubeGeo, arcMat);
      archipelagoGroup.add(tubeMesh);

      const packet = new THREE.Mesh(packetGeo, packetMat);
      archipelagoGroup.add(packet);
      movers.push({ curve, mesh: packet, speed: 0.24 + (idx % 3) * 0.06, offset: idx * 0.19 });
    });

    // Atmospheric Ring + Orbiting VIIRS Satellite
    const climateRingGeo = new THREE.TorusGeometry(4.8, 0.012, 8, 96);
    const climateRingMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.36,
    });
    const climateRing = new THREE.Mesh(climateRingGeo, climateRingMat);
    climateRing.rotation.x = Math.PI / 2 - 0.16;
    climateRing.position.y = 0.85;
    archipelagoGroup.add(climateRing);

    const sat = buildViirsSatellite();
    archipelagoGroup.add(sat.group);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!pausedRef.current) {
        elapsed += dt;
        archipelagoGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.14 - 0.08;
        climateRing.rotation.z = elapsed * 0.12;

        // Orbit VIIRS satellite above Indonesia
        const satAngle = elapsed * 0.35;
        sat.group.position.set(
          Math.cos(satAngle) * 3.8,
          1.75 + Math.sin(satAngle * 2) * 0.15,
          Math.sin(satAngle) * 2.1
        );
        sat.group.rotation.y = -satAngle + Math.PI / 2;

        for (let i = 0; i < movers.length; i++) {
          const m = movers[i];
          const t = (elapsed * m.speed + m.offset) % 1;
          m.curve.getPoint(t, m.mesh.position);
        }

        for (let i = 0; i < beacons.length; i++) {
          beacons[i].ring.rotation.z = elapsed * (0.8 + i * 0.12);
          beacons[i].beaconMat.emissiveIntensity = 1.0 + Math.sin(elapsed * 2.2 + i) * 0.35;
        }
      }

      const damp = 1 - Math.exp(-3.5 * dt);
      _targetCamPos.set(-0.6 + pointer.x * 0.6, 4.9 - pointer.y * 0.35, 7.2);
      camera.position.lerp(_targetCamPos, damp);
      camera.lookAt(_lookTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);

      oceanGeo.dispose();
      oceanMat.dispose();
      oceanTex.dispose();
      islandMatPrimary.dispose();
      islandMatDryAlert.dispose();
      islandGeos.forEach((g) => g.dispose());
      viirsGeo.dispose();
      viirsMat.dispose();
      Object.values(sharedGeos).forEach((g) => g.dispose());
      Object.values(sharedMats).forEach((m) => m.dispose());
      beacons.forEach((b) => b.beaconMat.dispose());
      arcGeos.forEach((g) => g.dispose());
      arcMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      climateRingGeo.dispose();
      climateRingMat.dispose();
      sat.geos.forEach((g) => g.dispose());
      sat.mats.forEach((m) => m.dispose());
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
};
