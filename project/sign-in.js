// sign-in.js - Xử lý chức năng đăng nhập

// 1. Lấy dữ liệu users từ localStorage ('userList')
 
function getUserList() {
  return JSON.parse(localStorage.getItem("userList")) || [];
}

// 2. Lấy các phần tử DOM cần thiết
const signinForm = document.querySelector("#sign-in-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const rememberCheckbox = document.querySelector("#save-loggin-checkbox");

const msgContainer = document.querySelector("#msg");
const loginValidation = document.querySelector("#login-validation");
const loginToast = document.querySelector("#login-toast");
const loginError = document.querySelector("#login-error");
const closeBtn = document.querySelector("#close-validation-btn");

// 3. Hàm kiểm tra rỗng (isEmpty)
function isEmpty(email, password) {
    // Kiểm tra nếu 1 trong 2 trường (hoặc cả 2) bị rỗng
    if (email === "" || password === "") {
        // Hiện thông báo lỗi validation
        if (msgContainer && loginValidation) {
            msgContainer.classList.add("show");
            loginValidation.classList.remove("hidden");
        }
        return false; // Trả về false nếu rỗng
    }
    return true; // Trả về true nếu đã điền đầy đủ cả 2 trường
}

// 4. Hàm kiểm tra tồn tại email và password (isExistEmailAndPassword)
function isExistEmailAndPassword(email, password) {
    const userList = getUserList();
    const user = userList.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    // Nếu không tồn tại hoặc password sai -> hiện #login-error và return false
    if (!user) {
        if (msgContainer && loginError) {
            msgContainer.classList.add("show");
            loginError.classList.remove("hidden");
        }
        return false;
    }
    return !!user; // Trả về true nếu tìm thấy người dùng, false nếu không tìm thấy
}

// 5. Hàm lưu currentUser vào localStorage
function saveCurrentUser(email) {
    const userList = getUserList();
    const user = userList.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
    }
}

// 6. Hàm reset thông báo lỗi (resetErrorMsg)
function resetErrorMsg() {
  if (msgContainer) msgContainer.classList.remove("show");
  if (loginValidation) loginValidation.classList.add("hidden");
  if (loginError) loginError.classList.add("hidden");
  if (loginToast) loginToast.classList.add("hidden");
}

// 7. Gắn sự kiện submit cho form
if (signinForm) {
    signinForm.addEventListener("submit", (e) => {
    // Ngăn chặn hành vi reload mặc định
        e.preventDefault();
    // Reset các thông báo cũ trước khi kiểm tra
    resetErrorMsg();

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();
    // 1: Kiểm tra rỗng
    if (!isEmpty(emailValue, passwordValue)) {
      return;
    }
    // 2: Kiểm tra tồn tại email và password
    if (!isExistEmailAndPassword(emailValue, passwordValue)) {
        return;
    }
    //3: Lưu thông tin nếu check "Remember me"
    if (rememberCheckbox && rememberCheckbox.checked) {
        const rememberData = {
            email: emailValue,
            password: passwordValue,
            loginTime: Date.now() // Lưu mốc thời gian (ms)
        };
        localStorage.setItem("loggedInUser", JSON.stringify(rememberData));
    } else {
        localStorage.removeItem("loggedInUser");
    }
    //4: Lưu currentUser vào localStorage
    saveCurrentUser(emailValue);
    // Bước 5: Hiện toast thành công và chuyển trang sau 800ms
    if (msgContainer && loginToast) {
        msgContainer.classList.add("show");
        loginToast.classList.remove("hidden");
    }
    setTimeout(() => {
        window.location.href = "pages/dashboard.html";    //chèn link dashboard
        }, 800);
    });
}

// 8. Chức năng "Ghi nhớ đăng nhập" (window load event)
window.addEventListener("load", () => {
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
});

// 9. Reset thông báo khi người dùng nhập lại hoặc đóng modal
if (emailInput) emailInput.addEventListener("input", resetErrorMsg);
if (passwordInput) passwordInput.addEventListener("input", resetErrorMsg);
if (closeBtn) closeBtn.addEventListener("click", resetErrorMsg);
