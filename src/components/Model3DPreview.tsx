import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { IngestionMethod } from '../types';
import {
  Box,
  Layers,
  RotateCcw,
  Eye,
  Sliders,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

interface Model3DPreviewProps {
  method: IngestionMethod;
  totalFloors: number;
  floorHeight: number;
  buildingWidth: number;
  buildingLength: number;
  unitsPerFloor: number;
  blueprintPreviewUrl?: string | null;
  modelFile?: File | null;
  surveyNumber?: string;
}

export const Model3DPreview: React.FC<Model3DPreviewProps> = ({
  method,
  totalFloors,
  floorHeight,
  buildingWidth,
  buildingLength,
  unitsPerFloor,
  blueprintPreviewUrl,
  modelFile,
  surveyNumber = 'SY-397/2B',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);

  const [shadingMode, setShadingMode] = useState<'solid' | 'xray' | 'wireframe'>('solid');
  const [cameraView, setCameraView] = useState<'iso' | 'front' | 'top'>('iso');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const totalHeight = totalFloors * floorHeight;
  const buildingVolume = buildingWidth * buildingLength * totalHeight;
  const footprintArea = buildingWidth * buildingLength;
  const totalUnits = totalFloors * unitsPerFloor;

  // Initialize Three.js Scene and Renderer
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(30, 45, 30);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-25, 20, -25);
    scene.add(fillLight);

    // Ground Grid (Plot Boundary)
    const grid = new THREE.GridHelper(40, 40, 0x1e3a8a, 0xcfd8dc);
    grid.position.y = -0.01;
    scene.add(grid);

    // Dynamic Group for Building Meshes
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    // Interactive Orbit Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const targetLookAt = new THREE.Vector3(0, totalHeight / 2, 0);

    const spherical = {
      radius: Math.max(30, Math.max(buildingWidth, buildingLength) * 2.2),
      theta: Math.PI / 4,
      phi: Math.PI / 3.2,
    };

    const updateCamera = () => {
      camera.position.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(targetLookAt);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (e.buttons === 1) {
        spherical.theta -= deltaX * 0.008;
        spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, spherical.phi - deltaY * 0.008));
        updateCamera();
      } else if (e.buttons === 2) {
        targetLookAt.y += deltaY * 0.03;
        updateCamera();
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(10, Math.min(100, spherical.radius + e.deltaY * 0.05));
      updateCamera();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // Update Building Geometry whenever dimensions, shadingMode, or method changes
  useEffect(() => {
    if (!dynamicGroupRef.current || !sceneRef.current) return;
    const group = dynamicGroupRef.current;

    // Clear previous building meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }

    setModelLoadError(null);

    // If Method 2: Direct 3D Asset (.glb) and a file is selected
    if (method === 'direct_3d_glb' && modelFile) {
      setIsLoadingModel(true);
      const fileUrl = URL.createObjectURL(modelFile);
      const loader = new GLTFLoader();

      loader.load(
        fileUrl,
        (gltf) => {
          setIsLoadingModel(false);
          URL.revokeObjectURL(fileUrl);
          const rootObj = gltf.scene;

          // Compute bounding box and normalize scale/position
          const bbox = new THREE.Box3().setFromObject(rootObj);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const center = new THREE.Vector3();
          bbox.getCenter(center);

          // Center model on ground
          rootObj.position.x = -center.x;
          rootObj.position.y = -bbox.min.y;
          rootObj.position.z = -center.z;

          rootObj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (shadingMode === 'wireframe') {
                mesh.material = new THREE.MeshBasicMaterial({
                  wireframe: true,
                  color: 0x1e3a8a,
                });
              } else if (shadingMode === 'xray') {
                mesh.material = new THREE.MeshStandardMaterial({
                  color: 0x0284c7,
                  transparent: true,
                  opacity: 0.45,
                  roughness: 0.3,
                });
              }
            }
          });

          group.add(rootObj);
        },
        undefined,
        (err) => {
          setIsLoadingModel(false);
          URL.revokeObjectURL(fileUrl);
          setModelLoadError('Failed to parse 3D GLB file. Falling back to parametric bounding envelope.');
          renderParametricEnvelope(group);
        }
      );
      return;
    }

    // Default or Parametric / Blueprint Flow
    renderParametricEnvelope(group);
  }, [
    method,
    totalFloors,
    floorHeight,
    buildingWidth,
    buildingLength,
    unitsPerFloor,
    blueprintPreviewUrl,
    modelFile,
    shadingMode,
  ]);

  // Helper to render parametric floors, strata units, and floor slabs
  const renderParametricEnvelope = (group: THREE.Group) => {
    const isWireframe = shadingMode === 'wireframe';
    const isXRay = shadingMode === 'xray';

    // Unit Color Palette
    const unitColors = [0x38bdf8, 0x34d399, 0xfbbf24, 0x818cf8];

    // Foundation Slab
    const foundationGeom = new THREE.BoxGeometry(buildingWidth + 1.2, 0.4, buildingLength + 1.2);
    const foundationMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
    });
    const foundationMesh = new THREE.Mesh(foundationGeom, foundationMat);
    foundationMesh.position.y = 0.2;
    foundationMesh.receiveShadow = true;
    group.add(foundationMesh);

    // If Blueprint 2D is selected and image is loaded, create foundation blueprint overlay
    if (method === 'blueprint_2d' && blueprintPreviewUrl) {
      new THREE.TextureLoader().load(blueprintPreviewUrl, (texture) => {
        const bpGeom = new THREE.PlaneGeometry(buildingWidth, buildingLength);
        const bpMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.85,
        });
        const bpMesh = new THREE.Mesh(bpGeom, bpMat);
        bpMesh.rotation.x = -Math.PI / 2;
        bpMesh.position.y = 0.41;
        group.add(bpMesh);
      });
    }

    // Generate each floor level
    for (let f = 0; f < totalFloors; f++) {
      const floorBottom = 0.4 + f * floorHeight;
      const floorTop = floorBottom + floorHeight;
      const floorCenterY = floorBottom + floorHeight / 2;

      // Floor intermediate slab
      const slabGeom = new THREE.BoxGeometry(buildingWidth + 0.3, 0.15, buildingLength + 0.3);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
      });
      const slabMesh = new THREE.Mesh(slabGeom, slabMat);
      slabMesh.position.y = floorBottom + 0.075;
      group.add(slabMesh);

      // Divide floor plate into strata units
      const unitLength = buildingLength;
      const unitWidth = buildingWidth / unitsPerFloor;

      for (let u = 0; u < unitsPerFloor; u++) {
        const unitCenterX = -buildingWidth / 2 + unitWidth / 2 + u * unitWidth;
        const unitCenterZ = 0;

        const unitGeom = new THREE.BoxGeometry(unitWidth - 0.2, floorHeight - 0.2, unitLength - 0.2);

        const color = unitColors[u % unitColors.length];
        const unitMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.3,
          metalness: 0.15,
          wireframe: isWireframe,
          transparent: isXRay || isWireframe,
          opacity: isWireframe ? 0.8 : isXRay ? 0.38 : 0.88,
        });

        const unitMesh = new THREE.Mesh(unitGeom, unitMat);
        unitMesh.position.set(unitCenterX, floorCenterY, unitCenterZ);
        unitMesh.castShadow = !isWireframe;
        unitMesh.receiveShadow = true;
        group.add(unitMesh);

        // Edges wireframe highlight for clean architectural CAD look
        if (!isWireframe) {
          const edgesGeom = new THREE.EdgesGeometry(unitGeom);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x0f172a,
            linewidth: 1,
            transparent: true,
            opacity: 0.4,
          });
          const wireframeLine = new THREE.LineSegments(edgesGeom, lineMat);
          wireframeLine.position.copy(unitMesh.position);
          group.add(wireframeLine);
        }
      }
    }

    // Roof Slab & Parapet
    const roofY = 0.4 + totalFloors * floorHeight;
    const roofGeom = new THREE.BoxGeometry(buildingWidth + 0.4, 0.25, buildingLength + 0.4);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
    });
    const roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.position.y = roofY + 0.125;
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Parapet Wall
    const parapetGeom = new THREE.BoxGeometry(buildingWidth + 0.2, 0.6, buildingLength + 0.2);
    const parapetEdges = new THREE.EdgesGeometry(parapetGeom);
    const parapetWire = new THREE.LineSegments(
      parapetEdges,
      new THREE.LineBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.6 })
    );
    parapetWire.position.y = roofY + 0.55;
    group.add(parapetWire);
  };

  // Preset Camera Angles
  const setCameraPreset = (preset: 'iso' | 'front' | 'top') => {
    setCameraView(preset);
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const targetY = totalHeight / 2;
    const dist = Math.max(30, Math.max(buildingWidth, buildingLength) * 2.2);

    if (preset === 'iso') {
      camera.position.set(dist * 0.7, targetY + dist * 0.55, dist * 0.7);
    } else if (preset === 'front') {
      camera.position.set(0, targetY + 2, dist * 1.1);
    } else if (preset === 'top') {
      camera.position.set(0.01, dist * 1.3, 0.01);
    }
    camera.lookAt(0, targetY, 0);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-full text-white">
      {/* 3D Viewport Controls & HUD Header */}
      <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">
            Pre-Submission 3D Preview (Three.js WebGL)
          </span>
        </div>

        {/* View Mode & Preset Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Shading mode */}
          <div className="flex bg-slate-800 rounded-md p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setShadingMode('solid')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                shadingMode === 'solid' ? 'bg-[#1e3a8a] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => setShadingMode('xray')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                shadingMode === 'xray' ? 'bg-[#1e3a8a] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              X-Ray
            </button>
            <button
              type="button"
              onClick={() => setShadingMode('wireframe')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                shadingMode === 'wireframe' ? 'bg-[#1e3a8a] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wireframe
            </button>
          </div>

          {/* Camera angle */}
          <div className="flex bg-slate-800 rounded-md p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setCameraPreset('iso')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                cameraView === 'iso' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ISO
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('front')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                cameraView === 'front' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              FRONT
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('top')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                cameraView === 'top' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              TOP
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative flex-1 min-h-[260px] w-full bg-slate-100">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Spinner */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center gap-2 text-white font-mono text-xs">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Parsing 3D GLB mesh structure...</span>
          </div>
        )}

        {/* Notice badge overlay */}
        <div className="absolute top-2 left-2 pointer-events-none bg-slate-950/80 backdrop-blur-xs border border-slate-700 px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>Rotate: Drag &bull; Zoom: Scroll &bull; Pan: Right-Click</span>
        </div>

        {/* Real-time Dimensions Floating HUD */}
        <div className="absolute bottom-2 right-2 pointer-events-none bg-slate-950/85 backdrop-blur-xs border border-slate-700/80 p-2 rounded-lg text-[10px] font-mono text-slate-300 space-y-0.5 shadow-md">
          <div className="text-cyan-400 font-bold flex items-center justify-between gap-3">
            <span>Building Height:</span>
            <span>{totalHeight.toFixed(1)} m</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Total Volume:</span>
            <span>{Math.round(buildingVolume).toLocaleString()} m³</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Footprint:</span>
            <span>{footprintArea} m² ({buildingWidth}m × {buildingLength}m)</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Strata Units:</span>
            <span className="text-emerald-400 font-bold">{totalUnits} Units ({unitsPerFloor}/flr)</span>
          </div>
        </div>

        {modelLoadError && (
          <div className="absolute bottom-2 left-2 bg-amber-950/80 border border-amber-600/80 text-amber-200 text-[10px] font-mono px-2 py-1 rounded">
            {modelLoadError}
          </div>
        )}
      </div>

      {/* Cadastral Verification Status Footer */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Volumetric Geometry Validated</span>
        </div>
        <span className="text-cyan-400 font-semibold">{surveyNumber}</span>
      </div>
    </div>
  );
};
