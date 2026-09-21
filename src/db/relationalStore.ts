/**
 * In-Memory Relational Database Engine with Foreign-Key Integrity,
 * Cadastral Validation Rules, and Prototype 3D Property ID Generator.
 */

import {
  Building,
  DatabaseState,
  EnrichedProperty,
  Floor,
  Location,
  Owner,
  Ownership,
  PropertyRecord,
  PropertyUnit,
  Prototype3DPropertyId,
  ValidationReport,
  VerticalGeometry,
} from '../types';

export const INITIAL_DEMO_DB: DatabaseState = {
  buildings: [
    {
      id: 'bld-001',
      building_id: 'B001',
      survey_number: '3127',
      address: 'Survey No. 3127, Malkajgiri Area, Medchal-Malkajgiri District, Hyderabad, Telangana 500047',
      latitude: 17.443372,
      longitude: 78.541003,
      plot_area: 1250.0,
      number_of_floors: 4,
      total_building_height: 12.0,
      state_code: 'TS',
      district: 'Medchal-Malkajgiri',
      mandal_or_taluk: 'Malkajgiri',
      village_or_locality: 'Malkajgiri Area',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    },
  ],
  floors: [
    {
      id: 'flr-000',
      floor_id: 'B001-F00',
      building_id: 'B001',
      floor_number: 0,
      bottom_height: 0.0,
      top_height: 3.0,
      floor_name: 'Ground Floor (Parking & Security)',
      created_at: new Date('2026-01-15T09:05:00Z').toISOString(),
    },
    {
      id: 'flr-001',
      floor_id: 'B001-F01',
      building_id: 'B001',
      floor_number: 1,
      bottom_height: 3.0,
      top_height: 6.0,
      floor_name: '1st Floor (Level 1)',
      created_at: new Date('2026-01-15T09:05:00Z').toISOString(),
    },
    {
      id: 'flr-002',
      floor_id: 'B001-F02',
      building_id: 'B001',
      floor_number: 2,
      bottom_height: 6.0,
      top_height: 9.0,
      floor_name: '2nd Floor (Level 2)',
      created_at: new Date('2026-01-15T09:05:00Z').toISOString(),
    },
    {
      id: 'flr-003',
      floor_id: 'B001-F03',
      building_id: 'B001',
      floor_number: 3,
      bottom_height: 9.0,
      top_height: 12.0,
      floor_name: '3rd Floor (Level 3)',
      created_at: new Date('2026-01-15T09:05:00Z').toISOString(),
    },
  ],
  owners: [
    {
      id: 'own-001',
      owner_id: 'OWN001',
      owner_name: 'Malkajgiri Residents Welfare Association (AWA)',
      contact_info: 'secretary@malkajgiri-3127.org',
      id_proof_type: 'Society Registration Certificate (Reg. No. TS/MED/2023/3127)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-101',
      owner_id: 'OWN101',
      owner_name: 'Bhuvana',
      contact_info: 'bhuvana@malkajgiri.in',
      id_proof_type: 'Aadhaar / Passport (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-102',
      owner_id: 'OWN102',
      owner_name: 'Sanjana',
      contact_info: 'sanjana@malkajgiri.in',
      id_proof_type: 'Aadhaar / PAN Card (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-201',
      owner_id: 'OWN201',
      owner_name: 'Bhuvi',
      contact_info: 'bhuvi@malkajgiri.in',
      id_proof_type: 'Aadhaar / Voter ID (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-202',
      owner_id: 'OWN202',
      owner_name: 'Sanju',
      contact_info: 'sanju@malkajgiri.in',
      id_proof_type: 'Aadhaar / Driving License (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-301',
      owner_id: 'OWN301',
      owner_name: 'Bhuvaneshwari',
      contact_info: 'bhuvaneshwari@malkajgiri.in',
      id_proof_type: 'Passport / Aadhaar (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
    {
      id: 'own-302',
      owner_id: 'OWN302',
      owner_name: 'Suresh Reddy',
      contact_info: 'suresh.reddy@malkajgiri.in',
      id_proof_type: 'Aadhaar / PAN Card (Verified)',
      created_at: new Date('2026-01-15T09:10:00Z').toISOString(),
    },
  ],
  propertyUnits: [
    // Ground Floor: Parking & Watchman
    {
      id: 'prop-g01',
      property_id: 'PROP-G01',
      building_id: 'B001',
      floor_id: 'B001-F00',
      flat_number: 'Stilt Parking (Slots P1-P8)',
      area: 85.0,
      property_type: 'Common Amenity / Covered Stilt Parking',
      property_record_ref: 'DOC-2024-TEL-3127-00',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    {
      id: 'prop-g02',
      property_id: 'PROP-G02',
      building_id: 'B001',
      floor_id: 'B001-F00',
      flat_number: 'Watchman Cabin & Security Room',
      area: 25.0,
      property_type: 'Utility / Watchman & Security Post',
      property_record_ref: 'DOC-2024-TEL-3127-01',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    // 1st Floor: Flat 101 & Flat 102
    {
      id: 'prop-101',
      property_id: 'PROP-101',
      building_id: 'B001',
      floor_id: 'B001-F01',
      flat_number: 'Flat 101',
      area: 110.0,
      property_type: 'Residential Apartment (2BHK)',
      property_record_ref: 'DOC-2024-TEL-3127-101',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    {
      id: 'prop-102',
      property_id: 'PROP-102',
      building_id: 'B001',
      floor_id: 'B001-F01',
      flat_number: 'Flat 102',
      area: 115.0,
      property_type: 'Residential Apartment (2BHK)',
      property_record_ref: 'DOC-2024-TEL-3127-102',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    // 2nd Floor: Flat 201 & Flat 202
    {
      id: 'prop-201',
      property_id: 'PROP-201',
      building_id: 'B001',
      floor_id: 'B001-F02',
      flat_number: 'Flat 201',
      area: 120.0,
      property_type: 'Residential Apartment (3BHK)',
      property_record_ref: 'DOC-2024-TEL-3127-201',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    {
      id: 'prop-202',
      property_id: 'PROP-202',
      building_id: 'B001',
      floor_id: 'B001-F02',
      flat_number: 'Flat 202',
      area: 120.0,
      property_type: 'Residential Apartment (3BHK)',
      property_record_ref: 'DOC-2024-TEL-3127-202',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    // 3rd Floor: Flat 301 & Flat 302
    {
      id: 'prop-301',
      property_id: 'PROP-301',
      building_id: 'B001',
      floor_id: 'B001-F03',
      flat_number: 'Flat 301',
      area: 125.0,
      property_type: 'Residential Apartment (3BHK Penthouse)',
      property_record_ref: 'DOC-2024-TEL-3127-301',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
    {
      id: 'prop-302',
      property_id: 'PROP-302',
      building_id: 'B001',
      floor_id: 'B001-F03',
      flat_number: 'Flat 302',
      area: 125.0,
      property_type: 'Residential Apartment (3BHK Penthouse)',
      property_record_ref: 'DOC-2024-TEL-3127-302',
      created_at: new Date('2026-01-15T09:15:00Z').toISOString(),
    },
  ],
  ownerships: [
    // Ground Floor
    {
      id: 'ownp-g01',
      ownership_id: 'OWNP-G01',
      property_id: 'PROP-G01',
      owner_id: 'OWN001',
      ownership_share: 100.0,
      ownership_type: 'Association Common Property',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    {
      id: 'ownp-g02',
      ownership_id: 'OWNP-G02',
      property_id: 'PROP-G02',
      owner_id: 'OWN001',
      ownership_share: 100.0,
      ownership_type: 'Association Common Property',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    // 1st Floor
    {
      id: 'ownp-101',
      ownership_id: 'OWNP-101',
      property_id: 'PROP-101',
      owner_id: 'OWN101',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    {
      id: 'ownp-102',
      ownership_id: 'OWNP-102',
      property_id: 'PROP-102',
      owner_id: 'OWN102',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    // 2nd Floor
    {
      id: 'ownp-201',
      ownership_id: 'OWNP-201',
      property_id: 'PROP-201',
      owner_id: 'OWN201',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    {
      id: 'ownp-202',
      ownership_id: 'OWNP-202',
      property_id: 'PROP-202',
      owner_id: 'OWN202',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    // 3rd Floor
    {
      id: 'ownp-301',
      ownership_id: 'OWNP-301',
      property_id: 'PROP-301',
      owner_id: 'OWN301',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
    {
      id: 'ownp-302',
      ownership_id: 'OWNP-302',
      property_id: 'PROP-302',
      owner_id: 'OWN302',
      ownership_share: 100.0,
      ownership_type: 'Sole Owner',
      created_at: new Date('2026-01-15T09:20:00Z').toISOString(),
    },
  ],
  propertyRecords: [
    // Ground Floor
    {
      id: 'rec-g01',
      record_id: 'REC-G01',
      property_id: 'PROP-G01',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-00',
      property_type: 'Common Amenity / Covered Stilt Parking',
      area: 85.0,
      address: 'Stilt Floor Parking P1-P8, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-01-10',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 3500000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    {
      id: 'rec-g02',
      record_id: 'REC-G02',
      property_id: 'PROP-G02',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-01',
      property_type: 'Utility / Watchman & Security Post',
      area: 25.0,
      address: 'Ground Floor Security Cabin, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-01-10',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 1200000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    // 1st Floor
    {
      id: 'rec-101',
      record_id: 'REC-101',
      property_id: 'PROP-101',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-101',
      property_type: 'Residential Apartment (2BHK)',
      area: 110.0,
      address: 'Flat 101, Floor 1, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-02-14',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 7800000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    {
      id: 'rec-102',
      record_id: 'REC-102',
      property_id: 'PROP-102',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-102',
      property_type: 'Residential Apartment (2BHK)',
      area: 115.0,
      address: 'Flat 102, Floor 1, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-02-18',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 8100000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    // 2nd Floor
    {
      id: 'rec-201',
      record_id: 'REC-201',
      property_id: 'PROP-201',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-201',
      property_type: 'Residential Apartment (3BHK)',
      area: 120.0,
      address: 'Flat 201, Floor 2, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-03-22',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 8600000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    {
      id: 'rec-202',
      record_id: 'REC-202',
      property_id: 'PROP-202',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-202',
      property_type: 'Residential Apartment (3BHK)',
      area: 120.0,
      address: 'Flat 202, Floor 2, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-03-25',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 8600000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    // 3rd Floor
    {
      id: 'rec-301',
      record_id: 'REC-301',
      property_id: 'PROP-301',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-301',
      property_type: 'Residential Apartment (3BHK Penthouse)',
      area: 125.0,
      address: 'Flat 301, Floor 3, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-04-10',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 9200000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
    {
      id: 'rec-302',
      record_id: 'REC-302',
      property_id: 'PROP-302',
      source_reference: 'IGRS / Authorized Property Record',
      survey_number: '3127',
      document_reference: 'DOC-2024-TEL-3127-302',
      property_type: 'Residential Apartment (3BHK Penthouse)',
      area: 125.0,
      address: 'Flat 302, Floor 3, Building B001, Survey No. 3127, Malkajgiri Area, Hyderabad',
      registration_date: '2024-04-15',
      sub_registrar_office: 'SRO Malkajgiri, Medchal-Malkajgiri District',
      market_value: 9300000,
      created_at: new Date('2026-01-15T09:25:00Z').toISOString(),
    },
  ],
  locations: [
    {
      id: 'loc-001',
      location_id: 'LOC001',
      building_id: 'B001',
      latitude: 17.443372,
      longitude: 78.541003,
      address: 'Survey No. 3127, Malkajgiri Area, Medchal-Malkajgiri District, Hyderabad, Telangana 500047',
      city: 'Malkajgiri / Hyderabad',
      state: 'Telangana',
      pincode: '500047',
      geocoding_source: 'Survey of India / Cadastral Geo-Reference',
      created_at: new Date('2026-01-15T09:30:00Z').toISOString(),
    },
  ],
  verticalGeometries: [
    // Ground Floor
    {
      id: 'geom-g01',
      geometry_id: 'GEOM-G01',
      property_id: 'PROP-G01',
      bottom_height: 0.0,
      top_height: 3.0,
      width: 7.2,
      length: 12.0,
      height: 3.0,
      x_offset: -3.5,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    {
      id: 'geom-g02',
      geometry_id: 'GEOM-G02',
      property_id: 'PROP-G02',
      bottom_height: 0.0,
      top_height: 3.0,
      width: 4.8,
      length: 5.5,
      height: 3.0,
      x_offset: 4.0,
      y_offset: -3.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    // 1st Floor
    {
      id: 'geom-101',
      geometry_id: 'GEOM-101',
      property_id: 'PROP-101',
      bottom_height: 3.0,
      top_height: 6.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: -3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    {
      id: 'geom-102',
      geometry_id: 'GEOM-102',
      property_id: 'PROP-102',
      bottom_height: 3.0,
      top_height: 6.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: 3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    // 2nd Floor
    {
      id: 'geom-201',
      geometry_id: 'GEOM-201',
      property_id: 'PROP-201',
      bottom_height: 6.0,
      top_height: 9.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: -3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    {
      id: 'geom-202',
      geometry_id: 'GEOM-202',
      property_id: 'PROP-202',
      bottom_height: 6.0,
      top_height: 9.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: 3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    // 3rd Floor
    {
      id: 'geom-301',
      geometry_id: 'GEOM-301',
      property_id: 'PROP-301',
      bottom_height: 9.0,
      top_height: 12.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: -3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
    {
      id: 'geom-302',
      geometry_id: 'GEOM-302',
      property_id: 'PROP-302',
      bottom_height: 9.0,
      top_height: 12.0,
      width: 6.8,
      length: 12.0,
      height: 3.0,
      x_offset: 3.6,
      y_offset: 0.0,
      created_at: new Date('2026-01-15T09:35:00Z').toISOString(),
    },
  ],
  prototype3DPropertyIds: [
    // Ground Floor
    {
      id: 'pid-g01',
      internal_id: 'INT-3D-PROP-G01',
      property_id: 'PROP-G01',
      generated_identifier: 'TS-B001-F00-UPARK',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    {
      id: 'pid-g02',
      internal_id: 'INT-3D-PROP-G02',
      property_id: 'PROP-G02',
      generated_identifier: 'TS-B001-F00-UWATCH',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    // 1st Floor
    {
      id: 'pid-101',
      internal_id: 'INT-3D-PROP-101',
      property_id: 'PROP-101',
      generated_identifier: 'TS-B001-F01-U101',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    {
      id: 'pid-102',
      internal_id: 'INT-3D-PROP-102',
      property_id: 'PROP-102',
      generated_identifier: 'TS-B001-F01-U102',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    // 2nd Floor
    {
      id: 'pid-201',
      internal_id: 'INT-3D-PROP-201',
      property_id: 'PROP-201',
      generated_identifier: 'TS-B001-F02-U201',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    {
      id: 'pid-202',
      internal_id: 'INT-3D-PROP-202',
      property_id: 'PROP-202',
      generated_identifier: 'TS-B001-F02-U202',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    // 3rd Floor
    {
      id: 'pid-301',
      internal_id: 'INT-3D-PROP-301',
      property_id: 'PROP-301',
      generated_identifier: 'TS-B001-F03-U301',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
    {
      id: 'pid-302',
      internal_id: 'INT-3D-PROP-302',
      property_id: 'PROP-302',
      generated_identifier: 'TS-B001-F03-U302',
      format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
      generated_at: new Date('2026-01-15T09:40:00Z').toISOString(),
      status: 'PROTOTYPE_ACTIVE',
    },
  ],
};

/**
 * Helper to compute standard Prototype 3D Property ID from parts
 * Example: TS-B001-F02-U203
 */
export function generatePrototype3DPropertyId(
  stateCode: string = 'TS',
  buildingId: string,
  floorNumber: number,
  flatNumber: string
): string {
  const cleanState = (stateCode || 'TS').trim().toUpperCase();
  const cleanBuilding = (buildingId || 'B001').trim().toUpperCase();
  const cleanFloor = `F${String(Math.max(0, floorNumber)).padStart(2, '0')}`;
  
  const lower = flatNumber.toLowerCase();
  let cleanUnit = '';
  if (lower.includes('parking') || lower.includes('stilt')) {
    cleanUnit = 'UPARK';
  } else if (lower.includes('watchman') || lower.includes('security')) {
    cleanUnit = 'UWATCH';
  } else {
    // Extract number from "Flat 201" or "102"
    const unitMatch = flatNumber.match(/\d+/);
    const unitCode = unitMatch ? unitMatch[0] : flatNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    cleanUnit = `U${unitCode}`;
  }

  return `${cleanState}-${cleanBuilding}-${cleanFloor}-${cleanUnit}`;
}

/**
 * Validates the database state according to Cadastral and Geometrical rules
 */
export function validateDatabaseState(db: DatabaseState): ValidationReport {
  const details: ValidationReport['details'] = [];
  let passed = 0;
  let failed = 0;

  // 1. Validate Buildings
  for (const bld of db.buildings) {
    if (!bld.building_id) {
      details.push({
        category: 'Relational Foreign Keys',
        entityId: bld.id,
        status: 'FAIL',
        message: 'Building has missing Building ID.',
      });
      failed++;
    } else {
      passed++;
    }

    if (bld.latitude < -90 || bld.latitude > 90 || bld.longitude < -180 || bld.longitude > 180) {
      details.push({
        category: 'Geographic Location',
        entityId: bld.building_id,
        status: 'FAIL',
        message: `Building ${bld.building_id} has invalid geographic coordinates (${bld.latitude}, ${bld.longitude}).`,
      });
      failed++;
    } else {
      passed++;
      details.push({
        category: 'Geographic Location',
        entityId: bld.building_id,
        status: 'PASS',
        message: `Building ${bld.building_id} coordinates (${bld.latitude.toFixed(4)}, ${bld.longitude.toFixed(4)}) are geographically valid.`,
      });
    }

    // Check building floors
    const bldFloors = db.floors
      .filter((f) => f.building_id === bld.building_id)
      .sort((a, b) => a.floor_number - b.floor_number);

    if (bldFloors.length === 0) {
      details.push({
        category: 'Floor Consistency',
        entityId: bld.building_id,
        status: 'WARNING',
        message: `Building ${bld.building_id} currently has no registered floor records.`,
      });
    } else {
      let maxFloorTop = 0;
      for (let i = 0; i < bldFloors.length; i++) {
        const floor = bldFloors[i];
        if (floor.top_height <= floor.bottom_height) {
          details.push({
            category: 'Vertical Extent',
            entityId: floor.floor_id,
            status: 'FAIL',
            message: `Floor ${floor.floor_id} has invalid range: top height (${floor.top_height}m) must be strictly greater than bottom height (${floor.bottom_height}m).`,
          });
          failed++;
        } else {
          passed++;
        }

        if (floor.bottom_height < 0 || floor.top_height < 0) {
          details.push({
            category: 'Vertical Extent',
            entityId: floor.floor_id,
            status: 'FAIL',
            message: `Floor ${floor.floor_id} has negative height values. Vertical elevation must be non-negative.`,
          });
          failed++;
        } else {
          passed++;
        }

        // Check overlap with next floor
        if (i < bldFloors.length - 1) {
          const nextFloor = bldFloors[i + 1];
          if (floor.top_height > nextFloor.bottom_height + 0.001) {
            details.push({
              category: 'Floor Consistency',
              entityId: `${floor.floor_id} / ${nextFloor.floor_id}`,
              status: 'FAIL',
              message: `Vertical overlap detected between Floor ${floor.floor_number} (top: ${floor.top_height}m) and Floor ${nextFloor.floor_number} (bottom: ${nextFloor.bottom_height}m).`,
            });
            failed++;
          } else {
            passed++;
          }
        }

        if (floor.top_height > maxFloorTop) {
          maxFloorTop = floor.top_height;
        }
      }

      if (bld.total_building_height < maxFloorTop) {
        details.push({
          category: 'Floor Consistency',
          entityId: bld.building_id,
          status: 'WARNING',
          message: `Building total height (${bld.total_building_height}m) is less than registered floor ceiling (${maxFloorTop}m).`,
        });
      } else {
        passed++;
        details.push({
          category: 'Floor Consistency',
          entityId: bld.building_id,
          status: 'PASS',
          message: `Building ${bld.building_id} total height (${bld.total_building_height}m) covers all floor extents (${maxFloorTop}m).`,
        });
      }
    }
  }

  // 2. Validate Properties & Vertical Geometry
  for (const prop of db.propertyUnits) {
    const bld = db.buildings.find((b) => b.building_id === prop.building_id);
    const floor = db.floors.find((f) => f.floor_id === prop.floor_id);
    const geom = db.verticalGeometries.find((g) => g.property_id === prop.property_id);
    const p3d = db.prototype3DPropertyIds.find((p) => p.property_id === prop.property_id);
    const ownerships = db.ownerships.filter((o) => o.property_id === prop.property_id);

    if (!bld) {
      details.push({
        category: 'Relational Foreign Keys',
        entityId: prop.property_id,
        status: 'FAIL',
        message: `Property ${prop.property_id} references non-existent building ID "${prop.building_id}".`,
      });
      failed++;
    } else {
      passed++;
    }

    if (!floor) {
      details.push({
        category: 'Relational Foreign Keys',
        entityId: prop.property_id,
        status: 'FAIL',
        message: `Property ${prop.property_id} references non-existent floor ID "${prop.floor_id}".`,
      });
      failed++;
    } else {
      passed++;
    }

    if (ownerships.length === 0) {
      details.push({
        category: 'Relational Foreign Keys',
        entityId: prop.property_id,
        status: 'WARNING',
        message: `Property ${prop.property_id} has no registered owner linked in the Ownership table.`,
      });
    } else {
      passed++;
      const totalShare = ownerships.reduce((acc, curr) => acc + (curr.ownership_share || 0), 0);
      if (Math.abs(totalShare - 100) > 0.1) {
        details.push({
          category: 'Relational Foreign Keys',
          entityId: prop.property_id,
          status: 'WARNING',
          message: `Total ownership shares for Property ${prop.property_id} sum to ${totalShare}% (expected 100%).`,
        });
      }
    }

    if (!geom) {
      details.push({
        category: 'Vertical Extent',
        entityId: prop.property_id,
        status: 'FAIL',
        message: `Property ${prop.property_id} is missing vertical geometry record. 3D representation cannot be generated.`,
      });
      failed++;
    } else {
      if (geom.top_height <= geom.bottom_height) {
        details.push({
          category: 'Vertical Extent',
          entityId: prop.property_id,
          status: 'FAIL',
          message: `Property ${prop.property_id} vertical geometry top height (${geom.top_height}m) <= bottom height (${geom.bottom_height}m).`,
        });
        failed++;
      } else {
        passed++;
      }

      if (geom.width <= 0 || geom.length <= 0) {
        details.push({
          category: 'Vertical Extent',
          entityId: prop.property_id,
          status: 'FAIL',
          message: `Property ${prop.property_id} horizontal dimensions (width: ${geom.width}m, length: ${geom.length}m) must be strictly positive.`,
        });
        failed++;
      } else {
        passed++;
      }

      if (floor) {
        if (geom.bottom_height < floor.bottom_height || geom.top_height > floor.top_height) {
          details.push({
            category: 'Vertical Extent',
            entityId: prop.property_id,
            status: 'WARNING',
            message: `Property ${prop.property_id} vertical extent [${geom.bottom_height}m, ${geom.top_height}m] exceeds assigned floor [${floor.bottom_height}m, ${floor.top_height}m].`,
          });
        } else {
          passed++;
          details.push({
            category: 'Vertical Extent',
            entityId: prop.property_id,
            status: 'PASS',
            message: `Property ${prop.property_id} vertical extent [${geom.bottom_height}m - ${geom.top_height}m, Δh=${(geom.top_height - geom.bottom_height).toFixed(1)}m] is fully bounded within Floor ${floor.floor_number}.`,
          });
        }
      }
    }

    if (!p3d) {
      details.push({
        category: 'Identifier Format',
        entityId: prop.property_id,
        status: 'FAIL',
        message: `Property ${prop.property_id} has no generated Prototype 3D Property ID in the database.`,
      });
      failed++;
    } else {
      passed++;
      details.push({
        category: 'Identifier Format',
        entityId: prop.property_id,
        status: 'PASS',
        message: `Prototype 3D Property ID "${p3d.generated_identifier}" is stored and associated with Unit ${prop.flat_number}.`,
      });
    }
  }

  return {
    isValid: failed === 0,
    timestamp: new Date().toISOString(),
    totalChecks: passed + failed,
    passedChecks: passed,
    failedChecks: failed,
    details,
  };
}

/**
 * Join all relational tables into unified EnrichedProperty objects
 */
export function getEnrichedProperties(db: DatabaseState): EnrichedProperty[] {
  const result: EnrichedProperty[] = [];

  for (const prop of db.propertyUnits) {
    const building = db.buildings.find((b) => b.building_id === prop.building_id) || {
      id: 'unknown-bld',
      building_id: prop.building_id || 'UNKNOWN',
      survey_number: 'N/A',
      address: 'Address not registered in location module',
      latitude: 17.4485,
      longitude: 78.3748,
      plot_area: 0,
      number_of_floors: 1,
      total_building_height: 3.0,
      state_code: 'TS',
      created_at: new Date().toISOString(),
    };

    const floor = db.floors.find((f) => f.floor_id === prop.floor_id) || {
      id: 'unknown-flr',
      floor_id: prop.floor_id || 'UNKNOWN-FLR',
      building_id: prop.building_id,
      floor_number: 1,
      bottom_height: 0.0,
      top_height: 3.0,
      floor_name: 'Level 1',
      created_at: new Date().toISOString(),
    };

    const verticalGeometry = db.verticalGeometries.find((g) => g.property_id === prop.property_id) || {
      id: 'unknown-geom',
      geometry_id: `GEOM-${prop.property_id}`,
      property_id: prop.property_id,
      bottom_height: floor.bottom_height,
      top_height: floor.top_height,
      width: 10.0,
      length: 12.0,
      height: Math.max(1, floor.top_height - floor.bottom_height),
      created_at: new Date().toISOString(),
    };

    // Calculate height properly if missing
    verticalGeometry.height = Math.max(0, verticalGeometry.top_height - verticalGeometry.bottom_height);

    let prototype3DId = db.prototype3DPropertyIds.find((p) => p.property_id === prop.property_id);
    if (!prototype3DId) {
      prototype3DId = {
        id: `pid-${prop.property_id.toLowerCase()}`,
        internal_id: `INT-${prop.property_id}`,
        property_id: prop.property_id,
        generated_identifier: generatePrototype3DPropertyId(
          building.state_code,
          building.building_id,
          floor.floor_number,
          prop.flat_number
        ),
        format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
        generated_at: new Date().toISOString(),
        status: 'PROTOTYPE_ACTIVE',
      };
    }

    const ownershipRows = db.ownerships.filter((o) => o.property_id === prop.property_id);
    const owners = ownershipRows.map((ownership) => {
      const owner = db.owners.find((o) => o.owner_id === ownership.owner_id) || {
        id: 'unknown-owner',
        owner_id: ownership.owner_id,
        owner_name: 'Unassigned Owner',
        created_at: new Date().toISOString(),
      };
      return { ownership, owner };
    });

    const propertyRecord = db.propertyRecords.find((r) => r.property_id === prop.property_id);

    const location = db.locations.find((l) => l.building_id === building.building_id) || {
      id: 'loc-default',
      location_id: `LOC-${building.building_id}`,
      building_id: building.building_id,
      latitude: building.latitude,
      longitude: building.longitude,
      address: building.address,
      created_at: new Date().toISOString(),
    };

    // Validation checks for this single property
    const errors: string[] = [];
    const warnings: string[] = [];

    if (verticalGeometry.top_height <= verticalGeometry.bottom_height) {
      errors.push(`Top height (${verticalGeometry.top_height}m) must be > bottom height (${verticalGeometry.bottom_height}m)`);
    }
    if (verticalGeometry.width <= 0 || verticalGeometry.length <= 0) {
      errors.push('Width and length must be greater than zero');
    }
    if (owners.length === 0) {
      warnings.push('No owner attached in ownership table');
    }

    result.push({
      property: prop,
      building,
      floor,
      verticalGeometry,
      prototype3DId,
      owners,
      propertyRecord,
      location,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
      },
    });
  }

  return result;
}
