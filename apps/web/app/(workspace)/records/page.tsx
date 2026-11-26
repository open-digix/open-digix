import type { Metadata } from "next";
import RecordsView from "./RecordsView";

export const metadata: Metadata = {
  title: "Hồ sơ của tôi · DigiX",
};

export default function RecordsPage() {
  return <RecordsView />;
}
