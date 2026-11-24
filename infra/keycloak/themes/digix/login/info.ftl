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
  <div class="success view-in">
    <svg class="tick" viewBox="0 0 64 64" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="32" cy="32" r="28"/>
      <path d="M20 33l8 8 16-17"/>
    </svg>
    <h1 class="title">
      <#if messageHeader??>
        ${kcSanitize(msg("${messageHeader}"))?no_esc}
      <#else>
        Thông báo
      </#if>
    </h1>
    <p class="lead">${kcSanitize(message.summary)?no_esc}</p>

    <#if skipLink??>
    <#else>
      <#if pageRedirectUri?has_content>
        <p class="foot"><a href="${pageRedirectUri}" class="btn btn-ghost">${msg("backToApplication")}</a></p>
      <#elseif actionUri?has_content>
        <p class="foot"><a href="${actionUri}" class="btn">${msg("proceedWithAction")}</a></p>
      <#elseif (client.baseUrl)?has_content>
        <p class="foot"><a href="${client.baseUrl}" class="btn btn-ghost">${msg("backToApplication")}</a></p>
      <#else>
        <p class="foot"><a href="${url.loginUrl}" class="btn btn-ghost">${msg("backToLogin")}</a></p>
      </#if>
    </#if>
  </div>
</#if>
</@layout.registrationLayout>
