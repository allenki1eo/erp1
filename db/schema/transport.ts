import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./auth";
import { warehouses } from "./masters";

/**
 * Transport module — fleet, drivers, fuel, maintenance, spares.
 *
 * Vehicles belong to one company (ownerCompanyId). The Transport Officer
 * role gets the TRANSPORT_CROSS_COMPANY permission and can list across all
 * companies; other roles are filtered by active company.
 */

export const vehicles = sqliteTable("vehicle", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  registrationNumber: text("registration_number").notNull(),       // e.g. T 123 ABC
  make: text("make").notNull(),
  model: text("model"),
  year: integer("year"),
  type: text("type").notNull().default("TRUCK"),                   // TRUCK, VAN, PICKUP, MOTORCYCLE, FORKLIFT, CAR
  category: text("category"),                                       // DELIVERY, EXECUTIVE, OPERATIONS, FORKLIFT
  fuelType: text("fuel_type").notNull().default("DIESEL"),         // DIESEL, PETROL, ELECTRIC, HYBRID
  tankCapacityLitres: real("tank_capacity_litres"),
  payloadCapacityKg: real("payload_capacity_kg"),
  homeWarehouseId: text("home_warehouse_id").references(() => warehouses.id),
  currentOdometer: real("current_odometer").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"),              // ACTIVE, IDLE, IN_MAINTENANCE, RETIRED
  acquiredOn: integer("acquired_on", { mode: "timestamp_ms" }),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const drivers = sqliteTable("driver", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),             // optional link if driver is a system user
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  nationalId: text("national_id"),
  licenseNumber: text("license_number").notNull(),
  licenseClass: text("license_class"),                             // C, C1, CE, etc.
  licenseExpiry: integer("license_expiry", { mode: "timestamp_ms" }),
  dateHired: integer("date_hired", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("ACTIVE"),              // ACTIVE, SUSPENDED, TERMINATED
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const vehicleAssignments = sqliteTable("vehicle_assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  driverId: text("driver_id").notNull().references(() => drivers.id),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
  notes: text("notes"),
});

export const fuelLogs = sqliteTable("fuel_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  driverId: text("driver_id").references(() => drivers.id),
  filledAt: integer("filled_at", { mode: "timestamp_ms" }).notNull(),
  station: text("station"),
  litres: real("litres").notNull(),
  pricePerLitre: real("price_per_litre").notNull(),
  totalCost: real("total_cost").notNull(),
  odometer: real("odometer").notNull(),
  isFullTank: integer("is_full_tank", { mode: "boolean" }).notNull().default(true),
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  recordedById: text("recorded_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const maintenanceRecords = sqliteTable("maintenance_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  type: text("type").notNull().default("ROUTINE"),                 // ROUTINE, REPAIR, INSPECTION, TYRE, BODY
  scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }),
  performedAt: integer("performed_at", { mode: "timestamp_ms" }),
  odometerAt: real("odometer_at"),
  description: text("description").notNull(),
  workshop: text("workshop"),                                      // internal / external
  mechanic: text("mechanic"),
  partsCost: real("parts_cost").notNull().default(0),
  labourCost: real("labour_cost").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  nextServiceOdometer: real("next_service_odometer"),
  nextServiceDate: integer("next_service_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("PLANNED"),             // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const spareParts = sqliteTable("spare_part", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  partNumber: text("part_number").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),                                      // FILTER, OIL, TYRE, BRAKE, BATTERY, FLUID, ELECTRICAL
  uom: text("uom").notNull().default("PCS"),
  unitCost: real("unit_cost").notNull().default(0),
  qtyOnHand: real("qty_on_hand").notNull().default(0),
  reorderLevel: real("reorder_level").notNull().default(0),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const spareIssues = sqliteTable("spare_issue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  sparePartId: text("spare_part_id").notNull().references(() => spareParts.id),
  vehicleId: text("vehicle_id").references(() => vehicles.id),
  maintenanceRecordId: text("maintenance_record_id").references(() => maintenanceRecords.id),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  issuedAt: integer("issued_at", { mode: "timestamp_ms" }).notNull(),
  issuedById: text("issued_by_id").references(() => users.id),
  notes: text("notes"),
});

export const vehicleDocuments = sqliteTable("vehicle_document", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),                                    // INSURANCE, TLB, INSPECTION, FITNESS, ROAD_LICENSE
  number: text("number"),
  issuer: text("issuer"),
  issuedOn: integer("issued_on", { mode: "timestamp_ms" }),
  expiresOn: integer("expires_on", { mode: "timestamp_ms" }),
  fileUrl: text("file_url"),
  cost: real("cost").default(0),
  notes: text("notes"),
});

export const trips = sqliteTable("trip", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerCompanyId: text("owner_company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  driverId: text("driver_id").references(() => drivers.id),
  purpose: text("purpose").notNull().default("DELIVERY"),          // DELIVERY, COLLECTION, TRANSFER, MAINTENANCE, OTHER
  refType: text("ref_type"),                                       // SO, TRANSFER
  refId: text("ref_id"),
  startOdometer: real("start_odometer"),
  endOdometer: real("end_odometer"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  endedAt: integer("ended_at", { mode: "timestamp_ms" }),
  origin: text("origin"),
  destination: text("destination"),
  status: text("status").notNull().default("PLANNED"),             // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  notes: text("notes"),
});
