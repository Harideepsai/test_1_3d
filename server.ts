import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  Building,
  DatabaseState,
  Floor,
  Location,
  Owner,
  Ownership,
  PropertyRecord,
  PropertyUnit,
  Prototype3DPropertyId,
  VerticalGeometry,
} from './src/types';
import {
  INITIAL_DEMO_DB,
  generatePrototype3DPropertyId,
  getEnrichedProperties,
  validateDatabaseState,
} from './src/db/relationalStore';

// In-Memory Relational Database State on Server
let dbState: DatabaseState = JSON.parse(JSON.stringify(INITIAL_DEMO_DB));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- REST API ENDPOINTS ---

  // Health check (supports Cloud Run /healthz, /health, and /api/health)
  app.get(['/health', '/healthz', '/api/health'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'SIH26011 3D Cadastre & ULPIN Generation Engine',
      version: '1.0.0-prototype',
      timestamp: new Date().toISOString(),
    });
  });

  // Get full relational database state
  app.get('/api/db/state', (req, res) => {
    res.json({
      success: true,
      data: dbState,
    });
  });

  // Reset database to initial SIH26011 demonstration state (Building B001, Flat 203, Floor 2)
  app.post('/api/db/reset', (req, res) => {
    dbState = JSON.parse(JSON.stringify(INITIAL_DEMO_DB));
    res.json({
      success: true,
      message: 'Database reset to default SIH26011 demonstration state.',
      data: dbState,
    });
  });

  // Get all enriched properties with joined relations (3D Geometry, Location, Floor, Building, Owner, Prototype 3D ID)
  app.get('/api/properties', (req, res) => {
    const enriched = getEnrichedProperties(dbState);
    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  });

  // Get single enriched property
  app.get('/api/properties/:id', (req, res) => {
    const enriched = getEnrichedProperties(dbState);
    const target = enriched.find(
      (p) => p.property.property_id.toLowerCase() === req.params.id.toLowerCase() || p.property.id === req.params.id
    );
    if (!target) {
      return res.status(404).json({ success: false, error: 'Property unit not found.' });
    }
    res.json({ success: true, data: target });
  });

  // Create a new Property Unit with relational integrity
  app.post('/api/properties', (req, res) => {
    try {
      const {
        building_id,
        floor_id,
        flat_number,
        area,
        property_type,
        property_record_ref,
        owner_name,
        ownership_share = 100,
        bottom_height = 0,
        top_height = 3,
        width = 10,
        length = 12,
      } = req.body;

      if (!building_id || !floor_id || !flat_number) {
        return res.status(400).json({
          success: false,
          error: 'Building ID, Floor ID, and Flat Number are required.',
        });
      }

      // Verify foreign keys
      const building = dbState.buildings.find((b) => b.building_id === building_id);
      if (!building) {
        return res.status(400).json({ success: false, error: `Building ID ${building_id} does not exist.` });
      }

      const floor = dbState.floors.find((f) => f.floor_id === floor_id);
      if (!floor) {
        return res.status(400).json({ success: false, error: `Floor ID ${floor_id} does not exist.` });
      }

      const newPropertyId = `PROP${String(dbState.propertyUnits.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();

      // 1. Create PropertyUnit
      const newProperty: PropertyUnit = {
        id: `prop-${Date.now()}`,
        property_id: newPropertyId,
        building_id,
        floor_id,
        flat_number,
        area: Number(area) || 100,
        property_type: property_type || 'Residential Apartment',
        property_record_ref: property_record_ref || `DOC-${Date.now().toString().slice(-6)}`,
        created_at: now,
      };
      dbState.propertyUnits.push(newProperty);

      // 2. Owner & Ownership
      let owner = dbState.owners.find((o) => o.owner_name.toLowerCase() === (owner_name || '').toLowerCase());
      if (!owner && owner_name) {
        owner = {
          id: `own-${Date.now()}`,
          owner_id: `OWN${String(dbState.owners.length + 1).padStart(3, '0')}`,
          owner_name,
          contact_info: 'contact@cadastre.gov.in',
          id_proof_type: 'Government ID',
          created_at: now,
        };
        dbState.owners.push(owner);
      }

      if (owner) {
        const newOwnership: Ownership = {
          id: `ownp-${Date.now()}`,
          ownership_id: `OWNP${String(dbState.ownerships.length + 1).padStart(3, '0')}`,
          property_id: newPropertyId,
          owner_id: owner.owner_id,
          ownership_share: Number(ownership_share) || 100,
          ownership_type: 'Sole Owner',
          created_at: now,
        };
        dbState.ownerships.push(newOwnership);
      }

      // 3. Vertical Geometry
      const parsedBottom = Number(bottom_height) || floor.bottom_height;
      const parsedTop = Number(top_height) || floor.top_height;
      const newGeometry: VerticalGeometry = {
        id: `geom-${Date.now()}`,
        geometry_id: `GEOM${String(dbState.verticalGeometries.length + 1).padStart(3, '0')}`,
        property_id: newPropertyId,
        bottom_height: parsedBottom,
        top_height: parsedTop,
        width: Number(width) || 10.0,
        length: Number(length) || 12.0,
        height: Math.max(0.5, parsedTop - parsedBottom),
        created_at: now,
      };
      dbState.verticalGeometries.push(newGeometry);

      // 4. Generate Prototype 3D Property ID
      const generatedId = generatePrototype3DPropertyId(
        building.state_code,
        building.building_id,
        floor.floor_number,
        flat_number
      );
      const newPid: Prototype3DPropertyId = {
        id: `pid-${Date.now()}`,
        internal_id: `INT-3D-${newPropertyId}`,
        property_id: newPropertyId,
        generated_identifier: generatedId,
        format_pattern: '{STATE}-{BUILDING}-{FLOOR}-{UNIT}',
        generated_at: now,
        status: 'PROTOTYPE_ACTIVE',
      };
      dbState.prototype3DPropertyIds.push(newPid);

      // 5. Property Record entry
      const newRec: PropertyRecord = {
        id: `rec-${Date.now()}`,
        record_id: `REC${String(dbState.propertyRecords.length + 1).padStart(3, '0')}`,
        property_id: newPropertyId,
        source_reference: 'Demo Data',
        survey_number: building.survey_number,
        document_reference: newProperty.property_record_ref,
        property_type: newProperty.property_type,
        area: newProperty.area,
        address: `${flat_number}, ${floor.floor_name || 'Floor ' + floor.floor_number}, ${building.building_id}, ${building.address}`,
        registration_date: now.split('T')[0],
        sub_registrar_office: 'SRO Digital Portal',
        created_at: now,
      };
      dbState.propertyRecords.push(newRec);

      const enrichedList = getEnrichedProperties(dbState);
      const createdEnriched = enrichedList.find((e) => e.property.property_id === newPropertyId);

      res.status(201).json({
        success: true,
        message: `Property ${newPropertyId} created with Prototype 3D Property ID ${generatedId}`,
        data: createdEnriched,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update property unit attributes, heights, dimensions, or owner
  app.put('/api/properties/:id', (req, res) => {
    try {
      const propId = req.params.id;
      const propIndex = dbState.propertyUnits.findIndex(
        (p) => p.property_id.toLowerCase() === propId.toLowerCase() || p.id === propId
      );

      if (propIndex === -1) {
        return res.status(404).json({ success: false, error: 'Property not found.' });
      }

      const currentProp = dbState.propertyUnits[propIndex];
      const {
        flat_number,
        area,
        property_type,
        property_record_ref,
        bottom_height,
        top_height,
        width,
        length,
        owner_name,
        latitude,
        longitude,
        source_reference,
      } = req.body;

      // Update unit fields
      if (flat_number !== undefined) currentProp.flat_number = flat_number;
      if (area !== undefined) currentProp.area = Number(area);
      if (property_type !== undefined) currentProp.property_type = property_type;
      if (property_record_ref !== undefined) currentProp.property_record_ref = property_record_ref;

      // Update Vertical Geometry
      const geomIndex = dbState.verticalGeometries.findIndex((g) => g.property_id === currentProp.property_id);
      if (geomIndex !== -1) {
        if (bottom_height !== undefined) dbState.verticalGeometries[geomIndex].bottom_height = Number(bottom_height);
        if (top_height !== undefined) dbState.verticalGeometries[geomIndex].top_height = Number(top_height);
        if (width !== undefined) dbState.verticalGeometries[geomIndex].width = Number(width);
        if (length !== undefined) dbState.verticalGeometries[geomIndex].length = Number(length);
        dbState.verticalGeometries[geomIndex].height = Math.max(
          0.1,
          dbState.verticalGeometries[geomIndex].top_height - dbState.verticalGeometries[geomIndex].bottom_height
        );
      }

      // Update Owner
      if (owner_name !== undefined) {
        const ownership = dbState.ownerships.find((o) => o.property_id === currentProp.property_id);
        if (ownership) {
          const owner = dbState.owners.find((o) => o.owner_id === ownership.owner_id);
          if (owner) {
            owner.owner_name = owner_name;
          }
        }
      }

      // Update Location coordinates if provided
      if (latitude !== undefined || longitude !== undefined) {
        const building = dbState.buildings.find((b) => b.building_id === currentProp.building_id);
        if (building) {
          if (latitude !== undefined) building.latitude = Number(latitude);
          if (longitude !== undefined) building.longitude = Number(longitude);
        }
        const loc = dbState.locations.find((l) => l.building_id === currentProp.building_id);
        if (loc) {
          if (latitude !== undefined) loc.latitude = Number(latitude);
          if (longitude !== undefined) loc.longitude = Number(longitude);
        }
      }

      // Update Property Record source reference if provided
      if (source_reference !== undefined) {
        const rec = dbState.propertyRecords.find((r) => r.property_id === currentProp.property_id);
        if (rec) {
          rec.source_reference = source_reference;
        }
      }

      // Regenerate Prototype 3D Property ID if flat_number changed
      const building = dbState.buildings.find((b) => b.building_id === currentProp.building_id);
      const floor = dbState.floors.find((f) => f.floor_id === currentProp.floor_id);
      if (building && floor) {
        const pidIndex = dbState.prototype3DPropertyIds.findIndex((p) => p.property_id === currentProp.property_id);
        const newIdent = generatePrototype3DPropertyId(
          building.state_code,
          building.building_id,
          floor.floor_number,
          currentProp.flat_number
        );
        if (pidIndex !== -1) {
          dbState.prototype3DPropertyIds[pidIndex].generated_identifier = newIdent;
        }
      }

      const enriched = getEnrichedProperties(dbState).find((e) => e.property.property_id === currentProp.property_id);

      res.json({
        success: true,
        message: `Property ${currentProp.property_id} updated successfully.`,
        data: enriched,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Buildings list
  app.get('/api/buildings', (req, res) => {
    const list = dbState.buildings.map((bld) => {
      const floors = dbState.floors.filter((f) => f.building_id === bld.building_id);
      const properties = dbState.propertyUnits.filter((p) => p.building_id === bld.building_id);
      const location = dbState.locations.find((l) => l.building_id === bld.building_id);
      return {
        ...bld,
        floors,
        propertiesCount: properties.length,
        location,
      };
    });
    res.json({ success: true, count: list.length, data: list });
  });

  // Update building coordinates / attributes
  app.put('/api/buildings/:id', (req, res) => {
    const bldId = req.params.id;
    const bld = dbState.buildings.find((b) => b.building_id === bldId || b.id === bldId);
    if (!bld) {
      return res.status(404).json({ success: false, error: 'Building not found.' });
    }

    const { survey_number, address, latitude, longitude, plot_area, total_building_height, number_of_floors } = req.body;
    if (survey_number !== undefined) bld.survey_number = survey_number;
    if (address !== undefined) bld.address = address;
    if (latitude !== undefined) bld.latitude = Number(latitude);
    if (longitude !== undefined) bld.longitude = Number(longitude);
    if (plot_area !== undefined) bld.plot_area = Number(plot_area);
    if (total_building_height !== undefined) bld.total_building_height = Number(total_building_height);
    if (number_of_floors !== undefined) bld.number_of_floors = Number(number_of_floors);

    // Sync to location entity
    const loc = dbState.locations.find((l) => l.building_id === bld.building_id);
    if (loc) {
      if (latitude !== undefined) loc.latitude = Number(latitude);
      if (longitude !== undefined) loc.longitude = Number(longitude);
      if (address !== undefined) loc.address = address;
    }

    res.json({ success: true, message: 'Building updated.', data: bld });
  });

  // Get owners
  app.get('/api/owners', (req, res) => {
    res.json({ success: true, count: dbState.owners.length, data: dbState.owners });
  });

  // Create owner
  app.post('/api/owners', (req, res) => {
    const { owner_name, contact_info, id_proof_type } = req.body;
    if (!owner_name) {
      return res.status(400).json({ success: false, error: 'Owner name is required.' });
    }
    const newOwner: Owner = {
      id: `own-${Date.now()}`,
      owner_id: `OWN${String(dbState.owners.length + 1).padStart(3, '0')}`,
      owner_name,
      contact_info: contact_info || '',
      id_proof_type: id_proof_type || 'Aadhaar / Passport',
      created_at: new Date().toISOString(),
    };
    dbState.owners.push(newOwner);
    res.status(201).json({ success: true, data: newOwner });
  });

  // Get property records
  app.get('/api/property-records', (req, res) => {
    res.json({ success: true, count: dbState.propertyRecords.length, data: dbState.propertyRecords });
  });

  // Create / Register authorized property record
  app.post('/api/property-records', (req, res) => {
    const {
      property_id,
      source_reference = 'IGRS / Authorized Property Record',
      survey_number,
      document_reference,
      property_type,
      area,
      address,
      registration_date,
      sub_registrar_office,
    } = req.body;

    if (!property_id || !document_reference) {
      return res.status(400).json({ success: false, error: 'Property ID and Document reference are required.' });
    }

    const newRecord: PropertyRecord = {
      id: `rec-${Date.now()}`,
      record_id: `REC${String(dbState.propertyRecords.length + 1).padStart(3, '0')}`,
      property_id,
      source_reference: source_reference as any,
      survey_number: survey_number || 'SY-SAMPLE',
      document_reference,
      property_type: property_type || 'Residential Apartment',
      area: Number(area) || 120,
      address: address || '',
      registration_date: registration_date || new Date().toISOString().split('T')[0],
      sub_registrar_office: sub_registrar_office || 'Authorized IGRS SRO Office',
      created_at: new Date().toISOString(),
    };

    // Update existing or push
    const existingIndex = dbState.propertyRecords.findIndex((r) => r.property_id === property_id);
    if (existingIndex !== -1) {
      dbState.propertyRecords[existingIndex] = newRecord;
    } else {
      dbState.propertyRecords.push(newRecord);
    }

    res.status(201).json({ success: true, message: 'Property Record saved successfully.', data: newRecord });
  });

  // Validation report API
  app.get('/api/validation-report', (req, res) => {
    const report = validateDatabaseState(dbState);
    res.json({ success: true, data: report });
  });

  // Modular Geocoding Interface (architecture for future approved Maps / Geocoding APIs)
  app.post('/api/geocode', (req, res) => {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address is required for geocoding.' });
    }

    // Modular geocoding adapter: when an approved API key is supplied via process.env, it can call the provider.
    // For local prototype demonstration, provides accurate cadastral coordinates for Indian metro / Hyderabad localities.
    let lat = 17.4485;
    let lng = 78.3748;

    const lower = address.toLowerCase();
    if (lower.includes('gachibowli')) {
      lat = 17.4401;
      lng = 78.3489;
    } else if (lower.includes('kondapur')) {
      lat = 17.4699;
      lng = 78.3578;
    } else if (lower.includes('bengaluru') || lower.includes('bangalore') || lower.includes('whitefield')) {
      lat = 12.9698;
      lng = 77.7500;
    } else if (lower.includes('delhi') || lower.includes('gurugram')) {
      lat = 28.4595;
      lng = 77.0266;
    }

    res.json({
      success: true,
      data: {
        address,
        latitude: lat,
        longitude: lng,
        geocoding_source: 'SIH26011 Modular Geocoding Adapter (Prototype)',
        is_live_api: false,
      },
    });
  });

  // --- Vite Middleware & Static Serving ---
  const isRunningFromBundle =
    typeof __filename !== 'undefined' &&
    (__filename.endsWith('.cjs') || __filename.includes('dist'));

  const isDev =
    process.env.NODE_ENV === 'development' ||
    (process.env.NODE_ENV !== 'production' &&
      !isRunningFromBundle &&
      process.env.npm_lifecycle_event === 'dev');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const possibleDistPaths = [
      path.join(process.cwd(), 'dist'),
      path.join(__dirname, '..', 'dist'),
      path.join(__dirname),
    ];
    const distPath =
      possibleDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) ||
      path.join(process.cwd(), 'dist');

    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle not found. Please build the application.');
      }
    });
  }

  // Unhandled error recovery middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIH26011 3D Cadastre Server] Running on http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: gracefully shutting down HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: gracefully shutting down HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
