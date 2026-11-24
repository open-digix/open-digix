<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
<#if section = "header">
  ${msg("updatePasswordTitle")}
<#elseif section = "form">
  <div class="view-in">
    <p class="eyebrow">Bảo mật tài khoản</p>
    <h1 class="title">${msg("updatePasswordTitle")}</h1>
    <p class="lead">Nhập mật khẩu mới cho tài khoản của bạn.</p>

    <form id="kc-passwd-update-form" action="${url.loginAction}" method="post" novalidate>
      <div class="field<#if messagesPerField.existsError('password')> has-error</#if>">
        <label for="password-new">${msg("passwordNew")}</label>
        <div class="input-wrap">
          <input id="password-new" name="password-new" type="password" class="with-toggle" autofocus autocomplete="new-password" placeholder="••••••••" aria-invalid="<#if messagesPerField.existsError('password')>true<#else>false</#if>"<#if messagesPerField.existsError('password')> aria-describedby="password-new-err"</#if>>
          <button type="button" class="toggle-pass" aria-label="${msg('showPassword')}" aria-pressed="false">
            <svg class="eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
        <#if messagesPerField.existsError('password')>
          <p class="field-error" id="password-new-err" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}</p>
        </#if>
      </div>

      <div class="field<#if messagesPerField.existsError('password-confirm')> has-error</#if>">
        <label for="password-confirm">${msg("passwordConfirm")}</label>
        <div class="input-wrap">
          <input id="password-confirm" name="password-confirm" type="password" class="with-toggle" autocomplete="new-password" placeholder="••••••••" aria-invalid="<#if messagesPerField.existsError('password-confirm')>true<#else>false</#if>"<#if messagesPerField.existsError('password-confirm')> aria-describedby="password-confirm-err"</#if>>
          <button type="button" class="toggle-pass" aria-label="${msg('showPassword')}" aria-pressed="false">
            <svg class="eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
        <#if messagesPerField.existsError('password-confirm')>
          <p class="field-error" id="password-confirm-err" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}</p>
        </#if>
      </div>

      <div class="row">
        <label class="check" for="logout-sessions">
          <input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" checked> ${msg("logoutOtherSessions")}
        </label>
      </div>

      <#if isAppInitiatedAction??>
        <div class="btn-group">
          <button class="btn" type="submit">
            <span class="spinner" aria-hidden="true"></span>
            <span class="label">${msg("doSavePassword")}</span>
            <span class="arrow" aria-hidden="true">→</span>
          </button>
          <button class="btn btn-secondary" type="submit" name="cancel-aia" value="true" formnovalidate>${msg("doCancel")}</button>
        </div>
      <#else>
        <button class="btn" type="submit">
          <span class="spinner" aria-hidden="true"></span>
          <span class="label">${msg("doSavePassword")}</span>
          <span class="arrow" aria-hidden="true">→</span>
        </button>
      </#if>
    </form>
  </div>
</#if>
</@layout.registrationLayout>
