/*
 * Copyright 2026 DigiX Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface StepperProps {
  currentStep: "create" | "source" | "normalize" | "edit" | "validate";
}

const STEPS = [
  { id: "create", no: "01", label: "Tạo ứng dụng" },
  { id: "source", no: "02", label: "Mô tả nguồn" },
  { id: "normalize", no: "03", label: "Chuẩn hóa" },
  { id: "edit", no: "04", label: "Chỉnh sửa" },
  { id: "validate", no: "05", label: "Kiểm tra" },
] as const;

export default function Stepper({ currentStep }: StepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className="flow-stepper" aria-label="Các bước thiết kế quy trình">
      {STEPS.map((s, index) => {
        const isComplete = index < currentIndex;
        const isActive = index === currentIndex;
        const statusClass = isActive
          ? "active"
          : isComplete
            ? "complete"
            : "";

        return (
          <div key={s.id} className={`flow-stage ${statusClass}`}>
            <span>{isComplete ? "✓" : s.no}</span>
            <span className="flow-stage-label">{s.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
