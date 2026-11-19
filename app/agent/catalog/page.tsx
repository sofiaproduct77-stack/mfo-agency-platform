import Link from "next/link";
import { redirect } from "next/navigation";

export default function AgentCatalogRedirect() {
  redirect("/agent/offers");
}
