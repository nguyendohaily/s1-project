// 1. Lấy dữ liệu users từ localStorage ('userList')
function getUserList() {
  return JSON.parse(localStorage.getItem("userList")) || [];
}

// Hàm sinh mã định danh cho người dùng
function generateUserCode(userList) {
  return "USER_" + (userList.length + 1) + "_" + Date.now();
}

// 2. Lấy các phần tử DOM cần thiết
const signupForm = document.querySelector(".sign-up-form");
const emailInput = document.querySelector("#email");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");

// Khung chứa thông báo cha
const msgContainer = document.querySelector("#msg");

// Các phần tử thông báo lỗi và trạng thái
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

// 3. Hàm reset/ẩn tất cả thông báo
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

// 4. Hàm kiểm tra rỗng (isEmpty)
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

// 5. Hàm kiểm tra định dạng email
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

// 6. Hàm kiểm tra email đã tồn tại
function isExistEmail(email) {
  const userList = getUserList();
  const emailExists = userList.some(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase()
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
  const hasUpperCaseAndLowerCase = /[A-Z]/.test(password) && /[a-z]/.test(password);

  let isValid = true;

  if (!minLength) {
    if (passwordMinLengthMsg) passwordMinLengthMsg.classList.remove("hidden");
    isValid = false;
  }
  if (!hasNumber) {
    if (passwordNumberRequiredMsg) passwordNumberRequiredMsg.classList.remove("hidden");
    isValid = false;
  }
  if (!hasUpperCaseAndLowerCase) {
    if (passwordCaseMsg) passwordCaseMsg.classList.remove("hidden");
    isValid = false;
  }

  if (!isValid) {
    if (signupError) signupError.classList.remove("hidden");
    if (msgContainer) msgContainer.classList.add("show");
  }

  return isValid;
}

// 8. Bắt sự kiện submit form
if (signupForm) {
  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    resetErrorMsg();

    const emailVal = emailInput.value.trim();
    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value;

    // 1. Kiểm tra để trống
    if (isEmpty()) return;

    // 2. Kiểm tra định dạng & trùng lặp email
    const validEmail = isValidationEmail(emailVal);
    let existEmail = false;
    if (validEmail) {
      existEmail = isExistEmail(emailVal);
    }

    // 3. Kiểm tra mật khẩu
    const validPassword = isPasswordValid(passwordVal);

    if (!validEmail || existEmail || !validPassword) return;

    // 4. Lưu vào LocalStorage
    const userList = getUserList();
    const newUser = {
      userCode: generateUserCode(userList),
      email: emailVal,
      username: usernameVal,
      password: passwordVal,
    };

    userList.push(newUser);
    localStorage.setItem("userList", JSON.stringify(userList));

    // 5. Hiện toast thông báo thành công
    if (signupToast) signupToast.classList.remove("hidden");
    if (msgContainer) msgContainer.classList.add("show");


    setTimeout(() => {
      window.location.href = "sign-in.html";
    }, 1200);
  });
}

// 9. Chức năng hiện/ẩn mật khẩu (show/hide password toggle) đâu
// Lấy các phần tử icon mắt
const eye = document.querySelector(".fa-eye");
const eyeSlash = document.querySelector(".fa-eye-slash");

function togglePassword() {
  if (!passwordInput) return;
  const isPassword = passwordInput.type === "password";
  

  passwordInput.type = isPassword ? "text" : "password";


  if (eye && eyeSlash) {
    eye.classList.toggle("hidden", isPassword);
    eyeSlash.classList.toggle("hidden", !isPassword);
  }
}

if (eye) eye.addEventListener("click", togglePassword);
if (eyeSlash) eyeSlash.addEventListener("click", togglePassword);

// 10. Tự động tắt lỗi khi gõ lại
[emailInput, usernameInput, passwordInput].forEach((input) => {
  if (input) {
    input.addEventListener("input", resetErrorMsg);
  }
});