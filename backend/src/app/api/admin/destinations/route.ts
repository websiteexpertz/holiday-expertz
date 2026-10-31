import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllCountries,
  getAllStates,
  getAllCities,
  getAllAreas,
  getStatesByCountry,
  getCitiesByState,
  getAreasByCity,
  getDestinationHierarchyCounts,
  getFullDestinationTree,
  getPropertiesByDestination,
  createCountry,
  createState,
  createCity,
  createArea,
  updateCountry,
  updateState,
  updateCity,
  updateArea,
  deleteCountry,
  deleteState,
  deleteCity,
  deleteArea,
  getCountryById,
  getStateById,
} from "../../../../lib/storage/destinationStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hierarchy = searchParams.get("hierarchy");
    const countsOnly = searchParams.get("counts");
    const type = searchParams.get("type");
    const countryId = searchParams.get("countryId") || undefined;
    const stateId = searchParams.get("stateId") || undefined;
    const cityId = searchParams.get("cityId") || undefined;
    const areaId = searchParams.get("areaId") || undefined;

    if (hierarchy === "true") {
      const tree = getFullDestinationTree();
      const counts = getDestinationHierarchyCounts();
      return NextResponse.json({ success: true, tree, counts });
    }

    if (countsOnly === "true") {
      const counts = getDestinationHierarchyCounts();
      return NextResponse.json({ success: true, counts });
    }

    if (type === "properties") {
      const properties = getPropertiesByDestination({ countryId, stateId, cityId, areaId });
      return NextResponse.json({ success: true, properties });
    }

    if (type === "country") {
      return NextResponse.json({ success: true, countries: getAllCountries() });
    }

    if (type === "state") {
      const states = countryId ? getStatesByCountry(countryId) : getAllStates();
      return NextResponse.json({ success: true, states });
    }

    if (type === "city") {
      const cities = stateId ? getCitiesByState(stateId) : getAllCities();
      return NextResponse.json({ success: true, cities });
    }

    if (type === "area") {
      const areas = cityId ? getAreasByCity(cityId) : getAllAreas();
      return NextResponse.json({ success: true, areas });
    }

    // Default: return all lists + counts
    return NextResponse.json({
      success: true,
      counts: getDestinationHierarchyCounts(),
      countries: getAllCountries(),
      states: getAllStates(),
      cities: getAllCities(),
      areas: getAllAreas(),
    });
  } catch (error) {
    console.error("Admin Destinations GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch destination data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.create")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { entityType, ...payload } = body;

    let createdRecord: unknown = null;

    if (entityType === "country") {
      const name = payload.name?.trim();
      if (!name) {
        return NextResponse.json({ success: false, message: "Country name is required" }, { status: 400 });
      }
      const code = payload.code?.trim().toUpperCase() || name.slice(0, 3).toUpperCase();
      createdRecord = createCountry(name, code, payload.description, payload.image);
    } else if (entityType === "state") {
      const name = payload.name?.trim();
      const countryId = payload.countryId?.trim();
      if (!name || !countryId) {
        return NextResponse.json({ success: false, message: "State name and parent country are required" }, { status: 400 });
      }
      const parentCountry = getCountryById(countryId);
      if (!parentCountry) {
        return NextResponse.json({ success: false, message: "Parent country not found" }, { status: 400 });
      }
      createdRecord = createState(name, countryId, payload.image);
    } else if (entityType === "city") {
      const name = payload.name?.trim();
      const stateId = payload.stateId?.trim();
      if (!name || !stateId) {
        return NextResponse.json({ success: false, message: "City name and parent state are required" }, { status: 400 });
      }
      const parentState = getStateById(stateId);
      if (!parentState) {
        return NextResponse.json({ success: false, message: "Parent state not found" }, { status: 400 });
      }
      const countryId = payload.countryId?.trim() || parentState.countryId;
      createdRecord = createCity(name, stateId, countryId, payload.image);
    } else if (entityType === "area") {
      const name = payload.name?.trim();
      const cityId = payload.cityId?.trim();
      if (!name || !cityId) {
        return NextResponse.json({ success: false, message: "Area name and city are required" }, { status: 400 });
      }
      createdRecord = createArea(name, cityId, payload.postalCode);
    } else {
      return NextResponse.json({ success: false, message: "Invalid entityType" }, { status: 400 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: `create_${entityType}`,
      resourceType: entityType,
      details: `Created new ${entityType} destination: ${payload.name}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} created successfully`,
      data: createdRecord,
      counts: getDestinationHierarchyCounts(),
    });
  } catch (error: any) {
    console.error("Admin Destinations POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create destination entity" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.update")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { entityType, id, updates } = body;

    if (!entityType || !id || !updates) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    let updatedRecord: unknown = null;
    if (entityType === "country") updatedRecord = updateCountry(id, updates);
    else if (entityType === "state") updatedRecord = updateState(id, updates);
    else if (entityType === "city") updatedRecord = updateCity(id, updates);
    else if (entityType === "area") updatedRecord = updateArea(id, updates);

    if (!updatedRecord) {
      return NextResponse.json({ success: false, message: `${entityType} not found` }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: `update_${entityType}`,
      resourceId: id,
      resourceType: entityType,
      details: `Updated ${entityType} record ${id}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} updated successfully`,
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Admin Destinations PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update destination entity" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const id = searchParams.get("id");

    if (!entityType || !id) {
      return NextResponse.json({ success: false, message: "entityType and id query parameters required" }, { status: 400 });
    }

    try {
      if (entityType === "country") deleteCountry(id);
      else if (entityType === "state") deleteState(id);
      else if (entityType === "city") deleteCity(id);
      else if (entityType === "area") deleteArea(id);
      else {
        return NextResponse.json({ success: false, message: "Invalid entityType" }, { status: 400 });
      }
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err?.message || "Failed to delete destination entity" }, { status: 400 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: `delete_${entityType}`,
      resourceId: id,
      resourceType: entityType,
      details: `Deleted ${entityType} ${id}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} deleted successfully`,
      counts: getDestinationHierarchyCounts(),
    });
  } catch (error: any) {
    console.error("Admin Destinations DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete destination entity" },
      { status: 500 }
    );
  }
}
