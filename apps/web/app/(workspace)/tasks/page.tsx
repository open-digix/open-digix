import type { Metadata } from "next";
import TasksView from "./TasksView";

export const metadata: Metadata = {
  title: "Việc của tôi · DigiX",
};

export default function TasksPage() {
  return <TasksView />;
}
