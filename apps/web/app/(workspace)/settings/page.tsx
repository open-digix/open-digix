import type { Metadata } from "next";
import SettingsView from "./SettingsView";

export const metadata: Metadata = {
  title: "Cài đặt · DigiX",
};

export default function SettingsPage() {
  return <SettingsView />;
}
