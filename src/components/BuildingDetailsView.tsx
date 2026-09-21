import React, { useState } from 'react';
import { Building, Floor } from '../types';
import {
  Building2,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  Plus,
  Ruler,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';
import { Pagination } from './Pagination';

interface BuildingDetailsViewProps {
  buildings: Building[];
  floors: Floor[];
  onUpdateBuilding: (bldId: string, updated: Partial<Building>) => Promise<void>;
  onRefresh: () => void;
}

export const BuildingDetailsView: React.FC<BuildingDetailsViewProps> = ({
  buildings,
  floors,
  onUpdateBuilding,
  onRefresh,
}) => {
  const currentBld = buildings[0] || {
    building_id: 'B001',
    survey_number: 'SY-402/1A',
    address: 'Plot 42, Cyber Enclave, Hitech City Main Rd, Madhapur, Hyderabad, Telangana 500081',
    latitude: 17.4485,
    longitude: 78.3748,
    plot_area: 1250.0,
    number_of_floors: 3,
    total_building_height: 9.0,
    state_code: 'TS',
  };

  const bldFloors = floors
    .filter((f) => f.building_id === currentBld.building_id)
    .sort((a, b) => a.floor_number - b.floor_number);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [surveyNumber, setSurveyNumber] = useState(currentBld.survey_number);
  const [address, setAddress] = useState(currentBld.address);
  const [latitude, setLatitude] = useState(currentBld.latitude);
  const [longitude, setLongitude] = useState(currentBld.longitude);
  const [plotArea, setPlotArea] = useState(currentBld.plot_area);
  const [numFloors, setNumFloors] = useState(currentBld.number_of_floors);
  const [totalHeight, setTotalHeight] = useState(currentBld.total_building_height);

  // Pagination for floors
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const totalItems = bldFloors.length;
  const paginatedFloors = bldFloors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateBuilding(currentBld.building_id, {
        survey_number: surveyNumber,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        plot_area: Number(plotArea),
        number_of_floors: Number(numFloors),
        total_building_height: Number(totalHeight),
      });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Floor overlap & elevation validation
  const validationAlerts: { type: 'error' | 'warning' | 'pass'; text: string }[] = [];
  let maxFloorCeiling = 0;

  for (let i = 0; i < bldFloors.length; i++) {
    const fl = bldFloors[i];
    if (fl.top_height <= fl.bottom_height) {
      validationAlerts.push({
        type: 'error',
        text: `Floor ${fl.floor_number}: Top elevation (${fl.top_height}m) must be greater than bottom elevation (${fl.bottom_height}m).`,
      });
    }
    if (i < bldFloors.length - 1) {
      const nextFl = bldFloors[i + 1];
      if (fl.top_height > nextFl.bottom_height) {
        validationAlerts.push({
          type: 'error',
          text: `Vertical overlap detected between Floor ${fl.floor_number} (top: ${fl.top_height}m) and Floor ${nextFl.floor_number} (bottom: ${nextFl.bottom_height}m).`,
        });
      }
    }
    if (fl.top_height > maxFloorCeiling) maxFloorCeiling = fl.top_height;
  }

  if (totalHeight < maxFloorCeiling) {
    validationAlerts.push({
      type: 'warning',
      text: `Building total height (${totalHeight}m) is less than registered floor ceiling (${maxFloorCeiling}m).`,
    });
  } else {
    validationAlerts.push({
      type: 'pass',
      text: `All ${bldFloors.length} floors (0m to ${maxFloorCeiling}m) are bounded within building height (${totalHeight}m).`,
    });
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Top Banner */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-[#1e3a8a] border border-blue-200 uppercase font-mono">
              Building Structural Hierarchy
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Survey No: <strong>{currentBld.survey_number}</strong>
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
            Building {currentBld.building_id}: Parcel Plot & Vertical Strata Specifications
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Official cadastral parcel definition, geospatial coordinate positioning, setbacks, and vertical floor slab stratification standards.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#1e3a8a]" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Parcel Attributes'}</span>
        </button>
      </div>

      {/* Building Attributes Grid / Structured Edit Form */}
      {isEditing ? (
        <form
          onSubmit={handleSaveBuilding}
          className="p-5 rounded-lg bg-white border border-slate-300 shadow-sm space-y-4 text-xs"
        >
          <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1e3a8a]" />
              <span>Update Building {currentBld.building_id} Attributes</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Government Survey Form 4B</span>
          </div>

          <fieldset className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-3">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1 font-mono">
              1. Spatial Location & Dimensions
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Survey Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Plot Ground Area (sq.m) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={plotArea}
                  onChange={(e) => setPlotArea(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Building Height (m) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={totalHeight}
                  onChange={(e) => setTotalHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Cadastral Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Floors (Count) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={numFloors}
                  onChange={(e) => setNumFloors(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Latitude (&deg;N) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Longitude (&deg;E) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-1.5 rounded bg-[#1e3a8a] hover:bg-blue-900 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save Parcel Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">Survey Reference</div>
            <div className="text-sm font-bold text-slate-900 mt-1">{currentBld.survey_number}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{currentBld.address}</div>
          </div>
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">Plot Footprint</div>
            <div className="text-sm font-bold text-slate-900 mt-1">{currentBld.plot_area} sq.m</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Coverage: ~65% permissible</div>
          </div>
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">Vertical Strata</div>
            <div className="text-sm font-bold text-slate-900 mt-1">{currentBld.number_of_floors} Floors ({currentBld.total_building_height}m)</div>
            <div className="text-[11px] text-[#059669] font-medium mt-0.5">Avg Slab Height: 3.0m</div>
          </div>
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="text-slate-500 text-[10px] uppercase font-bold font-mono">Jurisdiction</div>
            <div className="text-sm font-bold text-slate-900 mt-1">{currentBld.state_code} &bull; Telangana</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Mandal: {currentBld.mandal_or_taluk || 'Serilingampally'}</div>
          </div>
        </div>
      )}

      {/* Validation Status Box */}
      <div className="space-y-2">
        {validationAlerts.map((alert, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              alert.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : alert.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            {alert.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
        ))}
      </div>

      {/* Floor Strata Table with Reusable Pagination */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Layers className="w-4 h-4 text-[#1e3a8a]" />
            <span>Vertical Floor Stratification & Elevation Bounds ({totalItems} Floors)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-600">Standard 3.0m Floor Increment</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Floor ID</th>
                <th className="px-4 py-2.5">Floor Level</th>
                <th className="px-4 py-2.5">Designation</th>
                <th className="px-4 py-2.5">Bottom Elevation</th>
                <th className="px-4 py-2.5">Top Elevation</th>
                <th className="px-4 py-2.5">Clearance (&Delta;h)</th>
                <th className="px-4 py-2.5">Active Unit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedFloors.map((fl) => (
                <tr
                  key={fl.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    fl.floor_number === 2 ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{fl.floor_id}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1e3a8a]">Level {fl.floor_number}</td>
                  <td className="px-4 py-2.5 text-slate-700">{fl.floor_name || `Floor ${fl.floor_number}`}</td>
                  <td className="px-4 py-2.5 font-mono text-amber-900">{fl.bottom_height.toFixed(1)} metres</td>
                  <td className="px-4 py-2.5 font-mono text-amber-900">{fl.top_height.toFixed(1)} metres</td>
                  <td className="px-4 py-2.5 font-mono text-slate-700">
                    {(fl.top_height - fl.bottom_height).toFixed(1)} metres
                  </td>
                  <td className="px-4 py-2.5">
                    {fl.floor_number === 2 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#1e3a8a] border border-blue-300 flex items-center gap-1 w-max">
                        Flat 203 (PROP001)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Available for expansion</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[3, 5, 10]}
        />
      </div>
    </div>
  );
};
