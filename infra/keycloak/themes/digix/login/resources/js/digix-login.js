/* SPDX-License-Identifier: Apache-2.0 */
/* Tương tác giao diện đăng nhập DigiX (Keycloak login theme). */

(function () {
  'use strict';

  // 1. Trạng thái đang gửi: chỉ khóa NÚT sau khi submit (không preventDefault, không disable inputs)
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var submitBtn = (e && e.submitter) ? e.submitter : form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && (submitBtn.getAttribute('name') === 'cancel-aia' || submitBtn.classList.contains('btn-secondary'))) {
        return;
      }
      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        // Khóa nút trên tick tiếp theo để form gửi request bình thường
        setTimeout(function () {
          submitBtn.disabled = true;
        }, 0);
      }
    });
  });

  // 2. Cảnh báo Caps Lock khi gõ mật khẩu
  var passwordInputs = document.querySelectorAll('input[type="password"]');
  var capsHint = document.getElementById('caps-hint');
  if (passwordInputs.length && capsHint) {
    passwordInputs.forEach(function (input) {
      function checkCaps(e) {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
          capsHint.hidden = false;
        } else {
          capsHint.hidden = true;
        }
      }
      input.addEventListener('keyup', checkCaps);
      input.addEventListener('keydown', checkCaps);
      input.addEventListener('blur', function () {
        capsHint.hidden = true;
      });
    });
  }

  // 3. Hiệu ứng rung thẻ 1 lần khi có lỗi và tự động focus ô mật khẩu
  var isReducedMotion = false;
  try {
    isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var alertBox = document.getElementById('kc-alert');
  var hasAlert = alertBox && !alertBox.hidden && alertBox.textContent.trim().length > 0;

  var hasFieldError = false;
  var fieldErrors = document.querySelectorAll('.field-error');
  for (var i = 0; i < fieldErrors.length; i++) {
    if (fieldErrors[i].textContent.trim().length > 0) {
      hasFieldError = true;
      break;
    }
  }

  var card = document.querySelector('.card');
  if ((hasAlert || hasFieldError) && card && !isReducedMotion) {
    card.classList.add('shake');
  }

  if (hasAlert || hasFieldError) {
    var passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }

  // 4. Nút bật/tắt hiển thị mật khẩu
  document.querySelectorAll('.toggle-pass').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inputWrap = btn.closest('.input-wrap');
      var input = inputWrap ? inputWrap.querySelector('input') : null;
      if (!input) return;
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.classList.toggle('is-on', isPassword);
      btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      btn.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      input.focus();
    });
  });

  // 5. Độ mạnh mật khẩu và danh sách yêu cầu (cho màn login-update-password)
  function scorePassword(v) {
    var r = {
      len: v.length >= 8,
      up: /[A-ZÀ-Ỹ]/.test(v),
      num: /\d/.test(v),
      sym: /[^\w\sÀ-ỹ]/.test(v)
    };
    var n = Object.keys(r).filter(function (k) { return r[k]; }).length;
    return { r: r, n: v ? Math.max(1, n) : 0 };
  }
  var TXT = ['—', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  var passNew = document.getElementById('password-new');
  if (passNew) {
    passNew.addEventListener('input', function () {
      var s = scorePassword(passNew.value);
      var m = document.getElementById('meter');
      if (m) m.dataset.level = s.n;
      var t = document.getElementById('meter-text');
      if (t) t.textContent = TXT[s.n];
      var ruleItems = document.querySelectorAll('#rules li');
      ruleItems.forEach(function (li) {
        var req = li.getAttribute('data-r');
        if (req && s.r[req] !== undefined) {
          li.classList.toggle('ok', !!s.r[req]);
        }
      });
    });
  }

  // 6. Đếm ngược gửi lại email (khóa 60 giây) cho màn Kiểm tra email
  var resendBtns = document.querySelectorAll('.js-resend');
  if (resendBtns.length) {
    resendBtns.forEach(function (b) {
      var timer;
      function startCountdown() {
        var left = 60;
        b.disabled = true;
        clearInterval(timer);
        b.textContent = 'Gửi lại sau ' + left + ' giây';
        timer = setInterval(function () {
          left -= 1;
          if (left <= 0) {
            clearInterval(timer);
            b.disabled = false;
            b.textContent = 'Gửi lại';
          } else {
            b.textContent = 'Gửi lại sau ' + left + ' giây';
          }
        }, 1000);
      }
      startCountdown();
      b.addEventListener('click', startCountdown);
    });
  }
})();
