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

export interface AiCitation {
  sourceId: string;
  version?: string;
  number: number;
  title: string;
  location?: string;
  snippet?: string;
}

export type AiAskResponse =
  | {
      status: "answered";
      answer: string;
      answerIntro?: string;
      items?: { text: string; citeNum: number }[];
      citations: AiCitation[];
    }
  | {
      status: "no_evidence";
    }
  | {
      status: "unavailable";
    };

export interface AiSource {
  id: string;
  number: number;
  name: string;
  type: string;
  version?: string;
  updatedAt?: string;
  status: "active" | "scanning";
  snippet?: string;
}

export interface AiAppOption {
  id: string;
  name: string;
  key: string;
  hasSources: boolean;
}

export interface AiHistoryItem {
  id: string;
  appId: string;
  appName: string;
  title: string;
  timestamp: string;
  group: "today" | "past_7_days";
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  question?: string;
  status?: "answered" | "no_evidence" | "unavailable";
  answerIntro?: string;
  items?: { text: string; citeNum: number }[];
  citations?: AiCitation[];
  feedback?: "helpful" | "incorrect" | null;
}
