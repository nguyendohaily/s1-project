document.addEventListener("DOMContentLoaded", () => {
  // 1. Lấy dữ liệu từ localStorage
  function getStoredUsers() {
    try {
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch {
      return [];
    }
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  }

  let users = getStoredUsers();
  let currentUser = getCurrentUser();

  // 2. Lấy các phần tử DOM cần thiết
  const form = document.querySelector("#add-new-user-form");
  const userCodeInput = document.querySelector("#user-code");
  const usernameInput = document.querySelector("#username");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const roleSelect = document.querySelector("#role");
  const dobInput = document.querySelector("#dob");
  const radioStatusList = document.querySelectorAll('input[name="status"]');
  const descriptionInput = document.querySelector(".description-text-input");

  const eyeIcon = document.querySelector(".fa-eye");
  const eyeSlashIcon = document.querySelector(".fa-eye-slash");
  const backBtn = document.querySelector(".back-btn");

  const msgBox = document.querySelector("#msg");
  const addToast = document.querySelector("#add-toast");
  const addError = document.querySelector("#add-error");
  const errEmpty = document.querySelector(".email-username-password-empty");
  const errEmailExist = document.querySelector(".email-exist");
  const errEmailFormat = document.querySelector(".email-error");
  const errPassMinLength = document.querySelector(".password-min-length-error");
  const errPassNumber = document.querySelector(".password-number-required-error");
  const errPassCase = document.querySelector(".password-uppercase-lowercase-error");
  const errRole = document.querySelector(".role-not-admin");

  // 13. Hàm tạo usercode tăng dần TR001, TR002, TR003...
  function uniqueUsercode() {
    if (!users || users.length === 0) {
      return "TR001";
    }

    let maxNumber = 0;
    users.forEach((u) => {
      const code = (u.usercode || "").trim().toUpperCase();
      // Tách lấy phần số đằng sau tiền tố (TR, U, hoặc chuỗi số thuần)
      const match = code.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    return `TR${String(nextNumber).padStart(3, "0")}`;
  }

  // Gán usercode ngay khi mở trang
  let generatedCode = uniqueUsercode();
  if (userCodeInput) {
    userCodeInput.value = generatedCode;
  }

  // 3. Hàm lấy giá trị radio đang chọn
  function getValueRadio() {
    for (const radio of radioStatusList) {
      if (radio.checked) return radio.value;
    }
    return "Active";
  }

  // 4. Hàm kiểm tra rỗng
  function isEmpty(email, username, password) {
    return !email || !username || !password;
  }

  // 5. Hàm kiểm tra định dạng email
  function isValidationEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 6. Hàm kiểm tra email đã tồn tại
  function isExistEmail(email) {
    return users.some(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
  }

  // 7. Hàm kiểm tra mật khẩu hợp lệ
  function isPasswordValid(password) {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasUpperAndLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);

    if (!hasMinLength) return "min_length";
    if (!hasNumber) return "number_required";
    if (!hasUpperAndLower) return "case_required";
    return "valid";
  }

  // 8. Hàm kiểm tra quyền Admin (isAdmin)
  function isAdmin() {
    return true; // Bỏ chặn tạm thời để bạn thêm user bình thường
  }

  // 9. Hàm reset thông báo lỗi
  function resetErrorMsg() {
    if (msgBox) msgBox.classList.remove("show");
    if (addError) addError.classList.add("hidden");
    if (addToast) addToast.classList.add("hidden");

    const allErrors = [
      errEmpty,
      errEmailExist,
      errEmailFormat,
      errPassMinLength,
      errPassNumber,
      errPassCase,
      errRole,
    ];

    allErrors.forEach((el) => {
      if (el) el.classList.add("hidden");
    });
  }

  function showError(element) {
    resetErrorMsg();
    if (msgBox) msgBox.classList.add("show");
    if (addError) addError.classList.remove("hidden");
    if (element) element.classList.remove("hidden");
  }

  // 10. Gắn sự kiện submit cho form
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = usernameInput ? usernameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value.trim() : "";
      const role = roleSelect ? roleSelect.value : "user";
      const birthday = dobInput ? dobInput.value : "";
      const status = getValueRadio();
      const description = descriptionInput ? descriptionInput.value.trim() : "";

      // Kiểm tra quyền Admin
      if (!isAdmin()) {
        showError(errRole);
        return;
      }

      // Kiểm tra rỗng
      if (isEmpty(email, username, password)) {
        showError(errEmpty);
        return;
      }

      // Kiểm tra định dạng Email
      if (!isValidationEmail(email)) {
        showError(errEmailFormat);
        return;
      }

      // Kiểm tra trùng Email
      if (isExistEmail(email)) {
        showError(errEmailExist);
        return;
      }

      // Kiểm tra mật khẩu
      const passStatus = isPasswordValid(password);
      if (passStatus === "min_length") {
        showError(errPassMinLength);
        return;
      }
      if (passStatus === "number_required") {
        showError(errPassNumber);
        return;
      }
      if (passStatus === "case_required") {
        showError(errPassCase);
        return;
      }

      // Tạo user mới
      const newUser = {
        usercode: generatedCode,
        username,
        email,
        password,
        role,
        birthday,
        status,
        description,
      };

      users.push(newUser);
      localStorage.setItem("userList", JSON.stringify(users));

      // Thông báo thành công
      resetErrorMsg();
      if (msgBox) msgBox.classList.add("show");
      if (addToast) addToast.classList.remove("hidden");

      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 800);
    });
  }

  // 11. Button Back
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "./dashboard.html";
    });
  }

  // 12. Chức năng hiện/ẩn mật khẩu
  if (eyeIcon && eyeSlashIcon && passwordInput) {
    eyeIcon.addEventListener("click", () => {
      passwordInput.type = "text";
      eyeIcon.style.setProperty("display", "none", "important");
      eyeSlashIcon.style.setProperty("display", "inline-block", "important");
    });

    eyeSlashIcon.addEventListener("click", () => {
      passwordInput.type = "password";
      eyeSlashIcon.style.setProperty("display", "none", "important");
      eyeIcon.style.setProperty("display", "inline-block", "important");
    });
  }

  // 14. Reset thông báo khi nhập
  const formInputs = [
    usernameInput,
    emailInput,
    passwordInput,
    dobInput,
    descriptionInput,
  ];
  formInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", resetErrorMsg);
    }
  });
});