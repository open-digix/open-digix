<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
<#if section = "header">
  <#if messageHeader??>
    ${kcSanitize(msg("${messageHeader}"))?no_esc}
  <#else>
    ${message.summary}
  </#if>
<#elseif section = "form">
  <#assign summaryText = (message.summary!'')?lower_case>
  <#assign isEmailSent = (summaryText?contains("email") || summaryText?contains("hướng dẫn") || (messageHeader?? && messageHeader?lower_case?contains("email")))>
  <#assign isPasswordDone = (summaryText?contains("mật khẩu") || (messageHeader?? && messageHeader?lower_case?contains("password")))>

  <#if isEmailSent>
    <div class="stepper" aria-label="Tiến trình khôi phục">
      <div class="st done" data-st="1"><b>✓</b>Tài khoản</div>
      <div class="bar done" data-bar="1"></div>
      <div class="st on" data-st="2"><b>2</b>Kiểm tra email</div>
      <div class="bar" data-bar="2"></div>
      <div class="st" data-st="3"><b>3</b>Mật khẩu mới</div>
    </div>

    <div class="view-in">
      <div class="mail-ill">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="m3 7 9 6 9-6"/>
        </svg>
      </div>
      <h1 class="title">Kiểm tra email</h1>
      <p class="lead">Liên kết đặt lại mật khẩu đã được gửi tới email của bạn (nếu tài khoản tồn tại). Liên kết hết hạn sau <b>5 phút</b>.</p>
      <ul class="tips">
        <li>Kiểm tra cả thư mục Spam hoặc Thư rác.</li>
        <li>Bấm liên kết trong email để sang bước 3 (đặt mật khẩu mới).</li>
      </ul>
      <p class="resend">Chưa nhận được? <button type="button" class="js-resend">Gửi lại</button></p>
      <p class="foot"><a href="${(url.loginResetCredentialsUrl)!url.loginUrl}" class="link">← Nhập lại tài khoản</a></p>
    </div>
  <#else>
    <div class="success view-in">
      <svg class="tick" viewBox="0 0 64 64" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="32" cy="32" r="28"/>
        <path d="M20 33l8 8 16-17"/>
      </svg>
      <h1 class="title">
        <#if isPasswordDone>
          Đã đổi mật khẩu
        <#elseif messageHeader??>
          ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
          Thông báo
        </#if>
      </h1>
      <p class="lead">
        <#if isPasswordDone>
          Bạn có thể đăng nhập bằng mật khẩu mới.
        <#else>
          ${kcSanitize(message.summary)?no_esc}
        </#if>
      </p>

      <#if skipLink??>
      <#else>
        <#if pageRedirectUri?has_content>
          <p class="foot"><a href="${pageRedirectUri}" class="btn btn-ghost">${msg("backToApplication")}</a></p>
        <#elseif actionUri?has_content>
          <p class="foot"><a href="${actionUri}" class="btn">${msg("proceedWithAction")}</a></p>
        <#elseif (client.baseUrl)?has_content>
          <p class="foot"><a href="${client.baseUrl}" class="btn btn-ghost">${msg("backToApplication")}</a></p>
        <#else>
          <p class="foot"><a href="${url.loginUrl}" class="btn">${msg("doLogIn")}</a></p>
        </#if>
      </#if>
    </div>
  </#if>
</#if>
</@layout.registrationLayout>
