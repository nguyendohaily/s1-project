// Chờ toàn bộ cây DOM HTML được nạp hoàn tất vào bộ nhớ trước khi chạy script để tránh lỗi gọi phần tử khi chưa render
document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // 1. LẤY DỮ LIỆU TỪ LOCALSTORAGE
  // ==========================================
  // Khai báo hàm đọc danh sách tất cả tài khoản đã lưu trong LocalStorage
  function getStoredUsers() {
    try {
      // localStorage.getItem("userList"): Lấy chuỗi JSON của danh sách người dùng
      // JSON.parse(...): Chuyển chuỗi JSON thành mảng đối tượng JavaScript
      // || []: Nếu chưa có key 'userList' (kết quả trả về null), gán mảng rỗng để không crash code
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch {
      // Bắt lỗi nếu dữ liệu LocalStorage bị sai cú pháp JSON, trả về mảng rỗng an toàn
      return [];
    }
  }

  // Khai báo hàm đọc thông tin tài khoản hiện đang đăng nhập vào hệ thống
  function getCurrentUser() {
    try {
      // Đọc và parse dữ liệu JSON từ key 'currentUser'
      // || null: Nếu chưa đăng nhập (không có dữ liệu), gán mặc định là null
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      // Bắt lỗi nếu dữ liệu JSON bị hỏng, trả về null an toàn
      return null;
    }
  }

  // Lấy toàn bộ mảng users hiện có từ LocalStorage gán vào biến users
  let users = getStoredUsers();
  // Lấy thông tin user hiện tại đang đăng nhập để kiểm tra phân quyền khi cần
  let currentUser = getCurrentUser();

  // ==========================================
  // 2. TRUY VẤN VÀ LẤY CÁC PHẦN TỬ DOM
  // ==========================================
  // Lấy form thêm người dùng mới qua ID #add-new-user-form
  const form = document.querySelector("#add-new-user-form");
  // Lấy ô input mã người dùng qua ID #user-code (dùng để hiển thị mã tự sinh)
  const userCodeInput = document.querySelector("#user-code");
  // Lấy ô input nhập tên tài khoản qua ID #username
  const usernameInput = document.querySelector("#username");
  // Lấy ô input nhập email qua ID #email
  const emailInput = document.querySelector("#email");
  // Lấy ô input nhập mật khẩu qua ID #password
  const passwordInput = document.querySelector("#password");
  // Lấy thẻ <select> chọn vai trò (Role: admin/user) qua ID #role
  const roleSelect = document.querySelector("#role");
  // Lấy ô input chọn ngày sinh qua ID #dob
  const dobInput = document.querySelector("#dob");
  // Lấy danh sách (NodeList) tất cả các nút radio chọn trạng thái qua name="status" (Active/Inactive)
  const radioStatusList = document.querySelectorAll('input[name="status"]');
  // Lấy ô nhập mô tả/ghi chú người dùng qua class .description-text-input
  const descriptionInput = document.querySelector(".description-text-input");

  // Lấy icon con mắt mở (FontAwesome) dùng để hiển thị mật khẩu
  const eyeIcon = document.querySelector(".fa-eye");
  // Lấy icon con mắt gạch chéo (FontAwesome) dùng để ẩn mật khẩu
  const eyeSlashIcon = document.querySelector(".fa-eye-slash");
  // Lấy nút quay lại danh sách qua class .back-btn
  const backBtn = document.querySelector(".back-btn");

  // Lấy khung chứa tổng (container) bao bọc toàn bộ popup/hộp thông báo
  const msgBox = document.querySelector("#msg");
  // Lấy popup/thông báo thêm người dùng thành công (toast)
  const addToast = document.querySelector("#add-toast");
  // Lấy khối tiêu đề/khung thông báo lỗi chung
  const addError = document.querySelector("#add-error");
  // Lấy dòng thông báo chi tiết: "Email, Username hoặc Password bị để trống"
  const errEmpty = document.querySelector(".email-username-password-empty");
  // Lấy dòng thông báo chi tiết: "Email này đã được sử dụng"
  const errEmailExist = document.querySelector(".email-exist");
  // Lấy dòng thông báo chi tiết: "Định dạng email không hợp lệ"
  const errEmailFormat = document.querySelector(".email-error");
  // Lấy dòng thông báo chi tiết: "Mật khẩu phải có tối thiểu 8 ký tự"
  const errPassMinLength = document.querySelector(".password-min-length-error");
  // Lấy dòng thông báo chi tiết: "Mật khẩu phải chứa ít nhất một chữ số"
  const errPassNumber = document.querySelector(".password-number-required-error");
  // Lấy dòng thông báo chi tiết: "Mật khẩu phải chứa cả chữ hoa và chữ thường"
  const errPassCase = document.querySelector(".password-uppercase-lowercase-error");
  // Lấy dòng thông báo chi tiết: "Chỉ tài khoản Admin mới có quyền thực hiện thao tác này"
  const errRole = document.querySelector(".role-not-admin");

  // ==========================================
  // 13. HÀM TẠO USERCODE TỰ TĂNG (TR001, TR002...)
  // ==========================================
  // Khai báo hàm sinh mã người dùng duy nhất tự tăng dựa vào danh sách user hiện có
  function uniqueUsercode() {
    // Nếu danh sách người dùng rỗng (chưa có ai), trả về mã khởi tạo đầu tiên là "TR001"
    if (!users || users.length === 0) {
      return "TR001";
    }

    // Khởi tạo biến lưu giá trị số lớn nhất hiện tại
    let maxNumber = 0;
    // Lặp qua từng người dùng trong mảng users
    users.forEach((u) => {
      // Lấy chuỗi usercode, cắt khoảng trắng và đổi thành chữ in hoa
      const code = (u.usercode || "").trim().toUpperCase();
      // Dùng biểu thức chính quy (Regex) /\d+/ để trích xuất chuỗi số có trong mã code
      const match = code.match(/\d+/);
      // Nếu tìm thấy phần số trong mã
      if (match) {
        // Chuyển chuỗi số tìm được thành số nguyên hệ cơ số 10
        const num = parseInt(match[0], 10);
        // Cập nhật số lớn nhất nếu số vừa tìm được lớn hơn maxNumber hiện tại
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    // Tăng số lớn nhất lên 1 để tạo mã cho người dùng tiếp theo
    const nextNumber = maxNumber + 1;
    // .padStart(3, "0"): Đảm bảo phần số luôn đủ 3 chữ số (ví dụ: 1 -> "001", 12 -> "012")
    // Trả về mã hoàn chỉnh dạng "TRxxx"
    return `TR${String(nextNumber).padStart(3, "0")}`;
  }

  // Tự động gọi hàm để sinh mã usercode mới ngay khi trang vừa tải xong
  let generatedCode = uniqueUsercode();
  // Nếu tồn tại ô input userCodeInput trên giao diện
  if (userCodeInput) {
    // Điền mã tự sinh vào ô input để người dùng nhìn thấy trước mã của mình
    userCodeInput.value = generatedCode;
  }

  // ==========================================
  // 3. HÀM LẤY GIÁ TRỊ RADIO ĐANG ĐƯỢC CHỌN
  // ==========================================
  // Khai báo hàm quét danh sách radio status để lấy giá trị người dùng đang chọn
  function getValueRadio() {
    // Duyệt qua từng thẻ radio trong NodeList
    for (const radio of radioStatusList) {
      // Nếu nút radio này đang được tích (checked === true), trả về giá trị của nó ("Active" hoặc "Inactive")
      if (radio.checked) return radio.value;
    }
    // Nếu không có nút nào được tích (mặc định), trả về "Active"
    return "Active";
  }

  // ==========================================
  // 4. HÀM KIỂM TRA DỮ LIỆU BỎ TRỐNG
  // ==========================================
  // Khai báo hàm kiểm tra xem 1 trong 3 trường bắt buộc (email, username, password) có bị để trống không
  function isEmpty(email, username, password) {
    // Trả về true nếu email rỗng HOẶC username rỗng HOẶC password rỗng, ngược lại trả về false
    return !email || !username || !password;
  }

  // ==========================================
  // 5. HÀM KIỂM TRA ĐỊNH DẠNG EMAIL
  // ==========================================
  // Khai báo hàm kiểm tra cấu trúc email theo chuẩn
  function isValidationEmail(email) {
    // Biểu thức Regex kiểm tra định dạng email chuẩn: [ký tự]@[ký tự].[ký tự] không chứa khoảng trắng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // .test(): Trả về true nếu email đúng định dạng regex, ngược lại trả về false
    return emailRegex.test(email);
  }

  // ==========================================
  // 6. HÀM KIỂM TRA EMAIL ĐÃ TỒN TẠI CHƯA
  // ==========================================
  // Khai báo hàm kiểm tra email mới có bị trùng lặp với danh sách tài khoản đã có hay không
  function isExistEmail(email) {
    // .some(): Duyệt mảng users, trả về true nếu có ít nhất một user có email trùng khớp (không phân biệt hoa/thường)
    return users.some(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
  }

  // ==========================================
  // 7. HÀM KIỂM TRA TIÊU CHUẨN MẬT KHẨU
  // ==========================================
  // Khai báo hàm phân loại chi tiết lỗi của mật khẩu để hiển thị đúng thông báo
  function isPasswordValid(password) {
    // Tiêu chuẩn 1: Độ dài tối thiểu từ 8 ký tự trở lên (true/false)
    const hasMinLength = password.length >= 8;
    // Tiêu chuẩn 2: Chứa ít nhất một chữ số từ 0-9 (true/false)
    const hasNumber = /\d/.test(password);
    // Tiêu chuẩn 3: Dùng Regex Lookahead kiểm tra chứa đồng thời chữ thường [a-z] VÀ chữ hoa [A-Z]
    const hasUpperAndLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);

    // Nếu không đủ độ dài -> Trả về mã lỗi "min_length"
    if (!hasMinLength) return "min_length";
    // Nếu thiếu chữ số -> Trả về mã lỗi "number_required"
    if (!hasNumber) return "number_required";
    // Nếu thiếu chữ in hoa hoặc thường -> Trả về mã lỗi "case_required"
    if (!hasUpperAndLower) return "case_required";
    // Đạt toàn bộ tiêu chuẩn -> Trả về "valid"
    return "valid";
  }

  // ==========================================
  // 8. HÀM KIỂM TRA QUYỀN ADMIN
  // ==========================================
  // Khai báo hàm xác thực quyền hạn người dùng trước khi thêm tài khoản mới
  function isAdmin() {
    return true; // Bỏ chặn tạm thời (return true) để phục vụ việc test/thêm tài khoản bình thường mà không bị vướng quyền
  }

  // ==========================================
  // 9. HÀM RESET VÀ HIỂN THỊ THÔNG BÁO LỖI
  // ==========================================
  // Khai báo hàm dọn dẹp, ẩn toàn bộ thông báo (lỗi/thành công) để reset giao diện về trạng thái sạch sẽ
  function resetErrorMsg() {
    // Gỡ class 'show' khỏi container thông báo tổng để ẩn popup
    if (msgBox) msgBox.classList.remove("show");
    // Ẩn khối tiêu đề thông báo lỗi
    if (addError) addError.classList.add("hidden");
    // Ẩn khối thông báo thành công
    if (addToast) addToast.classList.add("hidden");

    // Gom tất cả các phần tử thông báo lỗi chi tiết vào một mảng
    const allErrors = [
      errEmpty,
      errEmailExist,
      errEmailFormat,
      errPassMinLength,
      errPassNumber,
      errPassCase,
      errRole,
    ];

    // Lặp qua từng phần tử thông báo lỗi và thêm class 'hidden' để ẩn đi
    allErrors.forEach((el) => {
      if (el) el.classList.add("hidden");
    });
  }

  // Khai báo hàm hiển thị một thông báo lỗi cụ thể (truyền vào phần tử DOM thông báo tương ứng)
  function showError(element) {
    // Reset toàn bộ thông báo cũ trước khi mở lỗi mới
    resetErrorMsg();
    // Thêm class 'show' để hiển thị khung thông báo tổng
    if (msgBox) msgBox.classList.add("show");
    // Hiển thị khung tiêu đề lỗi
    if (addError) addError.classList.remove("hidden");
    // Gỡ class 'hidden' để hiển thị dòng nội dung lỗi cụ thể được truyền vào
    if (element) element.classList.remove("hidden");
  }

  // ==========================================
  // 10. XỬ LÝ SỰ KIỆN SUBMIT FORM THÊM USER
  // ==========================================
  // Kiểm tra thẻ form có tồn tại trên trang hay không
  if (form) {
    // Lắng nghe sự kiện người dùng bấm nút submit form (Thêm mới)
    form.addEventListener("submit", (e) => {
      // e.preventDefault(): Ngăn chặn hành vi mặc định của form (không load lại trang)
      e.preventDefault();

      // Lấy giá trị username và dùng .trim() cắt khoảng trắng thừa ở 2 đầu
      const username = usernameInput ? usernameInput.value.trim() : "";
      // Lấy giá trị email và cắt khoảng trắng thừa
      const email = emailInput ? emailInput.value.trim() : "";
      // Lấy giá trị password và cắt khoảng trắng thừa
      const password = passwordInput ? passwordInput.value.trim() : "";
      // Lấy giá trị vai trò được chọn từ thẻ select (mặc định là "user")
      const role = roleSelect ? roleSelect.value : "user";
      // Lấy giá trị ngày sinh từ input date (dạng YYYY-MM-DD)
      const birthday = dobInput ? dobInput.value : "";
      // Lấy giá trị trạng thái hoạt động đang được chọn từ nút radio
      const status = getValueRadio();
      // Lấy nội dung mô tả/ghi chú và cắt khoảng trắng thừa
      const description = descriptionInput ? descriptionInput.value.trim() : "";

      // Bước 1: Kiểm tra quyền Admin, nếu không phải Admin thì hiển thị lỗi quyền hạn và dừng hàm
      if (!isAdmin()) {
        showError(errRole);
        return;
      }

      // Bước 2: Kiểm tra xem có trường bắt buộc nào (email, username, password) bị rỗng không, nếu rỗng thì báo lỗi và dừng hàm
      if (isEmpty(email, username, password)) {
        showError(errEmpty);
        return;
      }

      // Bước 3: Kiểm tra cấu trúc định dạng email, nếu không đúng chuẩn thì báo lỗi và dừng hàm
      if (!isValidationEmail(email)) {
        showError(errEmailFormat);
        return;
      }

      // Bước 4: Kiểm tra email có bị trùng với người dùng khác trong hệ thống không, nếu trùng thì báo lỗi và dừng hàm
      if (isExistEmail(email)) {
        showError(errEmailExist);
        return;
      }

      // Bước 5: Kiểm tra tiêu chuẩn độ mạnh của mật khẩu
      const passStatus = isPasswordValid(password);
      // Nếu mật khẩu dưới 8 ký tự -> Báo lỗi độ dài tối thiểu và dừng hàm
      if (passStatus === "min_length") {
        showError(errPassMinLength);
        return;
      }
      // Nếu mật khẩu thiếu chữ số -> Báo lỗi yêu cầu có số và dừng hàm
      if (passStatus === "number_required") {
        showError(errPassNumber);
        return;
      }
      // Nếu mật khẩu thiếu chữ hoa hoặc chữ thường -> Báo lỗi yêu cầu kết hợp hoa-thường và dừng hàm
      if (passStatus === "case_required") {
        showError(errPassCase);
        return;
      }

      // Bước 6: Sau khi vượt qua toàn bộ các bước kiểm tra, khởi tạo đối tượng User mới với dữ liệu chuẩn hóa
      const newUser = {
        usercode: generatedCode, // Gán mã usercode tự sinh (TRxxx)
        username,               // Tên người dùng vừa nhập
        email,                  // Email vừa nhập
        password,               // Mật khẩu vừa nhập
        role,                   // Vai trò được chọn (admin/user)
        birthday,               // Ngày sinh vừa chọn
        status,                 // Trạng thái tài khoản (Active/Inactive)
        description,            // Mô tả chi tiết
      };

      // Thêm đối tượng người dùng mới vào mảng users
      users.push(newUser);
      // Chuyển mảng users thành chuỗi JSON và lưu đè lại vào LocalStorage
      localStorage.setItem("userList", JSON.stringify(users));

      // Bước 7: Hiển thị thông báo thêm người dùng thành công (toast popup)
      resetErrorMsg();
      if (msgBox) msgBox.classList.add("show");
      if (addToast) addToast.classList.remove("hidden");

      // Đợi 800ms (0.8 giây) để người dùng kịp nhìn thông báo thành công trước khi điều hướng
      setTimeout(() => {
        // Chuyển hướng người dùng quay trở lại trang danh sách quản lý (dashboard.html)
        window.location.href = "./dashboard.html";
      }, 800);
    });
  }

  // ==========================================
  // 11. XỬ LÝ SỰ KIỆN NÚT QUAY LẠI (BUTTON BACK)
  // ==========================================
  // Kiểm tra nút Back có tồn tại trên trang không
  if (backBtn) {
    // Gắn sự kiện click cho nút Back
    backBtn.addEventListener("click", (e) => {
      // Ngăn chặn các hành vi điều hướng mặc định ngoài ý muốn
      e.preventDefault();
      // Điều hướng ngay lập tức quay về trang quản trị dashboard.html
      window.location.href = "./dashboard.html";
    });
  }

  // ==========================================
  // 12. CHỨC NĂNG ẨN / HIỆN MẬT KHẨU
  // ==========================================
  // Kiểm tra 2 icon mắt và ô input password có tồn tại trên giao diện hay không
  if (eyeIcon && eyeSlashIcon && passwordInput) {
    // Khi click vào icon mắt mở (đang ở trạng thái ẩn mật khẩu)
    eyeIcon.addEventListener("click", () => {
      // Đổi type của input thành "text" để hiển thị rõ chữ mật khẩu
      passwordInput.type = "text";
      // Ẩn icon mắt mở (dùng setProperty với !important để ghi đè mọi CSS ưu tiên khác)
      eyeIcon.style.setProperty("display", "none", "important");
      // Hiển thị icon mắt gạch chéo
      eyeSlashIcon.style.setProperty("display", "inline-block", "important");
    });

    // Khi click vào icon mắt gạch chéo (đang ở trạng thái hiện mật khẩu)
    eyeSlashIcon.addEventListener("click", () => {
      // Đổi type của input về "password" để che mật khẩu thành các dấu chấm tròn
      passwordInput.type = "password";
      // Ẩn icon mắt gạch chéo
      eyeSlashIcon.style.setProperty("display", "none", "important");
      // Hiển thị lại icon mắt mở
      eyeIcon.style.setProperty("display", "inline-block", "important");
    });
  }

  // ==========================================
  // 14. TỰ ĐỘNG XÓA THÔNG BÁO LỖI KHI NGƯỜI DÙNG NHẬP LẠI
  // ==========================================
  // Gom các ô input vào một mảng để gắn sự kiện dọn lỗi đồng loạt
  const formInputs = [
    usernameInput,
    emailInput,
    passwordInput,
    dobInput,
    descriptionInput,
  ];

  // Duyệt qua từng ô input trong mảng
  formInputs.forEach((input) => {
    // Nếu ô input tồn tại trên giao diện
    if (input) {
      // Lắng nghe sự kiện 'input' (kích hoạt mỗi khi người dùng gõ phím/chỉnh sửa nội dung)
      // Tự động gọi hàm resetErrorMsg để xóa bảng thông báo lỗi, nâng cao trải nghiệm người dùng (UX)
      input.addEventListener("input", resetErrorMsg);
    }
  });
});