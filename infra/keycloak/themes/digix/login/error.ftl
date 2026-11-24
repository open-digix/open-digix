<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
<#if section = "header">
  ${kcSanitize(msg("errorTitle"))?no_esc}
<#elseif section = "form">
  <div class="view-in">
    <h1 class="title">${kcSanitize(msg("errorTitle"))?no_esc}</h1>
    <div class="alert alert-error" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 7v6M12 17h.01"/>
      </svg>
      <span>${kcSanitize(message.summary)?no_esc}</span>
    </div>

    <#if skipLink??>
    <#else>
      <#if (client.baseUrl)?has_content>
        <p class="foot"><a href="${client.baseUrl}" class="btn btn-ghost">${msg("backToApplication")}</a></p>
      <#else>
        <p class="foot"><a href="${url.loginUrl}" class="btn btn-ghost">${msg("backToLogin")}</a></p>
      </#if>
    </#if>
  </div>
</#if>
</@layout.registrationLayout>
