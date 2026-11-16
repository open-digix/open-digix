import type {
  BuilderApplicationDefinitionV1,
  BuilderComparison,
  BuilderComparisonOperator,
  BuilderComparisonValue,
  BuilderCondition,
  BuilderFieldDefinition,
  BuilderFieldType,
  BuilderOpenIssue,
  BuilderSourceMapping,
  BuilderSourceSection,
  BuilderSourceSegment,
  BuilderStepDefinition,
  BuilderTransitionDefinition,
} from './builder.types';

export interface NormalizeSourceParams {
  readonly appId: string;
  readonly tenantId: string;
  readonly version: number;
  readonly name: string;
  readonly sourceRevisionId: string;
  readonly sections: Readonly<Partial<Record<BuilderSourceSection, string>>>;
  readonly segments: readonly BuilderSourceSegment[];
}

export interface NormalizedManifestResult {
  readonly definition: BuilderApplicationDefinitionV1;
  readonly sourceMappings: readonly BuilderSourceMapping[];
  readonly openIssues: readonly BuilderOpenIssue[];
}

const ID_PATTERN = /^[a-z][a-z0-9_-]{1,63}$/;

export class BuilderSourceNormalizer {
  normalize(params: NormalizeSourceParams): NormalizedManifestResult {
    const {
      appId,
      tenantId,
      version,
      name,
      sourceRevisionId,
      sections,
      segments,
    } = params;

    const sourceMappings: BuilderSourceMapping[] = [];
    const openIssues: BuilderOpenIssue[] = [];

    const segmentMap = new Map<BuilderSourceSection, string>();
    segments.forEach((seg) => {
      if (!segmentMap.has(seg.section)) {
        segmentMap.set(seg.section, seg.id);
      }
    });

    const getSegmentId = (section: BuilderSourceSection): string =>
      segmentMap.get(section) ?? `${section}_1`;

    const roles = extractRoles(
      sections.roles,
      sections.steps,
      sourceRevisionId,
      getSegmentId('roles'),
      getSegmentId('steps'),
      sourceMappings,
      openIssues,
    );

    const fields = extractFields(
      sections.inputs,
      sections.steps,
      sections.branches,
      sourceRevisionId,
      getSegmentId('inputs'),
      sourceMappings,
      openIssues,
    );

    const { steps, transitions } = extractStepsAndTransitions(
      sections.steps,
      sections.branches,
      sections.outputs,
      roles,
      fields,
      sourceRevisionId,
      getSegmentId('steps'),
      getSegmentId('branches'),
      getSegmentId('outputs'),
      sourceMappings,
      openIssues,
    );

    if (sections.exceptions && sections.exceptions.trim()) {
      openIssues.push({
        code: 'UNHANDLED_EXCEPTION_NOTE',
        message: `Unhandled exception in source description: ${sections.exceptions.trim()}`,
        blocking: false,
      });
    }

    const definition: BuilderApplicationDefinitionV1 = {
      schemaVersion: '1.0',
      appId,
      tenantId,
      version,
      name,
      roles,
      fields,
      steps,
      transitions,
    };

    return {
      definition,
      sourceMappings,
      openIssues,
    };
  }
}

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return fallback;
}

function extractRoles(
  rolesNote: string | undefined,
  stepsNote: string | undefined,
  sourceRevisionId: string,
  rolesSegmentId: string,
  stepsSegmentId: string,
  mappings: BuilderSourceMapping[],
  issues: BuilderOpenIssue[],
): string[] {
  const roleSet = new Set<string>();

  if (rolesNote && rolesNote.trim()) {
    const lines = rolesNote.split(/[\r\n,]+/);
    lines.forEach((line) => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, '');
      if (!trimmed) return;
      const roleIdPart = trimmed.split(/[:(-]/)[0]?.trim() ?? '';
      const sanitized = sanitizeId(roleIdPart, '');
      if (sanitized && ID_PATTERN.test(sanitized)) {
        roleSet.add(sanitized);
      }
    });
  }

  if (roleSet.size === 0 && stepsNote && stepsNote.trim()) {
    const commonRoles = [
      'employee',
      'manager',
      'director',
      'hr',
      'lead',
      'admin',
      'finance',
      'accountant',
      'reviewer',
      'requester',
      'approver',
    ];
    const lowerSteps = stepsNote.toLowerCase();
    commonRoles.forEach((r) => {
      if (lowerSteps.includes(r)) {
        roleSet.add(r);
      }
    });
    if (lowerSteps.includes('quản lý') || lowerSteps.includes('quan ly')) {
      roleSet.add('manager');
    }
    if (lowerSteps.includes('nhân viên') || lowerSteps.includes('nhan vien')) {
      roleSet.add('employee');
    }
    if (lowerSteps.includes('giám đốc') || lowerSteps.includes('giam doc')) {
      roleSet.add('director');
    }
    if (lowerSteps.includes('nhân sự') || lowerSteps.includes('nhan su')) {
      roleSet.add('hr');
    }
  }

  if (roleSet.size === 0) {
    roleSet.add('employee');
    roleSet.add('manager');
    issues.push({
      code: 'NO_ROLES_DEFINED',
      message:
        'No roles could be identified from the source description; defaulted to employee and manager.',
      blocking: true,
    });
  }

  const result = Array.from(roleSet);
  result.forEach((role) => {
    mappings.push({
      targetType: 'role',
      targetId: role,
      sourceRevisionId,
      segmentIds: [rolesNote ? rolesSegmentId : stepsSegmentId],
    });
  });

  return result;
}

function extractFields(
  inputsNote: string | undefined,
  stepsNote: string | undefined,
  branchesNote: string | undefined,
  sourceRevisionId: string,
  inputsSegmentId: string,
  mappings: BuilderSourceMapping[],
  issues: BuilderOpenIssue[],
): BuilderFieldDefinition[] {
  const fields: BuilderFieldDefinition[] = [];
  const fieldIds = new Set<string>();

  if (inputsNote && inputsNote.trim()) {
    const lines = inputsNote.split(/[\r\n]+/);
    lines.forEach((line) => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, '');
      if (!trimmed) return;

      const field = parseFieldLine(trimmed, issues);
      if (field && !fieldIds.has(field.id)) {
        fieldIds.add(field.id);
        fields.push(field);
        mappings.push({
          targetType: 'field',
          targetId: field.id,
          sourceRevisionId,
          segmentIds: [inputsSegmentId],
        });
      }
    });
  }

  const combinedContext = `${stepsNote ?? ''}\n${branchesNote ?? ''}`;
  const decisionMatches = combinedContext.matchAll(
    /([a-z0-9_-]+_decision)\b/gi,
  );
  for (const match of decisionMatches) {
    const decId = match[1]?.toLowerCase();
    if (decId && ID_PATTERN.test(decId) && !fieldIds.has(decId)) {
      fieldIds.add(decId);
      const decField: BuilderFieldDefinition = {
        id: decId,
        type: 'enum',
        required: false,
        options: ['approved', 'rejected'],
      };
      fields.push(decField);
      mappings.push({
        targetType: 'field',
        targetId: decField.id,
        sourceRevisionId,
        segmentIds: [inputsSegmentId],
      });
    }
  }

  if (fields.length === 0) {
    const defaultField: BuilderFieldDefinition = {
      id: 'request_notes',
      type: 'string',
      required: true,
    };
    fields.push(defaultField);
    mappings.push({
      targetType: 'field',
      targetId: defaultField.id,
      sourceRevisionId,
      segmentIds: [inputsSegmentId],
    });
    issues.push({
      code: 'NO_FIELDS_DEFINED',
      message:
        'No input fields could be identified from source inputs; generated default field request_notes.',
      blocking: false,
    });
  }

  return fields;
}

function parseFieldLine(
  line: string,
  issues: BuilderOpenIssue[],
): BuilderFieldDefinition | undefined {
  const colonMatch = line.match(/^([a-z0-9_ -]+)\s*[:(](.+)$/i);
  let idPart = '';
  let restPart = '';

  if (colonMatch && colonMatch[1] && colonMatch[2]) {
    idPart = colonMatch[1].trim();
    restPart = colonMatch[2].replace(/\)$/, '').trim();
  } else {
    const words = line.split(/\s+/);
    idPart = words[0] ?? '';
    restPart = words.slice(1).join(' ');
  }

  const id = sanitizeId(idPart, '');
  if (!id || !ID_PATTERN.test(id)) return undefined;

  const lowerRest = restPart.toLowerCase();

  let type: BuilderFieldType = 'string';
  if (/\b(integer|int|number|số)\b/.test(lowerRest)) {
    type = 'integer';
  } else if (/\b(date|ngày)\b/.test(lowerRest)) {
    type = 'date';
  } else if (/\b(boolean|bool)\b/.test(lowerRest)) {
    type = 'boolean';
  } else if (/\b(enum|lựa chọn|select)\b/.test(lowerRest)) {
    type = 'enum';
  }

  const isOptional = /\b(optional|tùy chọn|khong bat buoc)\b/.test(lowerRest);
  const required = !isOptional;

  let min: number | undefined;
  let max: number | undefined;
  const minMatch = lowerRest.match(/(?:min|tối thiểu)\s*[:=]?\s*(\d+)/);
  if (minMatch && minMatch[1]) {
    min = parseInt(minMatch[1], 10);
  }
  const maxMatch = lowerRest.match(/(?:max|tối đa)\s*[:=]?\s*(\d+)/);
  if (maxMatch && maxMatch[1]) {
    max = parseInt(maxMatch[1], 10);
  }

  let options: string[] | undefined;
  if (type === 'enum') {
    const optMatch = restPart.match(
      /(?:options|values|lựa chọn)\s*[:=]?\s*\[?([^\]\r\n)]+)\]?/i,
    );
    if (optMatch && optMatch[1]) {
      options = optMatch[1]
        .split(/[,/]+/)
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter((s) => s.length > 0);
    }
    if (!options || options.length === 0) {
      options = ['approved', 'rejected'];
      issues.push({
        code: 'ENUM_OPTIONS_DEFAULTED',
        targetId: id,
        message: `Field '${id}' is enum but no options were specified; defaulted to ['approved', 'rejected'].`,
        blocking: false,
      });
    }
  }

  return {
    id,
    type,
    required,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(options ? { options } : {}),
  };
}

function extractStepsAndTransitions(
  stepsNote: string | undefined,
  branchesNote: string | undefined,
  outputsNote: string | undefined,
  roles: readonly string[],
  fields: readonly BuilderFieldDefinition[],
  sourceRevisionId: string,
  stepsSegmentId: string,
  branchesSegmentId: string,
  outputsSegmentId: string,
  mappings: BuilderSourceMapping[],
  issues: BuilderOpenIssue[],
): {
  steps: BuilderStepDefinition[];
  transitions: BuilderTransitionDefinition[];
} {
  const steps: BuilderStepDefinition[] = [];
  const transitions: BuilderTransitionDefinition[] = [];

  const startStep: BuilderStepDefinition = { id: 'submitted', type: 'start' };
  steps.push(startStep);
  mappings.push({
    targetType: 'step',
    targetId: startStep.id,
    sourceRevisionId,
    segmentIds: [stepsSegmentId],
  });

  const acceptedEnd: BuilderStepDefinition = {
    id: 'accepted',
    type: 'end',
    endState: 'approved',
  };
  const declinedEnd: BuilderStepDefinition = {
    id: 'declined',
    type: 'end',
    endState: 'rejected',
  };

  const taskSteps: BuilderStepDefinition[] = [];
  if (stepsNote && stepsNote.trim()) {
    const lines = stepsNote.split(/[\r\n]+/);
    lines.forEach((line) => {
      const trimmed = line.trim().replace(/^[-*•]\s*/, '');
      if (!trimmed) return;
      const parsed = parseTaskStep(trimmed, roles, fields, issues);
      if (parsed) {
        taskSteps.push(parsed);
      }
    });
  }

  if (taskSteps.length === 0) {
    const defaultRole = roles[0] ?? 'manager';
    const decField = fields.find((f) => f.id.includes('decision'))?.id;
    const defaultTask: BuilderStepDefinition = {
      id: `${defaultRole}_review`,
      type: 'task',
      role: defaultRole,
      ...(decField ? { decisionField: decField } : {}),
      noSelfApproval: true,
    };
    taskSteps.push(defaultTask);
  }

  taskSteps.forEach((task) => {
    steps.push(task);
    mappings.push({
      targetType: 'step',
      targetId: task.id,
      sourceRevisionId,
      segmentIds: [stepsSegmentId],
    });
  });

  const branchLines = branchesNote
    ? branchesNote
        .split(/[\r\n]+/)
        .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
        .filter(Boolean)
    : [];

  const gateways: BuilderStepDefinition[] = [];

  if (branchLines.length > 0) {
    taskSteps.forEach((task) => {
      const gatewayId = `${task.id.replace(/_review$/, '')}_route`;
      const gatewayStep: BuilderStepDefinition = {
        id: gatewayId,
        type: 'gateway',
      };
      gateways.push(gatewayStep);
      steps.push(gatewayStep);
      mappings.push({
        targetType: 'step',
        targetId: gatewayStep.id,
        sourceRevisionId,
        segmentIds: [branchesSegmentId],
      });

      transitions.push({ from: task.id, to: gatewayId });
    });

    branchLines.forEach((line) => {
      const parsedTrans = parseBranchLine(
        line,
        gateways,
        taskSteps,
        fields,
        issues,
      );
      if (parsedTrans) {
        transitions.push(parsedTrans);
        mappings.push({
          targetType: 'transition',
          targetId: `${parsedTrans.from}->${parsedTrans.to}`,
          sourceRevisionId,
          segmentIds: [branchesSegmentId],
        });
      }
    });
  }

  if (transitions.length === 0) {
    let prev = startStep.id;
    taskSteps.forEach((task) => {
      transitions.push({ from: prev, to: task.id });
      mappings.push({
        targetType: 'transition',
        targetId: `${prev}->${task.id}`,
        sourceRevisionId,
        segmentIds: [stepsSegmentId],
      });
      prev = task.id;
    });
    transitions.push({ from: prev, to: acceptedEnd.id });
    mappings.push({
      targetType: 'transition',
      targetId: `${prev}->${acceptedEnd.id}`,
      sourceRevisionId,
      segmentIds: [stepsSegmentId],
    });
  } else {
    const firstTask = taskSteps[0];
    if (
      firstTask &&
      !transitions.some((t) => t.from === startStep.id && t.to === firstTask.id)
    ) {
      transitions.unshift({ from: startStep.id, to: firstTask.id });
      mappings.push({
        targetType: 'transition',
        targetId: `${startStep.id}->${firstTask.id}`,
        sourceRevisionId,
        segmentIds: [stepsSegmentId],
      });
    }
  }

  steps.push(acceptedEnd);
  steps.push(declinedEnd);
  mappings.push({
    targetType: 'step',
    targetId: acceptedEnd.id,
    sourceRevisionId,
    segmentIds: [outputsSegmentId],
  });
  mappings.push({
    targetType: 'step',
    targetId: declinedEnd.id,
    sourceRevisionId,
    segmentIds: [outputsSegmentId],
  });

  return { steps, transitions };
}

function parseTaskStep(
  line: string,
  roles: readonly string[],
  fields: readonly BuilderFieldDefinition[],
  issues: BuilderOpenIssue[],
): BuilderStepDefinition | undefined {
  const colonParts = line.split(':');
  const firstToken = colonParts[0]?.trim() ?? '';
  let id = sanitizeId(firstToken, '');

  const lowerLine = line.toLowerCase();

  let role: string | undefined = roles.find((r) => lowerLine.includes(r));
  if (!role) {
    if (lowerLine.includes('quản lý') || lowerLine.includes('quan ly')) {
      role = 'manager';
    } else if (
      lowerLine.includes('giám đốc') ||
      lowerLine.includes('giam doc')
    ) {
      role = 'director';
    } else if (lowerLine.includes('nhân sự') || lowerLine.includes('nhan su')) {
      role = 'hr';
    } else if (
      lowerLine.includes('nhân viên') ||
      lowerLine.includes('nhan vien')
    ) {
      role = 'employee';
    }
  }

  if (!id || id.length < 2) {
    id = role ? `${role}_review` : `task_${Math.floor(Math.random() * 1000)}`;
  }

  if (!role) {
    issues.push({
      code: 'TASK_MISSING_ROLE',
      targetId: id,
      message: `Task '${id}' does not have an assigned role.`,
      blocking: true,
    });
  }

  let decisionField: string | undefined;
  const decMatch = line.match(/decisionField\s*[:=]?\s*([a-z0-9_-]+)/i);
  if (decMatch && decMatch[1]) {
    decisionField = decMatch[1].toLowerCase();
  } else if (role) {
    const candidate = fields.find(
      (f) => f.id === `${role}_decision` || f.id.includes('decision'),
    )?.id;
    if (candidate) decisionField = candidate;
  }

  return {
    id,
    type: 'task',
    ...(role ? { role } : {}),
    ...(decisionField ? { decisionField } : {}),
    noSelfApproval: true,
  };
}

function parseBranchLine(
  line: string,
  gateways: readonly BuilderStepDefinition[],
  taskSteps: readonly BuilderStepDefinition[],
  fields: readonly BuilderFieldDefinition[],
  issues: BuilderOpenIssue[],
): BuilderTransitionDefinition | undefined {
  const arrowMatch = line.match(/^(.+?)\s*(?:->|=>|to)\s*([a-z0-9_-]+)$/i);
  if (!arrowMatch || !arrowMatch[1] || !arrowMatch[2]) {
    return undefined;
  }

  const condText = arrowMatch[1].trim();
  const toStep = arrowMatch[2].trim().toLowerCase();

  const comparisons: BuilderComparison[] = [];
  const parts = condText.split(/\s+(?:and|AND|&&|và)\s+/);

  for (const part of parts) {
    const comp = parseComparison(part, fields, issues);
    if (comp) {
      comparisons.push(comp);
    }
  }

  if (comparisons.length === 0) {
    return undefined;
  }

  const decComp = comparisons.find((c) => c.field.includes('decision'));
  let fromGateway = gateways[0]?.id ?? 'manager_route';

  if (decComp) {
    const prefix = decComp.field.replace(/_decision$/, '');
    const matched = gateways.find((g) => g.id.startsWith(prefix));
    if (matched) {
      fromGateway = matched.id;
    }
  }

  const condition: BuilderCondition = { all: comparisons };
  return {
    from: fromGateway,
    to: toStep,
    when: condition,
  };
}

function parseComparison(
  text: string,
  fields: readonly BuilderFieldDefinition[],
  issues: BuilderOpenIssue[],
): BuilderComparison | undefined {
  const trimmed = text.trim();

  const match = trimmed.match(
    /^([a-z0-9_-]+)\s*(=|==|eq|<|lt|>=|gte)\s*([a-z0-9_.-]+)$/i,
  );
  if (match && match[1] && match[2] && match[3]) {
    const fieldId = match[1].toLowerCase();
    const rawOp = match[2].toLowerCase();
    const rawVal = match[3].toLowerCase();

    let op: BuilderComparisonOperator = 'eq';
    if (rawOp === '<' || rawOp === 'lt') {
      op = 'lt';
    } else if (rawOp === '>=' || rawOp === 'gte') {
      op = 'gte';
    }

    let value: BuilderComparisonValue = rawVal;
    if (/^\d+$/.test(rawVal)) {
      value = parseInt(rawVal, 10);
    } else if (rawVal === 'true' || rawVal === 'false') {
      value = rawVal === 'true';
    }

    const fieldExists = fields.some((f) => f.id === fieldId);
    if (!fieldExists) {
      issues.push({
        code: 'UNKNOWN_CONDITION_FIELD',
        targetId: fieldId,
        message: `Condition references field '${fieldId}' which is not defined in inputs.`,
        blocking: true,
      });
    }

    return { field: fieldId, op, value };
  }

  if (/^approved$/i.test(trimmed)) {
    const decField =
      fields.find((f) => f.id.includes('decision'))?.id ?? 'decision';
    return { field: decField, op: 'eq', value: 'approved' };
  }
  if (/^rejected$/i.test(trimmed)) {
    const decField =
      fields.find((f) => f.id.includes('decision'))?.id ?? 'decision';
    return { field: decField, op: 'eq', value: 'rejected' };
  }

  return undefined;
}
