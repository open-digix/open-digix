<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
<#if section = "header">
  ${msg("emailForgotTitle")}
<#elseif section = "form">
  <div class="stepper" aria-label="Tiến trình khôi phục">
    <div class="st on" data-st="1"><b>1</b>Tài khoản</div>
    <div class="bar" data-bar="1"></div>
    <div class="st" data-st="2"><b>2</b>Kiểm tra email</div>
    <div class="bar" data-bar="2"></div>
    <div class="st" data-st="3"><b>3</b>Mật khẩu mới</div>
  </div>

  <div class="view-in">
    <h1 class="title">${msg("emailForgotTitle")}</h1>
    <p class="lead">${msg("emailInstruction")}</p>

    <form id="kc-reset-password-form" action="${url.loginAction}" method="post" novalidate>
      <div class="field<#if messagesPerField.existsError('username')> has-error</#if>">
        <label for="username">${msg("usernameOrEmail")}</label>
        <div class="input-wrap">
          <input id="username" name="username" value="${(auth.attemptedUsername!'')}" type="text" autofocus autocomplete="username" placeholder="vd: ten.dang.nhap" aria-invalid="<#if messagesPerField.existsError('username')>true<#else>false</#if>"<#if messagesPerField.existsError('username')> aria-describedby="username-err"</#if>>
        </div>
        <#if messagesPerField.existsError('username')>
          <p class="field-error" id="username-err" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</p>
        </#if>
      </div>

      <button class="btn" type="submit">
        <span class="spinner" aria-hidden="true"></span>
        <span class="label">${msg("doSendResetInstructions")}</span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>
    </form>

    <p class="foot"><a href="${url.loginUrl}" class="link">← ${msg("backToLogin")}</a></p>
  </div>
</#if>
</@layout.registrationLayout>
