"use server";

import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recipes, recipeItems, products } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const boolIn = z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean());
const numOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());

const RecipeSchema = z.object({
  id: strOpt,
  productId: z.string().min(1, "Product required"),
  name: z.string().min(2, "Name too short"),
  version: z.string().min(1).default("1.0"),
  expectedYield: z.preprocess((v) => Number(v), z.number().positive()),
  expectedAbv: numOpt,
  notes: strOpt,
  isActive: boolIn.default(true),
});

export async function listRecipes() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    recipe: recipes,
    product: { id: products.id, sku: products.sku, name: products.name, productClass: products.productClass },
    itemCount: sql<number>`(select count(*) from ${recipeItems} where ${recipeItems.recipeId} = ${recipes.id})`,
  })
    .from(recipes)
    .leftJoin(products, eq(recipes.productId, products.id))
    .where(eq(recipes.companyId, companyId))
    .orderBy(recipes.name);
}

export async function getRecipe(id: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const [row] = await db.select({
    recipe: recipes,
    product: { id: products.id, sku: products.sku, name: products.name, productClass: products.productClass },
  })
    .from(recipes)
    .leftJoin(products, eq(recipes.productId, products.id))
    .where(and(eq(recipes.id, id), eq(recipes.companyId, companyId)));
  if (!row) return null;

  const items = await db.select({
    item: recipeItems,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(recipeItems)
    .leftJoin(products, eq(recipeItems.productId, products.id))
    .where(eq(recipeItems.recipeId, id))
    .orderBy(recipeItems.stage, products.name);

  return { recipe: row.recipe, product: row.product, items };
}

export async function upsertRecipe(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.RECIPE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(RecipeSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(recipes).set(data).where(and(eq(recipes.id, id), eq(recipes.companyId, companyId)));
  } else {
    await db.insert(recipes).values({ ...data, companyId });
  }
  revalidatePath("/masters/recipes");
  return { ok: true };
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.RECIPE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.companyId, companyId)));
  revalidatePath("/masters/recipes");
  return { ok: true };
}

const ItemSchema = z.object({
  id: strOpt,
  recipeId: z.string().min(1),
  productId: z.string().min(1, "Product required"),
  quantity: z.preprocess((v) => Number(v), z.number().positive()),
  uom: z.string().min(1),
  stage: strOpt,
});

export async function upsertRecipeItem(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.RECIPE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(ItemSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, recipeId, ...data } = parsed.data;

  const [r] = await db.select().from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.companyId, companyId)));
  if (!r) return { ok: false, error: "Recipe not found" };

  if (id) {
    await db.update(recipeItems).set(data).where(eq(recipeItems.id, id));
  } else {
    await db.insert(recipeItems).values({ ...data, recipeId });
  }
  revalidatePath(`/masters/recipes/${recipeId}`);
  return { ok: true };
}

export async function deleteRecipeItem(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.RECIPE_MANAGE);
  const [item] = await db.select().from(recipeItems).where(eq(recipeItems.id, id));
  if (!item) return { ok: false, error: "Item not found" };
  await db.delete(recipeItems).where(eq(recipeItems.id, id));
  revalidatePath(`/masters/recipes/${item.recipeId}`);
  return { ok: true };
}
