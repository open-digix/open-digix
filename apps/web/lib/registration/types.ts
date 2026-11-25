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

export interface TenantRegistrationAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
}

export interface TenantRegistrationInput {
  tenantName: string;
  tenantSlug: string;
  admin: TenantRegistrationAdminInput;
}

export type RegistrationErrorCode =
  | "TENANT_SLUG_TAKEN"
  | "EMAIL_TAKEN"
  | "USERNAME_TAKEN"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "UNAVAILABLE";

export type RegistrationTargetField =
  | "tenantName"
  | "tenantSlug"
  | "firstName"
  | "lastName"
  | "email"
  | "username"
  | "password"
  | "general";

export interface TenantRegistrationSuccess {
  ok: true;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  username: string;
  mock?: boolean;
}

export interface TenantRegistrationFailure {
  ok: false;
  code: RegistrationErrorCode;
  message: string;
  field: RegistrationTargetField;
  fieldErrors?: Partial<Record<RegistrationTargetField, string>>;
}

export type TenantRegistrationResult =
  | TenantRegistrationSuccess
  | TenantRegistrationFailure;
