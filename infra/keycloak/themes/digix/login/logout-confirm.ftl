<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout hideBackLink=true; section>
<#if section = "header">
  ${msg("logoutConfirmTitle")}
<#elseif section = "form">
  <div class="view-in">
    <h1 class="title">${msg("logoutConfirmTitle")}</h1>
    <p class="lead">${msg("logoutConfirmHeader")}</p>

    <form class="form-actions" action="${url.logoutConfirmAction}" method="POST">
      <input type="hidden" name="session_code" value="${logoutConfirm.code}">
      <button id="kc-logout" class="btn" type="submit" name="confirmLogout">
        <span class="spinner" aria-hidden="true"></span>
        <span class="label">${msg("doLogout")}</span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>
    </form>

    <#if !logoutConfirm.skipLink>
      <#if (client.baseUrl)?has_content>
        <p class="foot"><a href="${client.baseUrl}" class="link">← ${msg("backToApplication")}</a></p>
      <#else>
        <p class="foot"><a href="${url.loginUrl}" class="link">← ${msg("backToLogin")}</a></p>
      </#if>
    </#if>
  </div>
</#if>
</@layout.registrationLayout>
