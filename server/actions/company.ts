"use server";

import { setActiveCompany } from "@/lib/tenant";

export async function switchCompany(companyId: string) {
  await setActiveCompany(companyId);
}
