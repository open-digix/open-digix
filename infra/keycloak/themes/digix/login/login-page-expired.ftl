<#-- SPDX-License-Identifier: Apache-2.0 -->
<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
<#if section = "header">
  ${msg("pageExpiredTitle")}
<#elseif section = "form">
  <div class="view-in">
    <h1 class="title">${msg("pageExpiredTitle")}</h1>
    <p class="lead">${msg("pageExpiredMsg1")}</p>
    <a id="loginRestartLink" href="${url.loginRestartFlowUrl}" class="btn">
      <span class="label">${msg("doClickHere")}</span>
      <span class="arrow" aria-hidden="true">→</span>
    </a>
  </div>
</#if>
</@layout.registrationLayout>
