import type { Migration } from '../migrations';

export const builderDraftsMigration: Migration = {
  id: '0002_builder_drafts',
  sql: String.raw`
    ALTER TABLE applications
      ADD COLUMN goal text,
      ADD COLUMN department_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN template_key varchar(64),
      ADD CONSTRAINT applications_department_refs_array
        CHECK (jsonb_typeof(department_refs) = 'array'),
      ADD CONSTRAINT applications_template_key_format
        CHECK (
          template_key IS NULL OR
          template_key ~ '^[a-z][a-z0-9_-]{1,63}$'
        );

    ALTER TABLE application_versions
      ADD COLUMN current_revision_id uuid,
      ADD COLUMN lock_version integer NOT NULL DEFAULT 1,
      ADD CONSTRAINT application_versions_lock_version_positive
        CHECK (lock_version > 0);

    CREATE TABLE builder_source_revisions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      revision_no integer NOT NULL,
      sections jsonb NOT NULL DEFAULT '{}'::jsonb,
      segments jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_by_membership_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT builder_source_revisions_application_fk
        FOREIGN KEY (tenant_id, application_id)
        REFERENCES applications (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT builder_source_revisions_created_by_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT builder_source_revisions_revision_positive
        CHECK (revision_no > 0),
      CONSTRAINT builder_source_revisions_sections_object
        CHECK (jsonb_typeof(sections) = 'object'),
      CONSTRAINT builder_source_revisions_segments_array
        CHECK (jsonb_typeof(segments) = 'array'),
      CONSTRAINT builder_source_revisions_tenant_app_id_unique
        UNIQUE (tenant_id, application_id, id),
      CONSTRAINT builder_source_revisions_tenant_app_revision_unique
        UNIQUE (tenant_id, application_id, revision_no)
    );

    CREATE INDEX builder_source_revisions_created_idx
      ON builder_source_revisions (
        tenant_id,
        application_id,
        created_at DESC
      );

    CREATE TABLE builder_source_files (
      tenant_id uuid NOT NULL,
      application_id uuid NOT NULL,
      source_revision_id uuid NOT NULL,
      file_id uuid NOT NULL,
      PRIMARY KEY (
        tenant_id,
        application_id,
        source_revision_id,
        file_id
      ),
      CONSTRAINT builder_source_files_source_revision_fk
        FOREIGN KEY (tenant_id, application_id, source_revision_id)
        REFERENCES builder_source_revisions (
          tenant_id,
          application_id,
          id
        ) ON DELETE RESTRICT,
      CONSTRAINT builder_source_files_file_fk
        FOREIGN KEY (tenant_id, file_id)
        REFERENCES stored_files (tenant_id, id) ON DELETE RESTRICT
    );

    CREATE TABLE builder_draft_revisions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      revision_no integer NOT NULL,
      definition jsonb NOT NULL,
      design_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      snapshot_checksum char(64) NOT NULL,
      created_by_membership_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT builder_draft_revisions_application_version_fk
        FOREIGN KEY (tenant_id, application_id, application_version_id)
        REFERENCES application_versions (tenant_id, application_id, id)
        ON DELETE RESTRICT,
      CONSTRAINT builder_draft_revisions_created_by_fk
        FOREIGN KEY (tenant_id, created_by_membership_id)
        REFERENCES tenant_memberships (tenant_id, id) ON DELETE RESTRICT,
      CONSTRAINT builder_draft_revisions_revision_positive
        CHECK (revision_no > 0),
      CONSTRAINT builder_draft_revisions_definition_object
        CHECK (jsonb_typeof(definition) = 'object'),
      CONSTRAINT builder_draft_revisions_design_metadata_object
        CHECK (jsonb_typeof(design_metadata) = 'object'),
      CONSTRAINT builder_draft_revisions_checksum_format
        CHECK (snapshot_checksum ~ '^[0-9a-f]{64}$'),
      CONSTRAINT builder_draft_revisions_tenant_app_version_id_unique
        UNIQUE (
          tenant_id,
          application_id,
          application_version_id,
          id
        ),
      CONSTRAINT builder_draft_revisions_tenant_app_version_revision_unique
        UNIQUE (
          tenant_id,
          application_id,
          application_version_id,
          revision_no
        )
    );

    CREATE INDEX builder_draft_revisions_created_idx
      ON builder_draft_revisions (
        tenant_id,
        application_id,
        application_version_id,
        created_at DESC
      );

    CREATE TABLE builder_revision_sources (
      tenant_id uuid NOT NULL,
      application_id uuid NOT NULL,
      application_version_id uuid NOT NULL,
      revision_id uuid NOT NULL,
      source_revision_id uuid NOT NULL,
      PRIMARY KEY (
        tenant_id,
        application_id,
        application_version_id,
        revision_id,
        source_revision_id
      ),
      CONSTRAINT builder_revision_sources_draft_revision_fk
        FOREIGN KEY (
          tenant_id,
          application_id,
          application_version_id,
          revision_id
        ) REFERENCES builder_draft_revisions (
          tenant_id,
          application_id,
          application_version_id,
          id
        ) ON DELETE RESTRICT,
      CONSTRAINT builder_revision_sources_source_revision_fk
        FOREIGN KEY (tenant_id, application_id, source_revision_id)
        REFERENCES builder_source_revisions (
          tenant_id,
          application_id,
          id
        ) ON DELETE RESTRICT
    );

    ALTER TABLE application_versions
      ADD CONSTRAINT application_versions_current_revision_fk
      FOREIGN KEY (
        tenant_id,
        application_id,
        id,
        current_revision_id
      ) REFERENCES builder_draft_revisions (
        tenant_id,
        application_id,
        application_version_id,
        id
      ) ON DELETE RESTRICT;
  `,
};
