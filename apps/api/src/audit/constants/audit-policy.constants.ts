/** Các hành động cần ghi vào nhật ký kiểm toán. */
export const AuditAction = {
  // Người dùng đăng nhập.
  AUTH_LOGIN: 'auth.login',
  // Người dùng đăng xuất.
  AUTH_LOGOUT: 'auth.logout',
  // Yêu cầu xác thực bị từ chối.
  AUTH_DENIED: 'auth.denied',
  // Yêu cầu truy cập tài nguyên bị từ chối.
  ACCESS_DENIED: 'access.denied',
  // Vai trò được gán cho thành viên.
  ROLE_ASSIGNED: 'rbac.role.assigned',
  // Vai trò bị thu hồi khỏi thành viên.
  ROLE_REVOKED: 'rbac.role.revoked',
  // Ứng dụng mới được tạo.
  APP_CREATED: 'application.created',
  // Cấu hình ứng dụng trong builder được cập nhật.
  CONFIG_UPDATED: 'builder.config.updated',
  // Phiên bản ứng dụng được xuất bản.
  APP_PUBLISHED: 'app.published',
  // Một bước trong quy trình được ra quyết định.
  WORKFLOW_DECIDED: 'workflow.decided',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

/** Kết quả xử lý của hành động được ghi nhận. */
export const AuditResult = {
  // Hành động hoàn tất thành công.
  SUCCESS: 'success',
  // Hành động bị từ chối theo chính sách hoặc quyền truy cập.
  DENIED: 'denied',
  // Hành động thất bại do lỗi xử lý.
  FAILED: 'failed',
} as const;

export type AuditResultType = (typeof AuditResult)[keyof typeof AuditResult];

/**
 * Key metadata được phép lưu theo từng action.
 * Lưu ý: KHÔNG thêm token, password, secret, cookie, raw body, hay PII không cần thiết.
 */
export const METADATA_ALLOWLIST: Record<string, readonly string[]> = {
  // Các key mặc định cho action không có cấu hình riêng.
  default: ['correlationId', 'reasonCode', 'ip', 'userAgent', 'path', 'method'],
  // Chỉ lưu thông tin nhà cung cấp đăng nhập và ngữ cảnh cần thiết.
  [AuditAction.AUTH_LOGIN]: ['correlationId', 'provider', 'reasonCode', 'ip'],
  // Chỉ lưu mã liên kết yêu cầu và IP khi đăng xuất.
  [AuditAction.AUTH_LOGOUT]: ['correlationId', 'ip'],
  // Lưu lý do và ngữ cảnh của yêu cầu xác thực bị từ chối.
  [AuditAction.AUTH_DENIED]: [
    'correlationId',
    'reasonCode',
    'ip',
    'path',
    'method',
  ],
  // Lưu quyền yêu cầu, tài nguyên và ngữ cảnh truy cập bị từ chối.
  [AuditAction.ACCESS_DENIED]: [
    'correlationId',
    'reasonCode',
    'requiredPermission',
    'resourceType',
    'resourceId',
    'path',
    'method',
  ],
  // Lưu thành viên, vai trò và phạm vi được gán.
  [AuditAction.ROLE_ASSIGNED]: [
    'correlationId',
    'targetMembershipId',
    'roleCode',
    'scope',
  ],
  // Lưu thành viên, vai trò và phạm vi bị thu hồi.
  [AuditAction.ROLE_REVOKED]: [
    'correlationId',
    'targetMembershipId',
    'roleCode',
    'scope',
  ],
  [AuditAction.APP_CREATED]: ['appId', 'source', 'correlationId'],
  // Lưu cấu hình, phiên bản và các key đã thay đổi.
  [AuditAction.CONFIG_UPDATED]: [
    'correlationId',
    'appId',
    'configId',
    'version',
    'changedKeys',
  ],
  // Lưu ứng dụng, phiên bản và môi trường xuất bản.
  [AuditAction.APP_PUBLISHED]: [
    'correlationId',
    'appId',
    'versionId',
    'version',
    'environment',
  ],
  // Lưu bước quy trình, quyết định và mã lý do.
  [AuditAction.WORKFLOW_DECIDED]: [
    'correlationId',
    'workflowId',
    'instanceId',
    'stepId',
    'decision',
    'reasonCode',
  ],
};
