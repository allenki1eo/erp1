"use server";

import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  vehicles, drivers, fuelLogs, fuelStations, maintenanceRecords, spareParts, spareIssues, vehicleDocuments,
  companies,
} from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import {
  requirePermission, canSeeAllCompaniesTransport, PERMISSIONS,
} from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const numberOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());
const numberOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number());
const intOpt = z.preprocess((v) => (v === "" || v == null ? undefined : parseInt(String(v), 10)), z.number().int().optional());
const dateOpt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : new Date(String(v))),
  z.date().optional()
);

/** Scope resolver — cross-company for transport officer; else active company. */
async function transportScope() {
  const all = await canSeeAllCompaniesTransport();
  const companyId = await getActiveCompanyId();
  return { all, companyId };
}

// ============ VEHICLES ============
const VehicleSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1, "Company is required"),
  registrationNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().optional(),
  year: intOpt,
  type: z.enum(["TRUCK", "VAN", "PICKUP", "MOTORCYCLE", "FORKLIFT", "CAR"]).default("TRUCK"),
  category: z.string().optional(),
  fuelType: z.enum(["DIESEL", "PETROL", "ELECTRIC", "HYBRID"]).default("DIESEL"),
  tankCapacityLitres: numberOpt,
  payloadCapacityKg: numberOpt,
  currentOdometer: numberOr0,
  status: z.enum(["ACTIVE", "IDLE", "IN_MAINTENANCE", "RETIRED"]).default("ACTIVE"),
  acquiredOn: dateOpt,
  notes: z.string().optional(),
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listVehicles() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    vehicle: vehicles, company: { id: companies.id, name: companies.name },
  }).from(vehicles).leftJoin(companies, eq(vehicles.ownerCompanyId, companies.id));
  if (all) return base.orderBy(vehicles.registrationNumber);
  if (!companyId) return [];
  return base.where(eq(vehicles.ownerCompanyId, companyId)).orderBy(vehicles.registrationNumber);
}

export async function upsertVehicle(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(VehicleSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(vehicles).set(data).where(eq(vehicles.id, id));
  } else {
    await db.insert(vehicles).values(data);
  }
  revalidatePath("/transport/vehicles");
  return { ok: true };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(vehicles).where(eq(vehicles.id, id));
  revalidatePath("/transport/vehicles");
  return { ok: true };
}

// ============ DRIVERS ============
const DriverSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  licenseNumber: z.string().min(1),
  licenseClass: z.string().optional(),
  licenseExpiry: dateOpt,
  dateHired: dateOpt,
  status: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export async function listDrivers() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    driver: drivers, company: { id: companies.id, name: companies.name },
  }).from(drivers).leftJoin(companies, eq(drivers.ownerCompanyId, companies.id));
  if (all) return base.orderBy(drivers.fullName);
  if (!companyId) return [];
  return base.where(eq(drivers.ownerCompanyId, companyId)).orderBy(drivers.fullName);
}

export async function upsertDriver(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(DriverSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(drivers).set(data).where(eq(drivers.id, id));
  } else {
    await db.insert(drivers).values(data);
  }
  revalidatePath("/transport/drivers");
  return { ok: true };
}

export async function deleteDriver(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(drivers).where(eq(drivers.id, id));
  revalidatePath("/transport/drivers");
  return { ok: true };
}

// ============ FUEL STATIONS ============
const FuelStationSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["INTERNAL", "EXTERNAL"]).default("EXTERNAL"),
  address: z.string().optional(),
  fuelType: z.enum(["DIESEL", "PETROL", "ELECTRIC", "HYBRID"]).default("DIESEL"),
  tankCapacityLitres: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional()),
  currentVolumeLitres: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number()).default(0),
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listFuelStations() {
  const { all, companyId } = await transportScope();
  const base = db.select({ station: fuelStations, company: { id: companies.id, name: companies.name } })
    .from(fuelStations)
    .leftJoin(companies, eq(fuelStations.ownerCompanyId, companies.id));
  if (all) return base.orderBy(fuelStations.name);
  if (!companyId) return [];
  return base.where(eq(fuelStations.ownerCompanyId, companyId)).orderBy(fuelStations.name);
}

export async function upsertFuelStation(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(FuelStationSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(fuelStations).set(data).where(eq(fuelStations.id, id));
  } else {
    await db.insert(fuelStations).values(data);
  }
  revalidatePath("/transport/fuel-stations");
  return { ok: true };
}

export async function deleteFuelStation(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(fuelStations).where(eq(fuelStations.id, id));
  revalidatePath("/transport/fuel-stations");
  return { ok: true };
}

// ============ FUEL LOGS ============
const FuelSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  fuelStationId: z.string().optional().or(z.literal("")).transform((v) => v || undefined),
  stationType: z.enum(["INTERNAL", "EXTERNAL"]).default("EXTERNAL"),
  filledAt: z.preprocess((v) => new Date(String(v)), z.date()),
  station: z.string().optional(),
  litres: z.preprocess((v) => Number(v), z.number().positive()),
  pricePerLitre: z.preprocess((v) => Number(v), z.number().nonnegative()),
  odometer: z.preprocess((v) => Number(v), z.number().nonnegative()),
  isFullTank: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function listFuelLogs() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    log: fuelLogs,
    vehicle: { id: vehicles.id, registrationNumber: vehicles.registrationNumber },
    driver: { id: drivers.id, fullName: drivers.fullName },
    company: { id: companies.id, name: companies.name },
  })
    .from(fuelLogs)
    .leftJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
    .leftJoin(drivers, eq(fuelLogs.driverId, drivers.id))
    .leftJoin(companies, eq(fuelLogs.ownerCompanyId, companies.id));
  if (all) return base.orderBy(desc(fuelLogs.filledAt));
  if (!companyId) return [];
  return base.where(eq(fuelLogs.ownerCompanyId, companyId)).orderBy(desc(fuelLogs.filledAt));
}

export async function upsertFuelLog(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(FuelSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  const totalCost = data.litres * data.pricePerLitre;

  if (id) {
    await db.update(fuelLogs).set({ ...data, totalCost }).where(eq(fuelLogs.id, id));
  } else {
    await db.insert(fuelLogs).values({ ...data, totalCost });
    await db.update(vehicles)
      .set({ currentOdometer: data.odometer })
      .where(eq(vehicles.id, data.vehicleId));
    // Deduct from internal station tank if applicable
    if (data.fuelStationId && data.stationType === "INTERNAL") {
      const [station] = await db.select().from(fuelStations).where(eq(fuelStations.id, data.fuelStationId));
      if (station) {
        await db.update(fuelStations)
          .set({ currentVolumeLitres: Math.max(0, station.currentVolumeLitres - data.litres) })
          .where(eq(fuelStations.id, data.fuelStationId));
      }
    }
  }
  revalidatePath("/transport/fuel");
  revalidatePath("/transport/fuel-stations");
  return { ok: true };
}

export async function deleteFuelLog(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(fuelLogs).where(eq(fuelLogs.id, id));
  revalidatePath("/transport/fuel");
  return { ok: true };
}

// ============ MAINTENANCE ============
const MaintenanceSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1),
  vehicleId: z.string().min(1),
  type: z.enum(["ROUTINE", "REPAIR", "INSPECTION", "TYRE", "BODY"]).default("ROUTINE"),
  scheduledFor: dateOpt,
  performedAt: dateOpt,
  odometerAt: numberOpt,
  description: z.string().min(2),
  workshop: z.string().optional(),
  mechanic: z.string().optional(),
  partsCost: numberOr0,
  labourCost: numberOr0,
  nextServiceOdometer: numberOpt,
  nextServiceDate: dateOpt,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PLANNED"),
  notes: z.string().optional(),
});

export async function listMaintenance() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    rec: maintenanceRecords,
    vehicle: { id: vehicles.id, registrationNumber: vehicles.registrationNumber },
    company: { id: companies.id, name: companies.name },
  })
    .from(maintenanceRecords)
    .leftJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id))
    .leftJoin(companies, eq(maintenanceRecords.ownerCompanyId, companies.id));
  if (all) return base.orderBy(desc(maintenanceRecords.createdAt));
  if (!companyId) return [];
  return base.where(eq(maintenanceRecords.ownerCompanyId, companyId)).orderBy(desc(maintenanceRecords.createdAt));
}

export async function upsertMaintenance(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(MaintenanceSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, partsCost, labourCost, ...rest } = parsed.data;
  const totalCost = partsCost + labourCost;
  const payload = { ...rest, partsCost, labourCost, totalCost };
  if (id) {
    await db.update(maintenanceRecords).set(payload).where(eq(maintenanceRecords.id, id));
  } else {
    await db.insert(maintenanceRecords).values(payload);
  }
  revalidatePath("/transport/maintenance");
  return { ok: true };
}

export async function deleteMaintenance(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
  revalidatePath("/transport/maintenance");
  return { ok: true };
}

// ============ SPARES ============
const SpareSchema = z.object({
  id: z.string().optional(),
  ownerCompanyId: z.string().min(1),
  partNumber: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().default("PCS"),
  unitCost: numberOr0,
  qtyOnHand: numberOr0,
  reorderLevel: numberOr0,
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listSpares() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    spare: spareParts,
    company: { id: companies.id, name: companies.name },
  }).from(spareParts).leftJoin(companies, eq(spareParts.ownerCompanyId, companies.id));
  if (all) return base.orderBy(spareParts.partNumber);
  if (!companyId) return [];
  return base.where(eq(spareParts.ownerCompanyId, companyId)).orderBy(spareParts.partNumber);
}

export async function upsertSpare(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(SpareSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(spareParts).set(data).where(eq(spareParts.id, id));
  } else {
    await db.insert(spareParts).values(data);
  }
  revalidatePath("/transport/spares");
  return { ok: true };
}

export async function deleteSpare(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(spareParts).where(eq(spareParts.id, id));
  revalidatePath("/transport/spares");
  return { ok: true };
}

// ============ DOCUMENTS ============
const DocSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1),
  type: z.enum(["INSURANCE", "TLB", "INSPECTION", "FITNESS", "ROAD_LICENSE", "OTHER"]),
  number: z.string().optional(),
  issuer: z.string().optional(),
  issuedOn: dateOpt,
  expiresOn: dateOpt,
  fileUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  cost: numberOr0,
  notes: z.string().optional(),
});

export async function listVehicleDocuments() {
  const { all, companyId } = await transportScope();
  const base = db.select({
    doc: vehicleDocuments,
    vehicle: { id: vehicles.id, registrationNumber: vehicles.registrationNumber, ownerCompanyId: vehicles.ownerCompanyId },
    company: { id: companies.id, name: companies.name },
  })
    .from(vehicleDocuments)
    .leftJoin(vehicles, eq(vehicleDocuments.vehicleId, vehicles.id))
    .leftJoin(companies, eq(vehicles.ownerCompanyId, companies.id));
  if (all) return base.orderBy(desc(vehicleDocuments.expiresOn));
  if (!companyId) return [];
  return base.where(eq(vehicles.ownerCompanyId, companyId)).orderBy(desc(vehicleDocuments.expiresOn));
}

export async function upsertVehicleDocument(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  const parsed = fromFormData(DocSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(vehicleDocuments).set(data).where(eq(vehicleDocuments.id, id));
  } else {
    await db.insert(vehicleDocuments).values(data);
  }
  revalidatePath("/transport/documents");
  return { ok: true };
}

export async function deleteVehicleDocument(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TRANSPORT_MANAGE);
  await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
  revalidatePath("/transport/documents");
  return { ok: true };
}
