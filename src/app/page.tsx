import { redirect } from "next/navigation";

export default function Home() {
  // The proxy redirects unauthenticated users to /login; signed-in users land
  // on the dashboard.
  redirect("/dashboard");
}
