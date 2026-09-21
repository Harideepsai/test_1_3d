import React, { useState } from 'react';
import { EnrichedProperty, Floor } from '../types';
import { ThreeCanvas } from './ThreeCanvas';
import { PropertyInfoPanel } from './PropertyInfoPanel';
import { LeafletMap } from './LeafletMap';
import {
  Box,
  Layers,
  MapPin,
  Sliders,
  Sparkles,
  Info,
  Building2,
  RefreshCw,
  Maximize,
  CheckCircle2,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface CombinedDemoViewProps {
  enrichedProperty: EnrichedProperty | null;
  allProperties: EnrichedProperty[];
  allFloors: Floor[];
  selectedPropertyId: string;
  onSelectProperty: (propertyId: string) => void;
  onUpdateProperty: (updatedFields: any) => Promise<void>;
  onRefresh: () => void;
}

export const CombinedDemoView: React.FC<CombinedDemoViewProps> = ({
  enrichedProperty,
  allProperties,
  allFloors,
  selectedPropertyId,
  onSelectProperty,
  onUpdateProperty,
  onRefresh,
}) => {
  const [explodedOffset, setExplodedOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'volumetric' | 'xray' | 'wireframe'>('volumetric');
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [filterFloor, setFilterFloor] = useState<number | 'ALL'>('ALL');

  const isSelected = !!enrichedProperty && enrichedProperty.property.property_id === selectedPropertyId;

  return (
    <div className="space-y-6 font-sans">
      {/* Demonstration Scenario Header Bar */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-[#1e3a8a] border border-blue-200 uppercase font-mono">
              SIH 2026 Core Workflow
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Vertical 3D Multi-Unit Apartment Cadastre Demonstration
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Complete 3D Building Complex (Ground Floor Parking & Watchman, Floors 1–3 with 2 flats each) connected with authorized cadastral records and spatial vertical bounds.
          </p>
        </div>

        {/* Property Selector & Scenario Quick Launcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-medium hidden sm:inline">Active Unit:</span>
            <select
              value={selectedPropertyId}
              onChange={(e) => onSelectProperty(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-800 font-medium focus:outline-none focus:border-[#1e3a8a] text-xs cursor-pointer"
            >
              {allProperties.map((p) => (
                <option key={p.property.property_id} value={p.property.property_id}>
                  {p.property.flat_number} (Floor {p.floor.floor_number}) - {p.prototype3DId.generated_identifier}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
            title="Refresh Cadastral State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Unit Selector Matrix (Ground Floor, 1st, 2nd, 3rd) */}
      <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Layers className="w-3.5 h-3.5 text-[#1e3a8a]" />
            Apartment Unit Quick Switcher ({allProperties.length} Units Total)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Click any card or 3D block to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {allProperties.map((p) => {
            const isCurrent = p.property.property_id === selectedPropertyId;
            const isGround = p.floor.floor_number === 0;
            return (
              <button
                key={p.property.property_id}
                onClick={() => onSelectProperty(p.property.property_id)}
                className={`p-2 rounded border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-50 border-[#1e3a8a] shadow-xs ring-1 ring-[#1e3a8a]'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
                      isGround
                        ? 'bg-emerald-50 text-[#059669] border border-emerald-300'
                        : 'bg-blue-50 text-[#1e3a8a] border border-blue-200'
                    }`}
                  >
                    F{p.floor.floor_number}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {p.verticalGeometry.bottom_height}–{p.verticalGeometry.top_height}m
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate" title={p.property.flat_number}>
                  {p.property.flat_number}
                </div>
                <div className="text-[10px] text-[#1e3a8a] font-mono truncate mt-0.5">
                  {p.prototype3DId.generated_identifier}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Combined Grid: Left 3D WebGL Canvas + Right Property Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 3D WebGL Cadastre Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <div className="flex items-center gap-1.5 text-[#1e3a8a] font-mono uppercase tracking-wider">
              <Box className="w-4 h-4" />
              <span>Interactive 3D Multi-Unit Apartment Cadastre (Three.js WebGL)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] font-mono">Orbit / Pan / Zoom</span>
            </div>
          </div>

          {/* 3D WebGL Container */}
          <div id="three-cadastre-viewport" className="h-[460px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs">
            <ThreeCanvas
              enrichedProperty={enrichedProperty}
              allProperties={allProperties}
              allFloors={allFloors}
              isSelected={isSelected}
              onSelectProperty={onSelectProperty}
              explodedOffset={explodedOffset}
              viewMode={viewMode}
              showRuler={showRuler}
              filterFloor={filterFloor}
            />
          </div>

          {/* 3D Visual Customization Bar (Explode, Floor Isolation, X-Ray, Wireframe) */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Render:</span>
              <div className="flex rounded bg-slate-100 p-0.5 border border-slate-200">
                <button
                  onClick={() => setViewMode('volumetric')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'volumetric' ? 'bg-[#1e3a8a] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => setViewMode('xray')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'xray' ? 'bg-[#1e3a8a] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  X-Ray
                </button>
                <button
                  onClick={() => setViewMode('wireframe')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'wireframe' ? 'bg-[#1e3a8a] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Wireframe
                </button>
              </div>
            </div>

            {/* Floor Isolation Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">Floor:</span>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#1e3a8a] cursor-pointer"
              >
                <option value="ALL">All 4 Floors (Full Building)</option>
                <option value={0}>Ground Floor (Parking & Watchman)</option>
                <option value={1}>1st Floor (Flats 101 & 102)</option>
                <option value={2}>2nd Floor (Flats 201 & 202)</option>
                <option value={3}>3rd Floor (Flats 301 & 302)</option>
              </select>
            </div>

            {/* Exploded Floor Plate Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Floor Explode:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedOffset}
                onChange={(e) => setExplodedOffset(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e3a8a]"
              />
              <span className="font-mono text-[#1e3a8a] text-[11px] font-bold">{(explodedOffset * 100).toFixed(0)}%</span>
            </div>

            {/* Toggle Ruler */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
                className="rounded bg-white border-slate-300 text-[#1e3a8a] focus:ring-0 cursor-pointer"
              />
              <span>Height Ruler</span>
            </label>
          </div>
        </div>

        {/* Right Column: Structured Property Information & ULPIN Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <div className="flex items-center gap-1.5 text-[#1e3a8a] font-mono uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Structured Cadastral & Ownership Record</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">{enrichedProperty?.property.property_id}</span>
          </div>

          <PropertyInfoPanel
            enrichedProperty={enrichedProperty}
            onUpdateProperty={onUpdateProperty}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Synchronized Geographic Location Component (Interactive Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <div className="flex items-center gap-1.5 text-[#1e3a8a] font-mono uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Synchronized Geographic Parcel Location & Cadastral Coordinates</span>
            </div>
            <span className="text-slate-600 text-xs font-mono">
              Lat: {enrichedProperty?.location.latitude.toFixed(4)}° N, Lng: {enrichedProperty?.location.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="h-[380px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs">
            <LeafletMap
              building={enrichedProperty?.building || null}
              location={enrichedProperty?.location || null}
              isSelected={isSelected}
              allowEditCoordinates={true}
              onCoordinatesChange={async (lat, lng) => {
                await onUpdateProperty({ latitude: lat, longitude: lng });
              }}
              onBuildingClick={(bldId) => {
                const el = document.getElementById('three-cadastre-viewport');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* SIH26011 Architectural Demonstration Summary */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 space-y-3 shadow-xs">
        <div className="font-semibold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Cadastral Data Pipeline Verification (SIH26011 Compliance)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 shadow-xs">
            <strong className="text-[#1e3a8a] block mb-1">1. Authorized Record:</strong>
            Linked to Document <span className="font-mono text-slate-900">{enrichedProperty?.property.property_record_ref}</span> in SRO records.
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 shadow-xs">
            <strong className="text-[#1e3a8a] block mb-1">2. Geographic Anchor:</strong>
            Parcel Survey #{enrichedProperty?.building.survey_number} mapped at ({enrichedProperty?.location.latitude.toFixed(4)}, {enrichedProperty?.location.longitude.toFixed(4)}).
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 shadow-xs">
            <strong className="text-[#1e3a8a] block mb-1">3. Vertical Stratification:</strong>
            Floor {enrichedProperty?.floor.floor_number} bounded at Z={enrichedProperty?.verticalGeometry.bottom_height}m to {enrichedProperty?.verticalGeometry.top_height}m.
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 shadow-xs">
            <strong className="text-[#1e3a8a] block mb-1">4. Volumetric Identifier:</strong>
            Unique Prototype 3D Property ID <span className="font-mono text-[#059669] font-bold">{enrichedProperty?.prototype3DId.generated_identifier}</span> generated.
          </div>
        </div>
      </div>
    </div>
  );
};
