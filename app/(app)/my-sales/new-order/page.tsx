import { redirect } from "next/navigation";

export default function NewOrderRedirect() {
  redirect("/sales/orders");
}
