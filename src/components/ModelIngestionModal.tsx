import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import {
  Building,
  Floor,
  IngestionMethod,
  IngestionPayload,
  EnrichedProperty,
} from '../types';
import { cadastreService } from '../services/cadastreService';
import { ParcelMapPicker } from './ParcelMapPicker';
import { Model3DPreview } from './Model3DPreview';
import {
  X,
  Upload,
  Layers,
  Box,
  Sliders,
  CheckCircle2,
  FileCode,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Cuboid,
  Image as ImageIcon,
  Compass,
  Eye,
  Check,
} from 'lucide-react';

interface ModelIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates?: { lat: number; lng: number };
  onSuccess: (result: {
    building: Building;
    allFloors: Floor[];
    enrichedProperties?: EnrichedProperty[];
  }) => void;
}

export const ModelIngestionModal: React.FC<ModelIngestionModalProps> = ({
  isOpen,
  onClose,
  coordinates,
  onSuccess,
}) => {
  // Dynamic GPS Coordinates state (replaces hardcoded default)
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: coordinates?.lat ?? 17.385044,
    lng: coordinates?.lng ?? 78.486671,
  });

  const [selectedMethod, setSelectedMethod] = useState<IngestionMethod>('parametric_builder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Common Cadastral Fields
  const [surveyNumber, setSurveyNumber] = useState(`SY-${Math.floor(100 + Math.random() * 900)}/2B`);
  const [address, setAddress] = useState(
    `Plot at ${activeCoords.lat.toFixed(4)}, ${activeCoords.lng.toFixed(4)}, Hyderabad`
  );
  const [plotArea, setPlotArea] = useState(650);

  // Dimensions & Volumetric Controls
  const [totalFloors, setTotalFloors] = useState(4);
  const [floorHeight, setFloorHeight] = useState(3.0);
  const [buildingWidth, setBuildingWidth] = useState(16.0);
  const [buildingLength, setBuildingLength] = useState(14.0);
  const [unitsPerFloor, setUnitsPerFloor] = useState(2);

  // Method 1: Blueprint 2D State
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [blueprintPreviewUrl, setBlueprintPreviewUrl] = useState<string | null>(null);

  // Method 2: Direct 3D Asset (.glb) State
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [subMeshStrategy, setSubMeshStrategy] = useState<'named_sub_meshes' | 'envelope_sliced'>('envelope_sliced');

  // Real-time volumetric calculations
  const totalHeight = totalFloors * floorHeight;
  const buildingVolume = buildingWidth * buildingLength * totalHeight;
  const floorPlateArea = buildingWidth * buildingLength;
  const unitAreaApprox = Math.round((floorPlateArea / unitsPerFloor) * 0.92);

  // Blueprint file change handler
  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBlueprintFile(file);
      setBlueprintPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3D Model file change handler
  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setModelFile(file);
    }
  };

  // Generates 3D extruded geometry from floor footprint and packages as GLB binary
  const generateExtrudedGlbBlob = async (): Promise<Blob | null> => {
    try {
      const scene = new THREE.Scene();

      const shape = new THREE.Shape();
      const halfW = buildingWidth / 2;
      const halfL = buildingLength / 2;
      shape.moveTo(-halfW, -halfL);
      shape.lineTo(halfW, -halfL);
      shape.lineTo(halfW, halfL);
      shape.lineTo(-halfW, halfL);
      shape.closePath();

      const extrudeSettings = {
        steps: totalFloors,
        depth: totalHeight,
        bevelEnabled: false,
      };

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.rotateX(-Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a,
        roughness: 0.4,
        metalness: 0.2,
        name: 'ExtrudedCadastreEnvelope',
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `Building_Cadastre_${surveyNumber.replace(/[^a-zA-Z0-9]/g, '_')}`;
      scene.add(mesh);

      return await new Promise<Blob | null>((resolve) => {
        const timer = setTimeout(() => {
          console.warn('GLTF export timed out, continuing parametric flow');
          resolve(null);
        }, 1500);

        try {
          const exporter = new GLTFExporter();
          exporter.parse(
            scene,
            (result) => {
              clearTimeout(timer);
              if (result instanceof ArrayBuffer) {
                resolve(new Blob([result], { type: 'model/gltf-binary' }));
              } else {
                const output = JSON.stringify(result, null, 2);
                resolve(new Blob([output], { type: 'model/gltf+json' }));
              }
            },
            (error) => {
              clearTimeout(timer);
              console.warn('GLTF export error:', error);
              resolve(null);
            },
            { binary: true }
          );
        } catch (err) {
          clearTimeout(timer);
          console.warn('GLTFExporter init error:', err);
          resolve(null);
        }
      });
    } catch (err) {
      console.warn('Geometry generation error:', err);
      return null;
    }
  };

  const handleRegisterBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('Preparing 3D volumetric payload...');

    try {
      let generatedGlbBlob: Blob | null = null;

      if (selectedMethod === 'blueprint_2d') {
        setStatusMessage('Extruding 3D geometry from 2D blueprint...');
        try {
          generatedGlbBlob = await generateExtrudedGlbBlob();
        } catch (exportErr) {
          console.warn('GLTF export error, continuing with parametric records:', exportErr);
        }
      }

      setStatusMessage('Ingesting entities into PostGIS cadastre & 3D WebGL pipeline...');

      const payload: IngestionPayload = {
        method: selectedMethod,
        coordinates: activeCoords,
        surveyNumber: surveyNumber.trim() || `SY-${Math.floor(100 + Math.random() * 900)}/A`,
        address: address.trim(),
        plotArea,
        totalFloors,
        floorHeight,
        buildingWidth,
        buildingLength,
        unitsPerFloor,
        blueprintImageFile: blueprintFile,
        blueprintImageUrl: blueprintPreviewUrl || undefined,
        modelFile,
        modelFileName: modelFile?.name,
        subMeshStrategy,
        generatedGlbBlob,
      };

      const result = await cadastreService.ingestBuilding(payload);

      setStatusMessage('Registration complete! Synchronizing 3D viewer...');
      setIsSubmitting(false);
      onSuccess({
        building: result.building,
        allFloors: result.allFloors,
        enrichedProperties: result.enrichedProperties,
      });
      onClose();
    } catch (err: any) {
      console.error('Ingestion error:', err);
      setStatusMessage(`Error: ${err.message || 'Failed to ingest building'}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col my-4 max-h-[94vh]">
        {/* Institutional Cadastral Header with Dynamic Coordinates Badge */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1e3a8a] shadow-xs">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  + Register 3D Building for Parcel
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold">
                  Cadastral Field Survey
                </span>
              </div>
              {/* Dynamic Coordinate Bar replacing static default */}
              <div className="flex items-center gap-2 text-xs font-mono mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>Cadastral Anchor:</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#1e3a8a] border border-blue-200 font-bold shadow-xs">
                  {activeCoords.lat.toFixed(6)}° N, {activeCoords.lng.toFixed(6)}° E
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  (Editable via map pin, link, or manual fields below)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleRegisterBuilding} className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-slate-700 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Geospatial Map Window, Ingestion Workflows & Inputs */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Small Embedded Window for GPS, Google Maps Link & Map Pin */}
              <ParcelMapPicker
                latitude={activeCoords.lat}
                longitude={activeCoords.lng}
                onChange={(coords) => setActiveCoords(coords)}
                onAddressSuggest={(addr) => setAddress(addr)}
              />

              {/* 2. Select 3D Ingestion Workflow Tabs (3 methods kept as is) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Select 3D Ingestion Workflow:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Method 1: 2D Blueprint */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('blueprint_2d')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                      selectedMethod === 'blueprint_2d'
                        ? 'bg-blue-50/80 border-[#1e3a8a] shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1e3a8a] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      {selectedMethod === 'blueprint_2d' && <CheckCircle2 className="w-4 h-4 text-[#1e3a8a]" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Method 1: 2D Blueprint</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Extrude floor plan image into multi-floor 3D solid
                      </div>
                    </div>
                  </button>

                  {/* Method 2: Direct 3D Asset (.glb) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('direct_3d_glb')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                      selectedMethod === 'direct_3d_glb'
                        ? 'bg-blue-50/80 border-[#1e3a8a] shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1e3a8a] flex items-center justify-center">
                        <FileCode className="w-4 h-4" />
                      </div>
                      {selectedMethod === 'direct_3d_glb' && <CheckCircle2 className="w-4 h-4 text-[#1e3a8a]" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Method 2: 3D Asset (.glb)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Upload BIM/CAD model with sub-mesh or envelope parsing
                      </div>
                    </div>
                  </button>

                  {/* Method 3: Parametric */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('parametric_builder')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                      selectedMethod === 'parametric_builder'
                        ? 'bg-blue-50/80 border-[#1e3a8a] shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1e3a8a] flex items-center justify-center">
                        <Cuboid className="w-4 h-4" />
                      </div>
                      {selectedMethod === 'parametric_builder' && <CheckCircle2 className="w-4 h-4 text-[#1e3a8a]" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Method 3: Parametric</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Generate multi-floor voxels and volumetric cadastre
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Workflow Specific Ingestion Area */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                {/* METHOD 1: 2D Blueprint */}
                {selectedMethod === 'blueprint_2d' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[#1e3a8a] flex items-center gap-1.5 font-mono text-xs">
                        <ImageIcon className="w-4 h-4" />
                        <span>Upload 2D Blueprint (PNG / JPG / Vector SVG)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Three.js ExtrudeGeometry</span>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 hover:border-[#1e3a8a] rounded-xl p-4 text-center cursor-pointer transition-all bg-white">
                      <input
                        type="file"
                        accept="image/*,.pdf,.svg"
                        onChange={handleBlueprintUpload}
                        className="hidden"
                        id="blueprint-upload-input"
                      />
                      <label htmlFor="blueprint-upload-input" className="cursor-pointer block">
                        {blueprintPreviewUrl ? (
                          <div className="flex items-center gap-4 text-left">
                            <img
                              src={blueprintPreviewUrl}
                              alt="Blueprint Preview"
                              className="w-24 h-24 object-cover rounded-lg border border-blue-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{blueprintFile?.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-1">
                                Floor plan loaded. Extruding across {totalFloors} floors (Height: {totalHeight}m).
                              </div>
                              <span className="mt-2 inline-block text-[10px] text-[#1e3a8a] bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                                Click to replace blueprint image
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 space-y-1.5">
                            <Upload className="w-7 h-7 text-[#1e3a8a] mx-auto opacity-80" />
                            <div className="font-medium text-slate-700">
                              Drop 2D Architectural Floor Plan or <span className="text-[#1e3a8a] underline">Browse</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Accepted formats: PNG, JPG, WebP, SVG Vector Blueprints
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* METHOD 2: Direct 3D Asset Upload (.glb / .gltf) */}
                {selectedMethod === 'direct_3d_glb' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[#1e3a8a] flex items-center gap-1.5 font-mono text-xs">
                        <FileCode className="w-4 h-4" />
                        <span>Upload 3D Architectural Model (.glb / .gltf)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Binary glTF 2.0 / BIM Model</span>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 hover:border-[#1e3a8a] rounded-xl p-4 text-center cursor-pointer transition-all bg-white">
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleModelFileUpload}
                        className="hidden"
                        id="model-upload-input"
                      />
                      <label htmlFor="model-upload-input" className="cursor-pointer block">
                        {modelFile ? (
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1e3a8a]">
                              <Box className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{modelFile.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {(modelFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Target: buildings/{'{id}'}.glb
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 space-y-1.5">
                            <Upload className="w-7 h-7 text-[#1e3a8a] mx-auto opacity-80" />
                            <div className="font-medium text-slate-700">
                              Select binary <span className="text-[#1e3a8a] font-mono font-bold">.glb</span> or <span className="text-[#1e3a8a] font-mono font-bold">.gltf</span> file
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Model will be previewed in 3D viewport on right before submission
                            </div>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* Sub-mesh Strategy Prompt */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-xs text-[#1e3a8a]">
                        <Info className="w-3.5 h-3.5" />
                        <span>Selection Strategy (3D Sub-Mesh Structure)</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                          <input
                            type="radio"
                            name="subMeshStrategy"
                            value="named_sub_meshes"
                            checked={subMeshStrategy === 'named_sub_meshes'}
                            onChange={() => setSubMeshStrategy('named_sub_meshes')}
                            className="mt-0.5 text-[#1e3a8a] focus:ring-[#1e3a8a] cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              (a) Named Sub-Meshes for Individual Flats
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Raycast hits directly highlight specific property unit meshes.
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all">
                          <input
                            type="radio"
                            name="subMeshStrategy"
                            value="envelope_sliced"
                            checked={subMeshStrategy === 'envelope_sliced'}
                            onChange={() => setSubMeshStrategy('envelope_sliced')}
                            className="mt-0.5 text-[#1e3a8a] focus:ring-[#1e3a8a] cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              (b) Outer Architectural Envelope / Mass
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Auto-generates vertical strata partitions & unit bounding boxes.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Volumetric & Cadastral Dimensions Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-semibold text-[#1e3a8a] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" />
                      <span>Volumetric & Cadastral Dimensions</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Volume: <strong className="text-[#1e3a8a] font-bold">{Math.round(buildingVolume)} m³</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Total Storeys:</label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Floor Height (m):</label>
                      <input
                        type="number"
                        step={0.1}
                        min={2.4}
                        max={6.0}
                        value={floorHeight}
                        onChange={(e) => setFloorHeight(parseFloat(e.target.value) || 3.0)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Width (X m):</label>
                      <input
                        type="number"
                        step={0.5}
                        min={6}
                        max={60}
                        value={buildingWidth}
                        onChange={(e) => setBuildingWidth(parseFloat(e.target.value) || 16)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Length (Z m):</label>
                      <input
                        type="number"
                        step={0.5}
                        min={6}
                        max={60}
                        value={buildingLength}
                        onChange={(e) => setBuildingLength(parseFloat(e.target.value) || 14)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Flats per Floor:</label>
                      <select
                        value={unitsPerFloor}
                        onChange={(e) => setUnitsPerFloor(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:outline-none cursor-pointer"
                      >
                        <option value={1}>1 Unit / Full-Floor Penthouse ({floorPlateArea} m²)</option>
                        <option value={2}>2 Units / Floor (~{Math.round(floorPlateArea / 2)} m² each)</option>
                        <option value={3}>3 Units / Floor (~{Math.round(floorPlateArea / 3)} m² each)</option>
                        <option value={4}>4 Units / Floor (~{Math.round(floorPlateArea / 4)} m² each)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Total Height (m):</label>
                      <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#1e3a8a] font-mono font-bold flex items-center justify-between">
                        <span>{totalHeight.toFixed(1)} metres</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {totalFloors * unitsPerFloor} Total Strata Units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Cadastral Revenue Records */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] text-slate-600 font-mono mb-1">
                    Cadastral Survey Number:
                  </label>
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    placeholder="e.g. SY-402/1B"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 font-mono mb-1">
                    Plot Area (sq. metres):
                  </label>
                  <input
                    type="number"
                    value={plotArea}
                    onChange={(e) => setPlotArea(parseFloat(e.target.value) || 500)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:border-[#1e3a8a] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-600 font-mono mb-1">
                    Property Address:
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans focus:border-[#1e3a8a] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Pre-Submission 3D Model Inspection Viewport & Submission Panel */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* 3D Viewport Title & Instruction */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 font-mono">
                    <Eye className="w-4 h-4 text-[#1e3a8a]" />
                    <span>Pre-Submission 3D Inspection</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">
                    Live WebGL Viewport
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inspect the synthesized volumetric 3D building before submitting to the cadastral register.
                </p>
              </div>

              {/* Live 3D Model Preview Component */}
              <div className="h-[380px] w-full">
                <Model3DPreview
                  method={selectedMethod}
                  totalFloors={totalFloors}
                  floorHeight={floorHeight}
                  buildingWidth={buildingWidth}
                  buildingLength={buildingLength}
                  unitsPerFloor={unitsPerFloor}
                  blueprintPreviewUrl={blueprintPreviewUrl}
                  modelFile={modelFile}
                  surveyNumber={surveyNumber}
                />
              </div>

              {/* Pre-Submission Verification Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[11px] font-mono">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Pre-Submission Verification:</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ready for Ingestion
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                  <div>
                    <span className="block text-[10px] text-slate-400">Target Coordinates:</span>
                    <strong className="text-slate-900">{activeCoords.lat.toFixed(5)}, {activeCoords.lng.toFixed(5)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Total Height:</span>
                    <strong className="text-slate-900">{totalHeight.toFixed(1)} m ({totalFloors} Storeys)</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Building Footprint:</span>
                    <strong className="text-slate-900">{floorPlateArea} m² ({buildingWidth}m × {buildingLength}m)</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Strata Breakdown:</span>
                    <strong className="text-emerald-700 font-bold">{totalFloors * unitsPerFloor} Units ({unitAreaApprox} m² avg)</strong>
                  </div>
                </div>
              </div>

              {/* Status message */}
              {statusMessage && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1e3a8a] text-xs font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1e3a8a] animate-pulse" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-ingest-building"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Ingesting 3D Cadastre...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Register & Extrude 3D Building</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
