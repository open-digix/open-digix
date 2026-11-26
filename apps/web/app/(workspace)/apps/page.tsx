import type { Metadata } from "next";
import AppsView from "./AppsView";

export const metadata: Metadata = {
  title: "Ứng dụng · DigiX",
};

export default function AppsPage() {
  return <AppsView />;
}
