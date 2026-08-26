document.addEventListener("DOMContentLoaded", () => {
  // 1. Lấy dữ liệu từ localStorage ('userList')
  function getUserList() {
    try {
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch {
      return [];
    }
  }

  // Tạo usercode tịnh tiến TR001, TR002... đồng bộ toàn hệ thống
  function generateUserCode(userList) {
    if (!userList || userList.length === 0) return "TR001";

    let maxNumber = 0;
    userList.forEach((u) => {
      const code = (u.usercode || u.userCode || "").trim().toUpperCase();
      const match = code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    return `TR${String(maxNumber + 1).padStart(3, "0")}`;
  }

  // 2. Lấy các phần tử DOM
  const signupForm = document.querySelector(".sign-up-form");
  const emailInput = document.querySelector("#email");
  const usernameInput = document.querySelector("#username");
  const passwordInput = document.querySelector("#password");

  const msgContainer = document.querySelector("#msg");
  const signupValidation = document.querySelector("#sign-up-validation");
  const userBlankMsg = document.querySelector(".username-cannot-blank");
  const emailBlankMsg = document.querySelector(".email-cannot-blank");
  const passBlankMsg = document.querySelector(".password-cannot-blank");

  const signupToast = document.querySelector("#sign-up-toast");
  const signupError = document.querySelector("#sign-up-error");
  const emailExistMsg = document.querySelector(".email-exist");
  const emailErrorMsg = document.querySelector(".email-error");

  const passwordMinLengthMsg = document.querySelector(".password-min-length-error");
  const passwordNumberRequiredMsg = document.querySelector(".password-number-required-error");
  const passwordCaseMsg = document.querySelector(".password-uppercase-lowercase-error");
  const closeBtn = document.querySelector(".close-btn");

  const eye = document.querySelector(".fa-eye");
  const eyeSlash = document.querySelector(".fa-eye-slash");

  // 3. Hàm reset thông báo lỗi
  function resetErrorMsg() {
    if (msgContainer) msgContainer.classList.remove("show");

    const elementsToHide = [
      signupValidation,
      signupToast,
      signupError,
      userBlankMsg,
      emailBlankMsg,
      passBlankMsg,
      emailExistMsg,
      emailErrorMsg,
      passwordMinLengthMsg,
      passwordNumberRequiredMsg,
      passwordCaseMsg,
    ];

    elementsToHide.forEach((el) => {
      if (el) el.classList.add("hidden");
    });
  }

  // 4. Hàm kiểm tra rỗng
  function isEmpty() {
    const emailVal = emailInput.value.trim();
    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    let hasEmpty = false;

    if (!usernameVal) {
      if (userBlankMsg) userBlankMsg.classList.remove("hidden");
      hasEmpty = true;
    }
    if (!emailVal) {
      if (emailBlankMsg) emailBlankMsg.classList.remove("hidden");
      hasEmpty = true;
    }
    if (!passwordVal) {
      if (passBlankMsg) passBlankMsg.classList.remove("hidden");
      hasEmpty = true;
    }

    if (hasEmpty) {
      if (signupValidation) signupValidation.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
    }

    return hasEmpty;
  }

  // 5. Hàm kiểm tra email hợp lệ
  function isValidationEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());

    if (!isValid) {
      if (emailErrorMsg) emailErrorMsg.classList.remove("hidden");
      if (signupError) signupError.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
    }
    return isValid;
  }

  // 6. Hàm kiểm tra email trùng
  function isExistEmail(email) {
    const userList = getUserList();
    const emailExists = userList.some(
      (user) => (user.email || "").toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      if (emailExistMsg) emailExistMsg.classList.remove("hidden");
      if (signupError) signupError.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
    }
    return emailExists;
  }

  // 7. Hàm kiểm tra độ mạnh mật khẩu
  function isPasswordValid(password) {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password);

    let isValid = true;

    if (!minLength) {
      if (passwordMinLengthMsg) passwordMinLengthMsg.classList.remove("hidden");
      isValid = false;
    }
    if (!hasNumber) {
      if (passwordNumberRequiredMsg) passwordNumberRequiredMsg.classList.remove("hidden");
      isValid = false;
    }
    if (!hasUpperAndLower) {
      if (passwordCaseMsg) passwordCaseMsg.classList.remove("hidden");
      isValid = false;
    }

    if (!isValid) {
      if (signupError) signupError.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
    }

    return isValid;
  }

  // 8. Sự kiện submit form
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      resetErrorMsg();

      const emailVal = emailInput.value.trim();
      const usernameVal = usernameInput.value.trim();
      const passwordVal = passwordInput.value;

      if (isEmpty()) return;
      if (!isValidationEmail(emailVal)) return;
      if (isExistEmail(emailVal)) return;
      if (!isPasswordValid(passwordVal)) return;

      const userList = getUserList();

      // Cấu trúc user đồng bộ hoàn toàn với dashboard và edit
      const newUser = {
        usercode: generateUserCode(userList),
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
        role: "user",
        birthday: "",
        status: "Active",
        description: ""
      };

      userList.push(newUser);
      localStorage.setItem("userList", JSON.stringify(userList));

      if (signupToast) signupToast.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");

      setTimeout(() => {
        window.location.href = "./sign-in.html";
      }, 1000);
    });
  }

  // 9. Hiện / Ẩn mật khẩu
  if (eye && eyeSlash && passwordInput) {
    eye.addEventListener("click", () => {
      passwordInput.type = "text";
      eye.classList.add("hidden");
      eyeSlash.classList.remove("hidden");
    });

    eyeSlash.addEventListener("click", () => {
      passwordInput.type = "password";
      eyeSlash.classList.add("hidden");
      eye.classList.remove("hidden");
    });
  }

  // 10. Nút đóng popup lỗi
  if (closeBtn) {
    closeBtn.addEventListener("click", resetErrorMsg);
  }

  // 11. Tắt lỗi khi nhập lại
  [emailInput, usernameInput, passwordInput].forEach((input) => {
    if (input) {
      input.addEventListener("input", resetErrorMsg);
    }
  });
});