document.addEventListener("DOMContentLoaded", () => {
  // 1. Lấy dữ liệu users từ localStorage
  function getUserList() {
    try {
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch {
      return [];
    }
  }

  // 2. Lấy các phần tử DOM cần thiết
  const signinForm = document.querySelector("#sign-in-form");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#password");
  const rememberCheckbox = document.querySelector("#save-loggin-checkbox");

  const msgContainer = document.querySelector("#msg");
  const loginValidation = document.querySelector("#login-validation");
  const emailBlankMsg = document.querySelector(".email-cannot-blank");
  const passBlankMsg = document.querySelector(".password-cannot-blank");

  const loginToast = document.querySelector("#login-toast");
  const loginError = document.querySelector("#login-error");
  const closeBtn = document.querySelector("#close-validation-btn");

  // 3. Hàm reset thông báo lỗi
  function resetErrorMsg() {
    if (msgContainer) msgContainer.classList.remove("show");
    if (loginValidation) loginValidation.classList.add("hidden");
    if (loginError) loginError.classList.add("hidden");
    if (loginToast) loginToast.classList.add("hidden");
    if (emailBlankMsg) emailBlankMsg.classList.add("hidden");
    if (passBlankMsg) passBlankMsg.classList.add("hidden");
  }

  // 4. Hàm kiểm tra rỗng
  function validateEmpty(email, password) {
    let hasEmpty = false;

    if (!email) {
      if (emailBlankMsg) emailBlankMsg.classList.remove("hidden");
      hasEmpty = true;
    }
    if (!password) {
      if (passBlankMsg) passBlankMsg.classList.remove("hidden");
      hasEmpty = true;
    }

    if (hasEmpty) {
      if (loginValidation) loginValidation.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
    }
    return hasEmpty;
  }

  // 5. Hàm kiểm tra tài khoản & mật khẩu
  function isExistEmailAndPassword(email, password) {
    const userList = getUserList();
    const user = userList.find(
      (u) =>
        (u.email || "").toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!user) {
      if (loginError) loginError.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");
      return null;
    }
    return user;
  }

  // 6. Gắn sự kiện submit form
  if (signinForm) {
    signinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      resetErrorMsg();

      const emailValue = emailInput ? emailInput.value.trim() : "";
      const passwordValue = passwordInput ? passwordInput.value : "";

      // Kiểm tra để trống
      if (validateEmpty(emailValue, passwordValue)) {
        return;
      }

      // Kiểm tra đăng nhập
      const user = isExistEmailAndPassword(emailValue, passwordValue);
      if (!user) {
        return;
      }

      // Xử lý Remember me
      if (rememberCheckbox && rememberCheckbox.checked) {
        const rememberData = {
          email: emailValue,
          password: passwordValue,
          loginTime: Date.now()
        };
        localStorage.setItem("loggedInUser", JSON.stringify(rememberData));
      } else {
        localStorage.removeItem("loggedInUser");
      }

      // Lưu currentUser cho toàn bộ dự án
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Báo thành công và điều hướng
      if (loginToast) loginToast.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");

      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 800);
    });
  }

  // 7. Tự động điền nếu đã chọn "Remember me"
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser) {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - loggedInUser.loginTime > ONE_DAY;

    if (!isExpired) {
      if (emailInput) emailInput.value = loggedInUser.email || "";
      if (passwordInput) passwordInput.value = loggedInUser.password || "";
      if (rememberCheckbox) rememberCheckbox.checked = true;
    } else {
      localStorage.removeItem("loggedInUser");
    }
  }

  // 8. Tắt lỗi khi thao tác lại
  if (emailInput) emailInput.addEventListener("input", resetErrorMsg);
  if (passwordInput) passwordInput.addEventListener("input", resetErrorMsg);
  if (closeBtn) closeBtn.addEventListener("click", resetErrorMsg);
});