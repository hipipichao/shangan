"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Box, RotateCcw, Eye, Grid3X3 } from "lucide-react";

const SOLIDS: Record<string, { name: string; geo: () => THREE.BufferGeometry; thr: number }> = {
  cube: { name: "正方体", geo: () => new THREE.BoxGeometry(2, 2, 2), thr: 1 },
  cuboid: { name: "长方体", geo: () => new THREE.BoxGeometry(2.4, 1.4, 1.2), thr: 1 },
  triprism: { name: "三棱柱", geo: () => new THREE.CylinderGeometry(1.15, 1.15, 2, 3), thr: 1 },
  cylinder: { name: "圆柱", geo: () => new THREE.CylinderGeometry(1, 1, 2, 64), thr: 15 },
  cone: { name: "圆锥", geo: () => new THREE.ConeGeometry(1.2, 2.2, 64), thr: 15 },
  frustum: { name: "圆台", geo: () => new THREE.CylinderGeometry(0.6, 1.1, 2.2, 64), thr: 15 },
};

const AXIS_PRESETS: { label: string; axis: [number, number, number] }[] = [
  { label: "X+", axis: [1, 0, 0] },
  { label: "X−", axis: [-1, 0, 0] },
  { label: "Y+", axis: [0, 1, 0] },
  { label: "Y−", axis: [0, -1, 0] },
  { label: "Z+", axis: [0, 0, 1] },
  { label: "Z−", axis: [0, 0, -1] },
];

export default function GeometryPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    offset: new THREE.Vector3(0, 0, 0),
    normal: new THREE.Vector3(1, 0, 0),
  });

  const [solidKey, setSolidKey] = useState("cube");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [offsetZ, setOffsetZ] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [helperVisible, setHelperVisible] = useState(true);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 用 ref 保存 three.js 核心对象，避免闭包问题
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    solidGroup: THREE.Group | null;
    currentEdges: [THREE.Vector3, THREE.Vector3][];
    planeMesh: THREE.Mesh;
    sectionMesh: THREE.Mesh | null;
    sectionBorder: THREE.Line | null;
    grid: THREE.GridHelper;
    axes: THREE.AxesHelper;
    animate: () => void;
    resize: () => void;
    loadSolid: (key: string) => void;
    update: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f6f8);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(5, 4, 6);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    const HALF = 1;

    const faceMat = new THREE.MeshBasicMaterial({
      color: 0xdfe6f2,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });

    const planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    scene.add(planeMesh);

    const sectionMat = new THREE.MeshBasicMaterial({
      color: 0xff8a8a,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sectionBorderMat = new THREE.LineBasicMaterial({ color: 0xd63838, linewidth: 2 });

    const grid = new THREE.GridHelper(20, 20, 0xcccccc, 0xe6e6e6);
    grid.position.y = -HALF - 0.001;
    scene.add(grid);

    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const extractEdges = (geo: THREE.BufferGeometry): [THREE.Vector3, THREE.Vector3][] => {
      const pos = geo.attributes.position;
      const edges: [THREE.Vector3, THREE.Vector3][] = [];
      const seen = new Set();
      const v = (i: number) =>
        new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const addEdge = (i: number, j: number) => {
        const key = i < j ? i + "_" + j : j + "_" + i;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([v(i), v(j)]);
      };
      if (geo.index) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i += 3) {
          addEdge(idx.getX(i), idx.getX(i + 1));
          addEdge(idx.getX(i + 1), idx.getX(i + 2));
          addEdge(idx.getX(i + 2), idx.getX(i));
        }
      } else {
        for (let i = 0; i < pos.count; i += 3) {
          addEdge(i, i + 1);
          addEdge(i + 1, i + 2);
          addEdge(i + 2, i);
        }
      }
      return edges;
    };

    let solidGroup: THREE.Group | null = null;
    let currentEdges: [THREE.Vector3, THREE.Vector3][] = [];

    const loadSolid = (key: string) => {
      if (solidGroup) {
        scene.remove(solidGroup);
        solidGroup.traverse((o) => {
          if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
        });
      }
      const def = SOLIDS[key];
      const geo = def.geo();
      geo.computeVertexNormals();
      solidGroup = new THREE.Group();
      solidGroup.add(new THREE.Mesh(geo, faceMat));
      solidGroup.add(
        new THREE.LineSegments(new THREE.EdgesGeometry(geo, def.thr), edgeMat)
      );
      scene.add(solidGroup);
      currentEdges = extractEdges(geo);
      update();
    };

    const getPlane = () => {
      const normal = stateRef.current.normal.clone().normalize();
      const d = stateRef.current.offset.dot(normal);
      return { normal, d };
    };

    const computeSection = () => {
      const { normal, d } = getPlane();
      const pts: THREE.Vector3[] = [];
      for (const [a, b] of currentEdges) {
        const da = a.dot(normal) - d;
        const db = b.dot(normal) - d;
        if (da * db < 0) {
          const t = da / (da - db);
          pts.push(a.clone().lerp(b, t));
        } else if (Math.abs(da) < 1e-9 && Math.abs(db) < 1e-9) {
          pts.push(a.clone());
          pts.push(b.clone());
        }
      }

      const unique: THREE.Vector3[] = [];
      for (const p of pts) {
        if (!unique.some((u) => u.distanceTo(p) < 1e-6)) unique.push(p);
      }

      if (sceneRef.current?.sectionMesh) {
        scene.remove(sceneRef.current.sectionMesh);
        sceneRef.current.sectionMesh.geometry.dispose();
        sceneRef.current.sectionMesh = null;
      }
      if (sceneRef.current?.sectionBorder) {
        scene.remove(sceneRef.current.sectionBorder);
        sceneRef.current.sectionBorder.geometry.dispose();
        sceneRef.current.sectionBorder = null;
      }

      if (unique.length < 3) return;

      const centroid = new THREE.Vector3();
      unique.forEach((p) => centroid.add(p));
      centroid.multiplyScalar(1 / unique.length);

      let ref1 = new THREE.Vector3().subVectors(unique[0], centroid);
      if (ref1.lengthSq() < 1e-12) ref1.set(1, 0, 0);
      ref1.normalize();
      let ref2 = new THREE.Vector3().crossVectors(normal, ref1);
      if (ref2.lengthSq() < 1e-12) {
        ref1 = new THREE.Vector3(0, 1, 0);
        if (Math.abs(ref1.dot(normal)) > 0.9) ref1.set(1, 0, 0);
        ref2 = new THREE.Vector3().crossVectors(normal, ref1).normalize();
        ref1 = new THREE.Vector3().crossVectors(ref2, normal).normalize();
      } else {
        ref2.normalize();
      }

      const sorted = [...unique].sort((a, b) => {
        const ca = a.clone().sub(centroid);
        const cb = b.clone().sub(centroid);
        const aa = Math.atan2(ca.dot(ref2), ca.dot(ref1));
        const bb = Math.atan2(cb.dot(ref2), cb.dot(ref1));
        return aa - bb;
      });

      const positions: number[] = [];
      const indices: number[] = [];
      sorted.forEach((p) => positions.push(p.x, p.y, p.z));
      for (let i = 1; i < sorted.length - 1; i++)
        indices.push(0, i, i + 1);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const sectionMesh = new THREE.Mesh(geo, sectionMat);
      scene.add(sectionMesh);
      if (sceneRef.current) sceneRef.current.sectionMesh = sectionMesh;

      const borderPos: number[] = [];
      for (let i = 0; i <= sorted.length; i++) {
        const p = sorted[i % sorted.length];
        borderPos.push(p.x, p.y, p.z);
      }
      const bgeo = new THREE.BufferGeometry();
      bgeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(borderPos, 3)
      );
      const sectionBorder = new THREE.Line(bgeo, sectionBorderMat);
      scene.add(sectionBorder);
      if (sceneRef.current) sceneRef.current.sectionBorder = sectionBorder;
    };

    const UP = new THREE.Vector3(0, 1, 0);
    const XAXIS = new THREE.Vector3(1, 0, 0);
    const _tangent = new THREE.Vector3();
    const _bitangent = new THREE.Vector3();
    const _basis = new THREE.Matrix4();

    const updatePlaneMesh = () => {
      const { normal, d } = getPlane();
      planeMesh.position.copy(normal.clone().multiplyScalar(d));
      const n = normal.clone().normalize();
      if (Math.abs(n.dot(UP)) > 0.9999) {
        _tangent.copy(XAXIS);
      } else {
        _tangent.crossVectors(UP, n).normalize();
      }
      _bitangent.crossVectors(n, _tangent).normalize();
      _basis.makeBasis(_tangent, _bitangent, n);
      planeMesh.quaternion.setFromRotationMatrix(_basis);
    };

    const update = () => {
      updatePlaneMesh();
      computeSection();
    };

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      solidGroup,
      currentEdges,
      planeMesh,
      sectionMesh: null,
      sectionBorder: null,
      grid,
      axes,
      animate: () => {},
      resize,
      loadSolid,
      update,
    };

    loadSolid("cube");
    resize();
    update();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      });
    };
  }, []);

  // 同步 state 到 three.js
  useEffect(() => {
    stateRef.current.offset.set(offsetX, offsetY, offsetZ);
    sceneRef.current?.update();
  }, [offsetX, offsetY, offsetZ]);

  useEffect(() => {
    const y = THREE.MathUtils.degToRad(rotY);
    const p = THREE.MathUtils.degToRad(rotX);
    stateRef.current.normal.set(
      Math.cos(y) * Math.cos(p),
      Math.sin(p),
      Math.sin(y) * Math.cos(p)
    );
    sceneRef.current?.update();
  }, [rotY, rotX]);

  useEffect(() => {
    sceneRef.current?.loadSolid(solidKey);
  }, [solidKey]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.grid.visible = helperVisible;
      sceneRef.current.axes.visible = helperVisible;
    }
  }, [helperVisible]);

  const normal = stateRef.current.normal;
  const [normalStr, setNormalStr] = useState(
    `( ${normal.x.toFixed(2)},  ${normal.y.toFixed(2)},  ${normal.z.toFixed(2)} )`
  );

  useEffect(() => {
    const y = THREE.MathUtils.degToRad(rotY);
    const p = THREE.MathUtils.degToRad(rotX);
    const nx = Math.cos(y) * Math.cos(p);
    const ny = Math.sin(p);
    const nz = Math.sin(y) * Math.cos(p);
    setNormalStr(`( ${nx.toFixed(2)},  ${ny.toFixed(2)},  ${nz.toFixed(2)} )`);
  }, [rotY, rotX]);

  const handlePreset = (axis: [number, number, number]) => {
    const n = new THREE.Vector3(...axis).normalize();
    stateRef.current.normal.copy(n);
    const pitch = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const yaw = Math.atan2(n.z, n.x);
    setRotY(THREE.MathUtils.radToDeg(yaw));
    setRotX(THREE.MathUtils.radToDeg(pitch));
    sceneRef.current?.update();
  };

  const handleReset = () => {
    setOffsetX(0);
    setOffsetY(0);
    setOffsetZ(0);
    setRotY(0);
    setRotX(0);
    stateRef.current.offset.set(0, 0, 0);
    stateRef.current.normal.set(1, 0, 0);
    sceneRef.current?.controls.reset();
    sceneRef.current?.update();
    showToast("已重置");
  };

  const handleView = () => {
    const ctx = sceneRef.current;
    if (!ctx) return;
    const { normal, d } = {
      normal: stateRef.current.normal.clone().normalize(),
      d: stateRef.current.offset.dot(stateRef.current.normal.clone().normalize()),
    };
    const target = normal.clone().multiplyScalar(d);
    const dist = 6;
    const startPos = ctx.camera.position.clone();
    const endPos = target.clone().add(normal.clone().multiplyScalar(dist));
    const startTarget = ctx.controls.target.clone();
    const t0 = performance.now();
    const dur = 600;
    const anim = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      ctx.camera.position.lerpVectors(startPos, endPos, e);
      ctx.controls.target.lerpVectors(startTarget, target, e);
      ctx.controls.update();
      if (k < 1) requestAnimationFrame(anim);
    };
    anim();
    showToast("从截面方向观察");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-6 w-6 text-brand-600" />
          <h1 className="text-2xl font-bold tracking-tight">立体截面</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={solidKey} onValueChange={setSolidKey}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOLIDS).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHelperVisible((v) => !v)}
          >
            <Grid3X3 className="mr-1.5 h-4 w-4" />
            {helperVisible ? "隐藏网格" : "显示网格"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleView}>
            <Eye className="mr-1.5 h-4 w-4" />
            从截面观察
          </Button>
          <Button size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-xl border bg-[#f5f6f8]">
          <canvas ref={canvasRef} className="block h-[50vh] w-full lg:h-[70vh]" />
          {toast && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
              {toast}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-center text-lg font-bold">平面位置</h3>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              拖动滑条，移动切割平面
            </p>

            <div className="space-y-4">
              <AxisControl
                axis="X"
                color="bg-red-500"
                desc="左右方向"
                value={offsetX}
                min={-1}
                max={1}
                step={0.01}
                suffix=""
                onChange={setOffsetX}
              />
              <AxisControl
                axis="Y"
                color="bg-green-500"
                desc="上下方向"
                value={offsetY}
                min={-1}
                max={1}
                step={0.01}
                suffix=""
                onChange={setOffsetY}
              />
              <AxisControl
                axis="Z"
                color="bg-blue-500"
                desc="前后方向"
                value={offsetZ}
                min={-1}
                max={1}
                step={0.01}
                suffix=""
                onChange={setOffsetZ}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-center text-lg font-bold">平面朝向</h3>
            <p className="mb-4 text-center text-xs text-muted-foreground">
              调节法向量方向
            </p>

            <div className="space-y-4">
              <AxisControl
                axis="Y"
                color="bg-green-500"
                desc="水平旋转"
                value={rotY}
                min={-180}
                max={180}
                step={1}
                suffix="°"
                onChange={setRotY}
              />
              <AxisControl
                axis="X"
                color="bg-red-500"
                desc="上下倾斜"
                value={rotX}
                min={-90}
                max={90}
                step={1}
                suffix="°"
                onChange={setRotX}
              />

              <div className="grid grid-cols-3 gap-2">
                {AXIS_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.axis)}
                    className="rounded-lg border border-border bg-muted/40 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-muted/60 py-2 text-center font-mono text-sm tabular-nums text-muted-foreground">
                <span className="mr-1 font-sans text-muted-foreground/70">
                  法向量
                </span>
                {normalStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AxisControlProps {
  axis: string;
  color: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}

function AxisControl({
  axis,
  color,
  desc,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: AxisControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-sm font-bold text-white ${color}`}
        >
          {axis}
        </div>
        <div className="flex-1 text-sm text-muted-foreground">{desc}</div>
        <div className="min-w-[3rem] rounded-md bg-brand-50 px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-brand-600">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full"
      />
    </div>
  );
}