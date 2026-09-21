/**
 * Data Model and Schema Definitions for SIH26011
 * 3D ULPIN Generation & Vertical Property Mapping Prototype
 */

export type DataSourceType = 'Demo Data' | 'IGRS / Authorized Property Record';

export type BuildingLifecycleStatus = 'draft' | 'plan_verified' | 'registered';

export type UserRole =
  | 'surveyor'
  | 'town_planner'
  | 'sro_officer'
  | 'citizen'
  | 'emergency_responder';

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  organization: string;
  badgeColor: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  organization?: string;
  created_at?: string;
}

export interface BuildingComplianceMetrics {
  max_permitted_height: number; // e.g. 15.0m
  actual_height: number; // e.g. 12.0m
  setback_margin_required: number; // e.g. 3.0m
  setback_margin_actual: number; // e.g. 3.5m
  fsi_permitted: number; // e.g. 2.5
  fsi_actual: number; // e.g. 1.85
  passed: boolean;
}

export interface Owner {
  id: string; // Internal UUID / PK
  owner_id: string; // e.g. "OWN001"
  owner_name: string; // e.g. "Demo Owner"
  contact_info?: string;
  id_proof_type?: string;
  created_at: string;
}

export interface Building {
  id: string; // Internal UUID / PK
  building_id?: string; // e.g. "B001"
  survey_number: string; // e.g. "SY-402/1A"
  address: string;
  latitude: number; // e.g. 17.4485
  longitude: number; // e.g. 78.3748
  geom?: string | any; // PostGIS geography(Point, 4326)
  plot_area: number; // in sq. metres
  total_floors?: number; // e.g. 4
  number_of_floors?: number; // legacy alias
  total_height?: number; // in metres (e.g. 12.0)
  total_building_height?: number; // legacy alias
  model_url?: string | null; // Supabase storage URL: buildings/{building_id}/{timestamp}.glb
  model_type?: 'parametric_extruded' | 'uploaded_glb' | 'hybrid';
  sub_mesh_strategy?: 'named_sub_meshes' | 'envelope_sliced' | 'none';
  state_code?: string; // e.g. "TS" (Telangana)
  district?: string;
  mandal_or_taluk?: string;
  village_or_locality?: string;
  status?: BuildingLifecycleStatus; // 'draft' | 'plan_verified' | 'registered'
  rejection_remarks?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  submitted_by?: string | null;
  submitted_by_name?: string | null;
  deed_reference?: string | null;
  compliance_metrics?: BuildingComplianceMetrics;
  created_at?: string;
  updated_at?: string;
}

export interface Floor {
  id: string; // Internal UUID / PK
  floor_id: string; // e.g. "FLR002" or "B001-F02"
  building_id: string; // FK -> Building.building_id
  floor_number: number; // e.g. 2
  bottom_height: number; // in metres (e.g. 3.0)
  top_height: number; // in metres (e.g. 6.0)
  floor_name?: string; // e.g. "Second Floor"
  created_at: string;
}

export interface PropertyUnit {
  id: string; // Internal UUID / PK
  property_id: string; // e.g. "PROP001"
  building_id: string; // FK -> Building.building_id
  floor_id: string; // FK -> Floor.floor_id
  flat_number: string; // e.g. "Flat 203" or "203"
  area: number; // in sq. metres (e.g. 120.0)
  property_type: string; // e.g. "Residential Apartment (3BHK)"
  property_record_ref: string; // e.g. "DOC-2024-TEL-08912"
  created_at: string;
}

export interface Ownership {
  id: string; // Internal UUID / PK
  ownership_id: string; // e.g. "OWNP001"
  property_id: string; // FK -> PropertyUnit.property_id
  owner_id: string; // FK -> Owner.owner_id
  ownership_share: number; // in percentage (e.g. 100)
  ownership_type?: string; // e.g. "Sole Owner" | "Joint Owner"
  created_at: string;
}

export interface PropertyRecord {
  id: string; // Internal UUID / PK
  record_id: string; // e.g. "REC001"
  property_id: string; // FK -> PropertyUnit.property_id
  source_reference: DataSourceType; // "Demo Data" or "IGRS / Authorized Property Record"
  survey_number: string; // e.g. "SY-402/1A"
  document_reference: string; // e.g. "DOC-2024-TEL-08912"
  property_type: string; // e.g. "Residential Apartment"
  area: number; // in sq. metres
  address: string;
  registration_date?: string;
  sub_registrar_office?: string;
  market_value?: number;
  created_at: string;
}

export interface Location {
  id: string; // Internal UUID / PK
  location_id: string; // e.g. "LOC001"
  building_id: string; // FK -> Building.building_id
  latitude: number; // e.g. 17.4485
  longitude: number; // e.g. 78.3748
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  geocoding_source?: string;
  created_at: string;
}

export interface VerticalGeometry {
  id: string; // Internal UUID / PK
  geometry_id: string; // e.g. "GEOM001"
  property_id: string; // FK -> PropertyUnit.property_id
  bottom_height: number; // in metres (e.g. 3.0)
  top_height: number; // in metres (e.g. 6.0)
  width: number; // in metres (e.g. 10.0)
  length: number; // in metres (e.g. 12.0)
  height: number; // in metres (e.g. 3.0 = top_height - bottom_height)
  x_offset?: number; // relative placement in parcel
  y_offset?: number;
  created_at: string;
}

export interface Prototype3DPropertyId {
  id: string; // Internal UUID / PK
  internal_id?: string;
  property_id: string; // FK -> PropertyUnit.property_id
  generated_identifier: string; // e.g. "TS-B001-F02-U203"
  format_pattern: string; // e.g. "{STATE}-{BUILDING}-{FLOOR}-{UNIT}"
  generated_at: string;
  status: 'PROTOTYPE_ACTIVE' | 'ARCHIVED';
}

/**
 * Joined / Enriched view of a Property with all relational entities attached
 */
export interface EnrichedProperty {
  property: PropertyUnit;
  building: Building;
  floor: Floor;
  verticalGeometry: VerticalGeometry;
  prototype3DId: Prototype3DPropertyId;
  owners: Array<{
    ownership: Ownership;
    owner: Owner;
  }>;
  propertyRecord?: PropertyRecord;
  location: Location;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface DatabaseState {
  owners: Owner[];
  buildings: Building[];
  floors: Floor[];
  propertyUnits: PropertyUnit[];
  ownerships: Ownership[];
  propertyRecords: PropertyRecord[];
  locations: Location[];
  verticalGeometries: VerticalGeometry[];
  prototype3DPropertyIds: Prototype3DPropertyId[];
}

export interface ValidationReport {
  isValid: boolean;
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  details: Array<{
    category: 'Vertical Extent' | 'Floor Consistency' | 'Geographic Location' | 'Relational Foreign Keys' | 'Identifier Format';
    entityId: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
  }>;
}

export interface SpatialLookupResult {
  found: boolean;
  searchCoordinates: { lat: number; lng: number };
  searchRadiusMeters: number;
  building?: Building | null;
  distanceMeters?: number;
  enrichedProperty?: EnrichedProperty | null;
  allProperties?: EnrichedProperty[];
  properties?: EnrichedProperty[];
  allFloors?: Floor[];
  floors?: Floor[];
}

export type IngestionMethod = 'blueprint_2d' | 'direct_3d_glb' | 'parametric_builder';

export interface IngestionPayload {
  method: IngestionMethod;
  coordinates: { lat: number; lng: number };
  surveyNumber: string;
  address: string;
  plotArea: number;
  // Common geometry options
  totalFloors: number;
  floorHeight: number; // e.g. 3.0 m
  buildingWidth: number; // e.g. 16.0 m
  buildingLength: number; // e.g. 14.0 m
  unitsPerFloor?: number; // e.g. 2
  // Method 1: 2D Blueprint specific
  blueprintImageFile?: File | null;
  blueprintImageUrl?: string;
  // Method 2: Direct 3D Asset specific
  modelFile?: File | null;
  modelFileName?: string;
  subMeshStrategy?: 'named_sub_meshes' | 'envelope_sliced';
  apartmentNumberingPrefix?: string; // e.g. "Flat"
  // Generated or uploaded GLB blob / URL
  generatedGlbBlob?: Blob | null;
  uploadedModelUrl?: string | null;
}

export interface UpdateFlatDetailsPayload {
  propertyId: string;
  buildingId?: string;
  flatNumber: string;
  propertyType: string;
  area: number;
  ownerName?: string;
  ownershipShare?: number;
  ownershipType?: string;
  ulpin?: string;
  bottomHeight?: number;
  topHeight?: number;
  propertyRecordRef?: string;
}
