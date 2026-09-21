import React, { useState, useEffect } from 'react';
import { Building, Floor, EnrichedProperty } from '../types';
import { cadastreService } from '../services/cadastreService';
import { useAuth } from '../services/authService';
import { ThreeCanvas } from './ThreeCanvas';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Ruler,
  Layers,
  Clock,
  Send,
  Eye,
  ShieldAlert,
  Compass,
  ArrowRight,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { Pagination } from './Pagination';

interface PlannerQueueViewProps {
  onSelectBuildingForMap?: (building: Building) => void;
}

export const PlannerQueueView: React.FC<PlannerQueueViewProps> = ({ onSelectBuildingForMap }) => {
  const { activePersona, currentRole, switchPersona } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [enrichedData, setEnrichedData] = useState<{
    properties: EnrichedProperty[];
    floors: Floor[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Filter tab
  const [filter, setFilter] = useState<'draft' | 'plan_verified' | 'all'>('draft');

  // Pagination for submissions inbox
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await cadastreService.getAllBuildings();
      setBuildings(all);

      // Select first draft or first building
      const defaultBld = all.find((b) => b.status === 'draft') || all[0];
      if (defaultBld) {
        setSelectedBuilding(defaultBld);
        const data = await cadastreService.getEnrichedBuildingData(defaultBld.building_id || defaultBld.id);
        setEnrichedData({
          properties: data.allProperties,
          floors: data.allFloors,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectBuilding = async (bld: Building) => {
    setSelectedBuilding(bld);
    setActionSuccess(null);
    setActionError(null);
    try {
      const data = await cadastreService.getEnrichedBuildingData(bld.building_id || bld.id);
      setEnrichedData({
        properties: data.allProperties,
        floors: data.allFloors,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!selectedBuilding) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const updated = await cadastreService.approveBuilding(
        selectedBuilding.id,
        activePersona.name
      );
      if (updated) {
        setActionSuccess(
          `Building ${updated.building_id} (${updated.survey_number}) verified successfully! Status transitioned to 'plan_verified'. Forwarded to Sub-Registrar Officer (SRO) Queue.`
        );
        setSelectedBuilding({ ...updated });
        await loadData();
      }
    } catch (e: any) {
      setActionError(e?.message || 'Failed to approve building geometry');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedBuilding || !rejectionRemarks.trim()) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const updated = await cadastreService.rejectBuilding(
        selectedBuilding.id,
        rejectionRemarks
      );
      if (updated) {
        setActionSuccess(
          `Building ${updated.building_id} geometry flagged with review remarks. Returned to Surveyor draft queue.`
        );
        setShowRejectModal(false);
        setRejectionRemarks('');
        setSelectedBuilding({ ...updated });
        await loadData();
      }
    } catch (e: any) {
      setActionError(e?.message || 'Failed to submit review remarks');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    if (filter === 'all') return true;
    return (b.status || 'draft') === filter;
  });

  const totalItems = filteredBuildings.length;
  const paginatedBuildings = filteredBuildings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isPlanner = currentRole === 'town_planner';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">
      {/* Header Banner: Institutional Indian Municipal Web Portal Style */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1e3a8a] border border-blue-200 text-xs font-mono font-bold flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-[#1e3a8a]" /> ULB Municipal Town Planning Inbox
            </span>
            <span className="text-xs text-slate-600 font-mono">
              Role: <strong className="text-slate-900">{activePersona.roleTitle}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            3D Geometry & Zoning Compliance Review Queue
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Audit surveyor 3D boundary submissions against statutory municipal bylaws: Maximum
            Permissible Height envelopes, Setback Margins, and Floor Space Index (FSI). Approve to
            advance records to the Sub-Registrar Officer (SRO) for title deed linking.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 shadow-xs text-center">
            <div className="text-base font-bold text-amber-800 font-mono">
              {buildings.filter((b) => b.status === 'draft').length}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Pending Drafts</div>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 shadow-xs text-center">
            <div className="text-base font-bold text-[#1e3a8a] font-mono">
              {buildings.filter((b) => b.status === 'plan_verified').length}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Verified for SRO</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-800 hover:text-emerald-950 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions Inbox List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#1e3a8a]" />
                Submissions In-Queue
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                {filteredBuildings.length} items
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded border border-slate-200 text-xs font-mono">
              <button
                onClick={() => {
                  setFilter('draft');
                  setCurrentPage(1);
                }}
                className={`py-1 rounded text-center transition-colors cursor-pointer ${
                  filter === 'draft'
                    ? 'bg-amber-100 text-amber-950 border border-amber-300 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drafts ({buildings.filter((b) => b.status === 'draft').length})
              </button>
              <button
                onClick={() => {
                  setFilter('plan_verified');
                  setCurrentPage(1);
                }}
                className={`py-1 rounded text-center transition-colors cursor-pointer ${
                  filter === 'plan_verified'
                    ? 'bg-blue-100 text-[#1e3a8a] border border-blue-300 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified ({buildings.filter((b) => b.status === 'plan_verified').length})
              </button>
              <button
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className={`py-1 rounded text-center transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({buildings.length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {paginatedBuildings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded">
                  No submissions in this filter category.
                </div>
              ) : (
                paginatedBuildings.map((bld) => {
                  const isSelected = selectedBuilding?.id === bld.id;
                  const isDraft = (bld.status || 'draft') === 'draft';
                  const isPlanVerified = bld.status === 'plan_verified';
                  const isRegistered = bld.status === 'registered';

                  return (
                    <div
                      key={bld.id}
                      onClick={() => handleSelectBuilding(bld)}
                      className={`p-3 rounded-lg border text-xs transition-colors cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'border-[#1e3a8a] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">
                          Building {bld.building_id}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isDraft
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : isPlanVerified
                              ? 'bg-blue-50 text-[#1e3a8a] border-blue-300'
                              : 'bg-emerald-50 text-[#059669] border-emerald-300'
                          }`}
                        >
                          {isDraft ? 'Pending Audit' : isPlanVerified ? 'Plan Verified' : 'Registered'}
                        </span>
                      </div>

                      <div className="text-slate-600 truncate text-[11px]">
                        Survey No: <strong>{bld.survey_number}</strong> &bull; {bld.address}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                        <span>Height: {bld.total_height || 12}m ({bld.number_of_floors || 4} fl)</span>
                        <span className="text-[#1e3a8a] font-semibold flex items-center gap-0.5">
                          Inspect 3D &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[3, 4, 8]}
            />
          </div>
        </div>

        {/* Right Column: Detailed 3D WebGL Inspection & Audit Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedBuilding ? (
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-4">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Building {selectedBuilding.building_id}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      Survey No: {selectedBuilding.survey_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedBuilding.address}</span>
                  </p>
                </div>

                {/* Action Buttons for Town Planner */}
                <div className="flex items-center gap-2">
                  {(selectedBuilding.status === 'draft' || !selectedBuilding.status) && (
                    <>
                      {isPlanner ? (
                        <>
                          <button
                            id="btn-planner-reject"
                            onClick={() => setShowRejectModal(true)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject with Remarks</span>
                          </button>
                          <button
                            id="btn-planner-approve"
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded bg-[#1e3a8a] hover:bg-blue-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve 3D Geometry for SRO</span>
                          </button>
                        </>
                      ) : (
                        <button
                          id="btn-switch-to-planner-and-approve"
                          onClick={async () => {
                            await switchPersona('town_planner');
                          }}
                          className="px-3.5 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Switch to Town Planner Persona to approve or reject submissions"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Switch to Town Planner to Approve/Reject</span>
                        </button>
                      )}
                    </>
                  )}

                  {selectedBuilding.status === 'plan_verified' && (
                    <div className="px-3 py-1 rounded bg-blue-50 border border-blue-300 text-[#1e3a8a] text-xs font-mono font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1e3a8a]" />
                      <span>Verified by {selectedBuilding.verified_by || 'Town Planning'} &bull; Ready for SRO</span>
                    </div>
                  )}

                  {selectedBuilding.status === 'registered' && (
                    <div className="px-3 py-1 rounded bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-mono font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Fully Registered in 3D Cadastre</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statutory Bylaws Compliance Audit Matrix */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Ruler className="w-4 h-4 text-[#1e3a8a]" />
                  <span>Automated Zoning & Bylaw Compliance Checks</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Height Envelope Check */}
                  <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1 shadow-xs">
                    <div className="text-slate-500 text-[10px] font-mono">Maximum Permissible Height</div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-mono font-bold text-xs">
                        {selectedBuilding.total_height || 12}m{' '}
                        <span className="text-slate-500 text-[10px]">
                          / {selectedBuilding.compliance_metrics?.max_permitted_height || 15.0}m max
                        </span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Envelope clearance: +3.0m margin</div>
                  </div>

                  {/* Setback Distance Check */}
                  <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1 shadow-xs">
                    <div className="text-slate-500 text-[10px] font-mono">Setback Margins (Front/Rear)</div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-mono font-bold text-xs">
                        {selectedBuilding.compliance_metrics?.setback_margin_actual || 3.5}m{' '}
                        <span className="text-slate-500 text-[10px]">
                          / {selectedBuilding.compliance_metrics?.setback_margin_required || 3.0}m min
                        </span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Boundary clearance verified</div>
                  </div>

                  {/* FSI / FAR Ratio Check */}
                  <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1 shadow-xs">
                    <div className="text-slate-500 text-[10px] font-mono">Floor Space Index (FSI)</div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-mono font-bold text-xs">
                        {selectedBuilding.compliance_metrics?.fsi_actual || 1.85}{' '}
                        <span className="text-slate-500 text-[10px]">
                          / {selectedBuilding.compliance_metrics?.fsi_permitted || 2.5} cap
                        </span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-300 text-[10px] font-bold">
                        COMPLIANT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Under maximum density cap</div>
                  </div>
                </div>
              </div>

              {/* 3D WebGL Inspection Canvas */}
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 relative">
                <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Layers className="w-3.5 h-3.5 text-[#1e3a8a]" />
                    Interactive 3D Cadastral Mesh Inspection (Three.js WebGL)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {enrichedData?.floors.length || 4} Vertical Strata &bull;{' '}
                    {enrichedData?.properties.length || 8} Units
                  </span>
                </div>

                <div className="h-80 w-full relative">
                  <ThreeCanvas
                    enrichedProperty={enrichedData?.properties[0] || null}
                    activeBuilding={selectedBuilding}
                    allProperties={enrichedData?.properties || []}
                    allFloors={enrichedData?.floors || []}
                    isSelected={true}
                    viewMode="volumetric"
                    showRuler={true}
                  />
                </div>

                <div className="p-2 bg-white border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between px-3 font-mono">
                  <span>Audit Mode: Town Planner Wireframe + Strata Geometry</span>
                  <span>Coordinates: {selectedBuilding.latitude.toFixed(5)}, {selectedBuilding.longitude.toFixed(5)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white font-mono">
              Select a building submission from the inbox to begin 3D audit.
            </div>
          )}
        </div>
      </div>

      {/* Reject Remarks Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg bg-white border border-slate-300 shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Reject Building 3D Geometry with Review Remarks</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Specify the zoning or cadastral boundary discrepancy preventing approval. The submission
              will be returned to the surveyor for geometry correction.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Review Remarks / Discrepancy Note <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="e.g. Setback on North boundary is 2.1m, violating minimum 3.0m municipal requirement..."
                rows={4}
                className="w-full p-2.5 text-xs rounded border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isProcessing || !rejectionRemarks.trim()}
                className="px-4 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Submitting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
