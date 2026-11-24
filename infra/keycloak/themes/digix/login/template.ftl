<#-- SPDX-License-Identifier: Apache-2.0 -->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!doctype html>
<html lang="${(locale.currentLanguageTag)!'vi'}" class="${properties.kcHtmlClass!}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${msg("loginTitle", (realm.displayName!'DigiX'))}</title>
  <link rel="icon" href="${url.resourcesPath}/img/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${url.resourcesPath}/css/digix.css">
</head>
<body>
  <aside class="side">
    <div class="brandrow enter">
      <img src="${url.resourcesPath}/img/digix-logo-dark.svg" alt="DigiX Lab" width="94" height="40">
    </div>
    <div class="pitch">
      <h2 class="s1">Quy trình rõ ràng.<br>Công việc liền mạch.</h2>
      <p class="s2">Thiết kế quy trình bằng mô tả, kiểm tra trước khi xuất bản, vận hành và truy vết trên cùng một nền tảng mở.</p>
      <div class="steps s3" aria-hidden="true">
        <div class="step"><b>01</b><span>Thiết kế</span></div>
        <i>→</i>
        <div class="step"><b>02</b><span>Kiểm tra</span></div>
        <i>→</i>
        <div class="step"><b>03</b><span>Vận hành</span></div>
      </div>
    </div>
    <div class="side-foot">
      <small>DigiX Lab · Phần mềm nguồn mở</small>
      <#if (client.baseUrl)?has_content>
        <a href="${client.baseUrl}" class="side-back-link">← Về trang giới thiệu DigiX</a>
      </#if>
    </div>
  </aside>

  <main class="main">
    <section class="card enter-2" aria-label="${kcSanitize(title!'Đăng nhập')?no_esc}">
      <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div id="kc-alert" class="alert alert-${message.type}" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 7v6M12 17h.01"/>
          </svg>
          <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
      </#if>

      <#nested "form">

      <#if displayInfo>
        <#nested "info">
      </#if>

      <#if (client.baseUrl)?has_content>
        <p class="foot mobile-back"><a href="${client.baseUrl}" class="link">← Về trang giới thiệu DigiX</a></p>
      </#if>
    </section>
  </main>

  <script src="${url.resourcesPath}/js/digix-login.js"></script>
</body>
</html>
</#macro>
