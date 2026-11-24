<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
<#if section = "title">
  ${msg("loginAccountTitle")}
<#elseif section = "form">
  <div class="view-in">
    <p class="eyebrow">Chào mừng trở lại</p>
    <h1 class="title">${msg("loginAccountTitle")}</h1>
    <p class="lead">Dùng tài khoản doanh nghiệp của bạn. Một lần đăng nhập cho toàn bộ không gian làm việc.</p>

    <form id="kc-form-login" action="${url.loginAction}" method="post" novalidate>
      <#if !usernameHidden??>
        <div class="field<#if messagesPerField.existsError('username')> has-error</#if>">
          <label for="username">${msg("usernameOrEmail")}</label>
          <div class="input-wrap">
            <input id="username" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" placeholder="vd: ten.dang.nhap" aria-invalid="<#if messagesPerField.existsError('username')>true<#else>false</#if>"<#if messagesPerField.existsError('username')> aria-describedby="username-err"</#if>>
          </div>
          <#if messagesPerField.existsError('username')>
            <p class="field-error" id="username-err" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</p>
          </#if>
        </div>
      </#if>

      <div class="field<#if messagesPerField.existsError('password')> has-error</#if>">
        <label for="password">${msg("password")}</label>
        <div class="input-wrap">
          <input id="password" name="password" type="password" class="with-toggle" autocomplete="current-password" placeholder="••••••••" aria-invalid="<#if messagesPerField.existsError('password')>true<#else>false</#if>" aria-describedby="<#if messagesPerField.existsError('password')>password-err </#if>caps-hint">
          <button type="button" id="toggle-password" class="toggle-pass" aria-label="${msg('showPassword')}" aria-pressed="false">
            <svg class="eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
        <p class="caps" id="caps-hint" hidden>Caps Lock đang bật.</p>
        <#if messagesPerField.existsError('password')>
          <p class="field-error" id="password-err" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}</p>
        </#if>
      </div>

      <div class="row">
        <#if realm.rememberMe && !usernameHidden??>
          <label class="check">
            <input type="checkbox" name="rememberMe"<#if login.rememberMe??> checked</#if>> ${msg("rememberMe")}
          </label>
        <#else>
          <span></span>
        </#if>
        <#if realm.resetPasswordAllowed>
          <a href="${url.loginResetCredentialsUrl}" class="link">${msg("doForgotPassword")}</a>
        </#if>
      </div>

      <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth?has_content && auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
      <button id="kc-login" class="btn" type="submit">
        <span class="spinner" aria-hidden="true"></span>
        <span class="label">${msg("doLogIn")}</span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>
    </form>
  </div>
</#if>
</@layout.registrationLayout>
