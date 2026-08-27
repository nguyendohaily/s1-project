// Chờ toàn bộ cây DOM HTML được nạp hoàn tất vào bộ nhớ trước khi chạy script để tránh lỗi gọi phần tử khi chưa render
document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // 1. LẤY DỮ LIỆU USERS TỪ LOCALSTORAGE
  // ==========================================
  // Khai báo hàm đọc danh sách tất cả tài khoản đã đăng ký trong LocalStorage
  function getUserList() {
    try {
      // localStorage.getItem("userList"): Lấy chuỗi JSON của danh sách người dùng
      // JSON.parse(...): Chuyển chuỗi JSON thành mảng đối tượng JavaScript
      // || []: Nếu trong LocalStorage chưa có key 'userList' (kết quả trả về null), gán mặc định mảng rỗng để không crash code
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch {
      // Bắt lỗi nếu dữ liệu trong LocalStorage bị sai cú pháp JSON hoặc lỗi bộ nhớ, trả về mảng rỗng an toàn
      return [];
    }
  }

  // ==========================================
  // 2. LẤY CÁC PHẦN TỬ DOM CẦN THIẾT
  // ==========================================
  // Lấy form đăng nhập theo ID #sign-in-form để bắt sự kiện submit
  const signinForm = document.querySelector("#sign-in-form");
  // Lấy thẻ input nhập email qua ID #email
  const emailInput = document.querySelector("#email");
  // Lấy thẻ input nhập mật khẩu qua ID #password
  const passwordInput = document.querySelector("#password");
  // Lấy thẻ checkbox "Ghi nhớ đăng nhập" (Remember me) qua ID #save-loggin-checkbox
  const rememberCheckbox = document.querySelector("#save-loggin-checkbox");

  // Lấy container cha bao bọc toàn bộ popup/hộp thông báo lỗi & thành công
  const msgContainer = document.querySelector("#msg");
  // Lấy khối tiêu đề/khung thông báo lỗi kiểm tra trường dữ liệu (validation)
  const loginValidation = document.querySelector("#login-validation");
  // Lấy dòng thông báo chi tiết: "Email không được để trống"
  const emailBlankMsg = document.querySelector(".email-cannot-blank");
  // Lấy dòng thông báo chi tiết: "Mật khẩu không được để trống"
  const passBlankMsg = document.querySelector(".password-cannot-blank");

  // Lấy popup/thông báo đăng nhập thành công (toast)
  const loginToast = document.querySelector("#login-toast");
  // Lấy khối thông báo lỗi sai tài khoản hoặc mật khẩu
  const loginError = document.querySelector("#login-error");
  // Lấy nút dấu "X" dùng để đóng bảng thông báo lỗi
  const closeBtn = document.querySelector("#close-validation-btn");

  // ==========================================
  // 3. HÀM RESET THÔNG BÁO LỖI
  // ==========================================
  // Khai báo hàm dọn dẹp, ẩn toàn bộ thông báo (lỗi/thành công) để đưa giao diện về trạng thái sạch sẽ ban đầu
  function resetErrorMsg() {
    // Xóa class 'show' khỏi container tổng để ẩn khung thông báo
    if (msgContainer) msgContainer.classList.remove("show");
    // Thêm class 'hidden' để ẩn khối validation
    if (loginValidation) loginValidation.classList.add("hidden");
    // Thêm class 'hidden' để ẩn thông báo sai thông tin tài khoản
    if (loginError) loginError.classList.add("hidden");
    // Thêm class 'hidden' để ẩn thông báo đăng nhập thành công
    if (loginToast) loginToast.classList.add("hidden");
    // Thêm class 'hidden' để ẩn thông báo trống email
    if (emailBlankMsg) emailBlankMsg.classList.add("hidden");
    // Thêm class 'hidden' để ẩn thông báo trống password
    if (passBlankMsg) passBlankMsg.classList.add("hidden");
  }

  // ==========================================
  // 4. HÀM KIỂM TRA DỮ LIỆU ĐỂ TRỐNG
  // ==========================================
  // Khai báo hàm kiểm tra xem người dùng đã nhập đủ email và password chưa
  function validateEmpty(email, password) {
    // Tạo biến cờ (flag) theo dõi trạng thái có ô input nào bị rỗng hay không
    let hasEmpty = false;

    // Nếu email rỗng (chuỗi "")
    if (!email) {
      // Hiển thị thông báo "Email không được để trống" bằng cách gỡ class hidden
      if (emailBlankMsg) emailBlankMsg.classList.remove("hidden");
      // Bật cờ đánh dấu phát hiện dữ liệu rỗng
      hasEmpty = true;
    }
    // Nếu password rỗng (chuỗi "")
    if (!password) {
      // Hiển thị thông báo "Mật khẩu không được để trống"
      if (passBlankMsg) passBlankMsg.classList.remove("hidden");
      // Bật cờ đánh dấu phát hiện dữ liệu rỗng
      hasEmpty = true;
    }

    // Nếu có ít nhất 1 trong 2 trường bị rỗng
    if (hasEmpty) {
      // Hiển thị khung tiêu đề lỗi validation
      if (loginValidation) loginValidation.classList.remove("hidden");
      // Thêm class 'show' vào container cha để mở popup/thông báo
      if (msgContainer) msgContainer.classList.add("show");
    }
    // Trả về kết quả kiểm tra (true: có trường rỗng, false: đã điền đủ cả 2)
    return hasEmpty;
  }

  // ==========================================
  // 5. HÀM KIỂM TRA TÀI KHOẢN & MẬT KHẨU
  // ==========================================
  // Khai báo hàm xác thực thông tin đăng nhập với danh sách users trong LocalStorage
  function isExistEmailAndPassword(email, password) {
    // Lấy toàn bộ danh sách users từ LocalStorage
    const userList = getUserList();
    // .find(): Tìm người dùng đầu tiên khớp cả email (không phân biệt hoa/thường) VÀ mật khẩu chính xác
    const user = userList.find(
      (u) =>
        (u.email || "").toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    // Nếu không tìm thấy người dùng phù hợp (tài khoản không tồn tại hoặc sai mật khẩu)
    if (!user) {
      // Mở hiển thị thông báo lỗi sai tài khoản / mật khẩu
      if (loginError) loginError.classList.remove("hidden");
      // Mở container cha để popup hiển thị lên màn hình
      if (msgContainer) msgContainer.classList.add("show");
      // Trả về null báo hiệu xác thực thất bại
      return null;
    }
    // Xác thực thành công: Trả về toàn bộ object thông tin của user đó
    return user;
  }

  // ==========================================
  // 6. GẮN SỰ KIỆN SUBMIT FORM ĐĂNG NHẬP
  // ==========================================
  // Kiểm tra thẻ form tồn tại trên trang để tránh lỗi undefined
  if (signinForm) {
    // Lắng nghe sự kiện người dùng bấm submit form (nút Đăng nhập hoặc ấn Enter)
    signinForm.addEventListener("submit", (e) => {
      // e.preventDefault(): Ngăn chặn trình duyệt load lại trang mặc định của form
      e.preventDefault();
      // Xóa toàn bộ thông báo lỗi trước đó để bắt đầu quy trình kiểm tra mới
      resetErrorMsg();

      // Lấy giá trị email, dùng .trim() để loại bỏ khoảng trắng thừa ở 2 đầu (nếu input tồn tại)
      const emailValue = emailInput ? emailInput.value.trim() : "";
      // Lấy giá trị mật khẩu (giữ nguyên khoảng cách, không trim vì khoảng trắng có thể là một phần của password)
      const passwordValue = passwordInput ? passwordInput.value : "";

      // Bước 1: Kiểm tra xem có trường nào bị bỏ trống không, nếu có thì dừng hàm ngay lập tức
      if (validateEmpty(emailValue, passwordValue)) {
        return;
      }

      // Bước 2: Kiểm tra email và mật khẩu có khớp với cơ sở dữ liệu hay không
      const user = isExistEmailAndPassword(emailValue, passwordValue);
      // Nếu không khớp (user trả về null), dừng hàm xử lý
      if (!user) {
        return;
      }

      // Bước 3: Xử lý chức năng "Ghi nhớ đăng nhập" (Remember me)
      if (rememberCheckbox && rememberCheckbox.checked) {
        // Nếu người dùng tích chọn: Gom thông tin đăng nhập kèm mốc thời gian hiện tại
        const rememberData = {
          email: emailValue,
          password: passwordValue,
          loginTime: Date.now() // Lưu timestamp thời điểm đăng nhập (dạng mili-giây)
        };
        // Lưu đối tượng rememberData thành chuỗi JSON vào LocalStorage với key "loggedInUser"
        localStorage.setItem("loggedInUser", JSON.stringify(rememberData));
      } else {
        // Nếu người dùng KHÔNG tích chọn: Xóa thông tin đã lưu trước đó khỏi LocalStorage
        localStorage.removeItem("loggedInUser");
      }

      // Bước 4: Lưu thông tin phiên đăng nhập hiện tại (currentUser) để toàn bộ các trang khác (Dashboard, Profile) sử dụng
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Bước 5: Hiển thị thông báo đăng nhập thành công
      if (loginToast) loginToast.classList.remove("hidden");
      if (msgContainer) msgContainer.classList.add("show");

      // Đợi 800ms (0.8 giây) để người dùng kịp nhìn thông báo thành công trước khi chuyển trang
      setTimeout(() => {
        // Điều hướng trình duyệt chuyển hướng vào trang quản trị (dashboard.html)
        window.location.href = "./dashboard.html";
      }, 800);
    });
  }

  // ==========================================
  // 7. TỰ ĐỘNG ĐIỀN NẾU ĐÃ CHỌN "REMEMBER ME"
  // ==========================================
  // Đọc dữ liệu ghi nhớ đăng nhập đã lưu trong LocalStorage khi trang web vừa tải xong
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Nếu đã từng có dữ liệu Remember me được lưu
  if (loggedInUser) {
    // Định nghĩa hằng số thời gian hết hạn: 1 ngày tính bằng mili-giây (24h * 60m * 60s * 1000ms = 86,400,000ms)
    const ONE_DAY = 24 * 60 * 60 * 1000;
    // Kiểm tra xem thời gian lưu đã vượt quá 1 ngày (24 giờ) hay chưa
    const isExpired = Date.now() - loggedInUser.loginTime > ONE_DAY;

    // Nếu thông tin ghi nhớ vẫn còn hạn (chưa quá 24h)
    if (!isExpired) {
      // Tự động điền email vào ô input
      if (emailInput) emailInput.value = loggedInUser.email || "";
      // Tự động điền mật khẩu vào ô input
      if (passwordInput) passwordInput.value = loggedInUser.password || "";
      // Tự động tích chọn sẵn vào ô Remember me
      if (rememberCheckbox) rememberCheckbox.checked = true;
    } else {
      // Nếu đã quá 24h: Xóa dữ liệu ghi nhớ đã hết hạn khỏi LocalStorage để đảm bảo bảo mật
      localStorage.removeItem("loggedInUser");
    }
  }

  // ==========================================
  // 8. TỰ ĐỘNG TẮT LỖI KHI NGƯỜI DÙNG THAO TÁC LẠI
  // ==========================================
  // Khi người dùng gõ vào ô email -> Tự động ẩn các thông báo lỗi để tối ưu UX
  if (emailInput) emailInput.addEventListener("input", resetErrorMsg);
  // Khi người dùng gõ vào ô mật khẩu -> Tự động ẩn các thông báo lỗi
  if (passwordInput) passwordInput.addEventListener("input", resetErrorMsg);
  // Khi người dùng click nút đóng (dấu X) -> Gọi hàm resetErrorMsg để tắt bảng thông báo lỗi
  if (closeBtn) closeBtn.addEventListener("click", resetErrorMsg);
});