import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { classifyMesh } from "../bodyGroups";

const MODEL_URL = "/models/muscular.glb";
const NEUTRAL = "__neutral";
const NEUTRAL_COLOR = "#B8BCC4";
const TINT_COLOR = "#A8B3C7";
const ACCENT_COLOR = "#4C5B75";
const SHEET_SCALE = 0.58;

function bakeGeometry(mesh) {
  let g = mesh.geometry.clone();
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  if (g.index) g = g.toNonIndexed();
  g.applyMatrix4(mesh.matrixWorld);

  const count = g.getAttribute("position").count;
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal"]) {
    const src = g.getAttribute(name);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = src.getX(i);
      arr[i * 3 + 1] = src.getY(i);
      arr[i * 3 + 2] = src.getZ(i);
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, 3));
  }

  if (mesh.matrixWorld.determinant() < 0) {
    for (const name of ["position", "normal"]) {
      const arr = out.getAttribute(name).array;
      for (let t = 0; t < count; t += 3) {
        for (let k = 0; k < 3; k++) {
          const a = (t + 1) * 3 + k;
          const b = (t + 2) * 3 + k;
          const tmp = arr[a];
          arr[a] = arr[b];
          arr[b] = tmp;
        }
      }
    }
  }
  return out;
}

function buildBody(scene) {
  scene.updateMatrixWorld(true);
  const buckets = {};
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    if (obj.name.toLowerCase().includes("fascia")) return;
    const key = classifyMesh(obj.name) ?? NEUTRAL;
    (buckets[key] ??= []).push(bakeGeometry(obj));
  });

  const group = new THREE.Group();
  const materials = {};
  const geometries = [];
  for (const [key, list] of Object.entries(buckets)) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    geometries.push(merged);
    const isNeutral = key === NEUTRAL;
    const material = new THREE.MeshStandardMaterial({
      color: isNeutral ? NEUTRAL_COLOR : TINT_COLOR,
      roughness: 0.65,
      transparent: isNeutral,
      opacity: isNeutral ? 0.35 : 1,
      depthWrite: !isNeutral,
    });
    materials[key] = material;
    const mesh = new THREE.Mesh(merged, material);
    mesh.userData.group = isNeutral ? null : key;
    if (isNeutral) {
      mesh.raycast = () => {};
      mesh.renderOrder = 1;
    }
    group.add(mesh);
  }

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    Object.values(materials).forEach((m) => m.dispose());
  };
  return { group, materials, dispose };
}

function Body({ selectedGroup, onSelect }) {
  const { scene } = useGLTF(MODEL_URL);
  const getState = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const controlsRef = useRef(null);
  const zoomRef = useRef(1);
  const boundsRef = useRef({ min: 0, max: 0 });
  const body = useMemo(() => buildBody(scene), [scene]);

  useEffect(() => {
    const camera = getState().camera;
    const box = new THREE.Box3().setFromObject(body.group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    boundsRef.current = { min: box.min.y, max: box.max.y };
    const dist = (size.y / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.06;
    camera.position.set(center.x, center.y, center.z + dist);
    camera.near = dist / 50;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(center);
      controls.minDistance = dist * 0.5;
      controls.maxDistance = dist * 1.6;
      controls.update();
    }
    invalidate();
  }, [body, getState, invalidate]);

  useEffect(() => {
    Object.entries(body.materials).forEach(([key, material]) => {
      if (key !== NEUTRAL) {
        material.color.set(key === selectedGroup ? ACCENT_COLOR : TINT_COLOR);
      }
    });
    invalidate();
  }, [body, selectedGroup, invalidate]);

  useEffect(() => {
    const camera = getState().camera;
    const target = selectedGroup ? SHEET_SCALE : 1;
    let frame;
    const step = () => {
      zoomRef.current += (target - zoomRef.current) * 0.25;
      if (Math.abs(target - zoomRef.current) < 0.003) zoomRef.current = target;
      const s = zoomRef.current;
      if (s === 1) {
        camera.clearViewOffset();
      } else {
        camera.setViewOffset(
          size.width * s,
          size.height * s,
          (-size.width * (1 - s)) / 2,
          0,
          size.width,
          size.height
        );
      }
      invalidate();
      if (s !== target) frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [selectedGroup, size, getState, invalidate]);

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map();
    let lastY = null;

    const panVertical = (dy) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const { camera, size: canvasSize } = getState();
      const distance = camera.position.distanceTo(controls.target);
      const viewScale =
        camera.view && camera.view.enabled ? camera.view.height / camera.view.fullHeight : 1;
      const perPixel =
        (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * viewScale) /
        canvasSize.height;
      const { min, max } = boundsRef.current;
      const nextY = THREE.MathUtils.clamp(controls.target.y + dy * perPixel, min, max);
      const delta = nextY - controls.target.y;
      controls.target.y += delta;
      camera.position.y += delta;
      controls.update();
      invalidate();
    };

    const onDown = (e) => {
      pointers.set(e.pointerId, e.clientY);
      lastY = pointers.size === 1 ? e.clientY : null;
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e.clientY);
      if (pointers.size !== 1 || lastY === null) return;
      const dy = e.clientY - lastY;
      lastY = e.clientY;
      panVertical(dy);
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      lastY = pointers.size === 1 ? [...pointers.values()][0] : null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [gl, getState, invalidate]);

  useEffect(() => () => body.dispose(), [body]);

  const handleClick = (e) => {
    if (e.delta > 6) return;
    const group = e.object.userData.group;
    if (!group) return;
    e.stopPropagation();
    onSelect(group === selectedGroup ? null : group);
  };

  return (
    <>
      <primitive object={body.group} onClick={handleClick} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        rotateSpeed={0.9}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

function Loader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#74747A",
        fontSize: 13,
        pointerEvents: "none",
      }}
    >
      3Dモデルを読み込み中… {Math.round(progress)}%
    </div>
  );
}

export default function BodyViewer({ selectedGroup, onSelect }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas frameloop="demand" dpr={[1, 2]} camera={{ fov: 40, position: [0, 1, 4] }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 4, 3]} intensity={1.6} />
        <directionalLight position={[-2, 2, -3]} intensity={0.9} />
        <Suspense fallback={null}>
          <Body selectedGroup={selectedGroup} onSelect={onSelect} />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
}
