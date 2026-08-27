// Đợi cây DOM HTML được tải hoàn tất trước khi chạy script để tránh lỗi gọi trúng phần tử chưa hiển thị
document.addEventListener("DOMContentLoaded", () => {
  // 1. Lấy dữ liệu từ localStorage ('userList')
  // Khai báo hàm đọc danh sách người dùng đã lưu trong LocalStorage
  function getUserList() {
    try {
      // JSON.parse(): Chuyển chuỗi JSON lấy từ LocalStorage thành mảng Object.
      // Nếu key 'userList' chưa có (null), toán tử || [] trả về mảng rỗng để không bị lỗi.
      return JSON.parse(localStorage.getItem("userList")) || [];
    } catch { 
      return []; // Đề phòng dữ liệu LocalStorage bị lỗi cú pháp JSON, bắt lỗi và trả về mảng rỗng an toàn
    }
  }

  // Tạo usercode tịnh tiến TR001, TR002... đồng bộ toàn hệ thống
  // Khai báo hàm sinh mã usercode tịnh tiến dựa vào danh sách user hiện tại
  function generateUserCode(userList) {
    if (!userList || userList.length === 0) return "TR001"; // Nếu danh sách rỗng, trả về mã khởi tạo mặc định là "TR001"

    let maxNumber = 0; // Khởi tạo biến lưu giá trị số lớn nhất hiện tại
    // Duyệt qua từng user trong danh sách để tìm số đuôi lớn nhất
    userList.forEach((u) => {
      // Lấy thuộc tính usercode hoặc userCode (đề phòng đặt tên lệch), bỏ khoảng trắng và chuyển chữ hoa
      const code = (u.usercode || u.userCode || "").trim().toUpperCase();
      // Dùng Regex /\d+/ để trích xuất phần số có trong chuỗi code
      const match = code.match(/\d+/);
      // Nếu có chứa số trong chuỗi
      if (match) {
        const num = parseInt(match[0], 10); // Chuyển chuỗi số thành số nguyên hệ cơ số 10
        if (num > maxNumber) maxNumber = num; // Cập nhật số lớn nhất nếu số vừa tìm được lớn hơn maxNumber hiện tại
      }
    });
    // maxNumber + 1: Tăng số lên 1
    // .padStart(3, "0"): Đảm bảo phần số luôn đủ 3 chữ số (ví dụ: 1 -> "001", 23 -> "023")
    // Trả về mã hoàn chỉnh dạng "TRxxx"
    return `TR${String(maxNumber + 1).padStart(3, "0")}`;
  }

  // 2. Lấy các phần tử DOM
  // Lấy thẻ form đăng ký dựa theo class .sign-up-form
  const signupForm = document.querySelector(".sign-up-form");
  const emailInput = document.querySelector("#email");// Lấy ô input nhập email qua ID #email
  const usernameInput = document.querySelector("#username"); // Lấy ô input nhập tên người dùng qua ID #username
  const passwordInput = document.querySelector("#password"); // Lấy ô input nhập mật khẩu qua ID #password

  const msgContainer = document.querySelector("#msg"); // Lấy khung chứa tổng các thông báo/popup lỗi
  const signupValidation = document.querySelector("#sign-up-validation"); // Lấy khối thông báo khi có trường để trống
  const userBlankMsg = document.querySelector(".username-cannot-blank");  // Lấy dòng thông báo cụ thể: username không được để trống
  const emailBlankMsg = document.querySelector(".email-cannot-blank"); // Lấy dòng thông báo cụ thể: email không được để trống
  const passBlankMsg = document.querySelector(".password-cannot-blank"); // Lấy dòng thông báo cụ thể: password không được để trống
 
  const signupToast = document.querySelector("#sign-up-toast");  // Lấy khối thông báo popup đăng ký thành công (toast)
  const signupError = document.querySelector("#sign-up-error"); // Lấy khối tiêu đề/thông báo lỗi logic chung (email sai, pass yếu,...)
  const emailExistMsg = document.querySelector(".email-exist"); // Lấy thông báo lỗi: email đã tồn tại
  const emailErrorMsg = document.querySelector(".email-error");  // Lấy thông báo lỗi: định dạng email không hợp lệ

  const passwordMinLengthMsg = document.querySelector(".password-min-length-error"); // Lấy thông báo lỗi: mật khẩu chưa đủ 8 ký tự
  const passwordNumberRequiredMsg = document.querySelector(".password-number-required-error"); // Lấy thông báo lỗi: mật khẩu thiếu chữ số
  const passwordCaseMsg = document.querySelector(".password-uppercase-lowercase-error"); // Lấy thông báo lỗi: mật khẩu thiếu chữ hoa hoặc chữ thường
  const closeBtn = document.querySelector(".close-btn");  // Lấy nút đóng (dấu X) trên popup thông báo

  const eye = document.querySelector(".fa-eye");  // Lấy icon hiển thị mật khẩu (con mắt mở)
  const eyeSlash = document.querySelector(".fa-eye-slash"); // Lấy icon ẩn mật khẩu (con mắt gạch chéo)
 
  // 3. Hàm reset thông báo lỗi
  // Khai báo hàm xóa toàn bộ trạng thái hiển thị lỗi để form sạch sẽ trước khi validate lại
  function resetErrorMsg() {
    if (msgContainer) msgContainer.classList.remove("show"); // Nếu có khung tổng thông báo, xóa class "show" để ẩn đi

    const elementsToHide = [ // Gom tất cả các phần tử thông báo lỗi/thành công vào một mảng để xử lý hàng loạt
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

    elementsToHide.forEach((el) => {// Lặp qua từng phần tử trong mảng
      if (el) el.classList.add("hidden"); // Nếu phần tử tồn tại trong DOM thì thêm class "hidden" để ẩn
    });
  }

  // 4. Hàm kiểm tra rỗng
  // Khai báo hàm kiểm tra xem có ô input nào bị bỏ trống hay không
  function isEmpty() {
    const emailVal = emailInput.value.trim(); // Lấy giá trị email và dùng .trim() cắt khoảng trắng thừa ở 2 đầu
    const usernameVal = usernameInput.value.trim(); // Lấy giá trị username và cắt khoảng trắng thừa
    const passwordVal = passwordInput.value.trim(); // Lấy giá trị password và cắt khoảng trắng thừa

    let hasEmpty = false; // Biến cờ (flag) đánh dấu có ô nào rỗng không, mặc định là false

    if (!usernameVal) { // Nếu username rỗng (chuỗi "")
      if (userBlankMsg) userBlankMsg.classList.remove("hidden"); // Hiển thị dòng lỗi username không được để trống (bằng cách bỏ class hidden)
      hasEmpty = true;  // Bật cờ có lỗi trống
    }
   // Nếu email rỗng
    if (!emailVal) {
      // Hiển thị dòng lỗi email không được để trống
      if (emailBlankMsg) emailBlankMsg.classList.remove("hidden");
      // Bật cờ có lỗi trống
      hasEmpty = true;
    }
    // Nếu password rỗng
    if (!passwordVal) {
      // Hiển thị dòng lỗi password không được để trống
      if (passBlankMsg) passBlankMsg.classList.remove("hidden");
      // Bật cờ có lỗi trống
      hasEmpty = true;
    }

    // Nếu phát hiện ít nhất 1 ô bị rỗng
    if (hasEmpty) {
      // Mở tiêu đề thông báo kiểm tra form
      if (signupValidation) signupValidation.classList.remove("hidden");
      // Mở khung chứa thông báo tổng
      if (msgContainer) msgContainer.classList.add("show");
    }

    // Trả về true nếu có trường rỗng, false nếu điền đầy đủ
    return hasEmpty;
  }

  // 5. Hàm kiểm tra email hợp lệ
  // Khai báo hàm kiểm tra cấu trúc email theo chuẩn
  function isValidationEmail(email) {
    // Biểu thức chính quy (Regex): kiểm tra dạng [ký tự]@ [ký tự].[ký tự] không chứa khoảng trắng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // .test(): trả về true nếu email khớp regex, ngược lại trả về false
    const isValid = emailRegex.test(email.trim());

    // Nếu email không hợp lệ
    if (!isValid) {
      // Hiển thị thông báo lỗi sai định dạng email
      if (emailErrorMsg) emailErrorMsg.classList.remove("hidden");
      // Hiển thị khối thông báo lỗi chung
      if (signupError) signupError.classList.remove("hidden");
      // Mở khung chứa tổng
      if (msgContainer) msgContainer.classList.add("show");
    }
    // Trả về kết quả kiểm tra (true/false)
    return isValid;
  }

  // 6. Hàm kiểm tra email trùng
 // Khai báo hàm kiểm tra trùng lặp email với cơ sở dữ liệu (LocalStorage)
  function isExistEmail(email) {
    // Lấy toàn bộ danh sách user từ LocalStorage
    const userList = getUserList();
    // .some(): duyệt mảng, trả về true nếu có ít nhất 1 phần tử thỏa mãn điều kiện
    const emailExists = userList.some(
      // Chuyển cả hai về chữ thường (toLowerCase) và bỏ khoảng cách để so sánh chính xác, không phân biệt hoa/thường
      (user) => (user.email || "").toLowerCase() === email.trim().toLowerCase()
    );

    // Nếu email đã tồn tại trong danh sách
    if (emailExists) {
      // Hiển thị thông báo email đã tồn tại
      if (emailExistMsg) emailExistMsg.classList.remove("hidden");
      // Hiển thị khối thông báo lỗi chung
      if (signupError) signupError.classList.remove("hidden");
      // Mở khung hiển thị thông báo
      if (msgContainer) msgContainer.classList.add("show");
    }
    // Trả về kết quả (true nếu đã tồn tại, false nếu là email mới)
    return emailExists;
  }

  // 7. Hàm kiểm tra độ mạnh mật khẩu
 // Khai báo hàm kiểm tra tiêu chuẩn bảo mật của mật khẩu
  function isPasswordValid(password) {
    // Tiêu chí 1: Độ dài từ 8 ký tự trở lên (true/false)
    const minLength = password.length >= 8;
    // Tiêu chí 2: Có chứa ít nhất một chữ số (\d)
    const hasNumber = /\d/.test(password);
    // Tiêu chí 3: Chứa cả chữ in hoa [A-Z] VÀ chữ in thường [a-z]
    const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
    
    // Biến cờ trạng thái hợp lệ của mật khẩu, mặc định là true
    let isValid = true;

    // Nếu không đạt độ dài tối thiểu
    if (!minLength) {
      // Hiện thông báo lỗi yêu cầu tối thiểu 8 ký tự
      if (passwordMinLengthMsg) passwordMinLengthMsg.classList.remove("hidden");
      // Đánh dấu mật khẩu không đạt
      isValid = false;
    }
    // Nếu không chứa chữ số
    if (!hasNumber) {
      // Hiện thông báo lỗi yêu cầu có số
      if (passwordNumberRequiredMsg) passwordNumberRequiredMsg.classList.remove("hidden");
      // Đánh dấu mật khẩu không đạt
      isValid = false;
    }
    // Nếu thiếu chữ in hoa hoặc chữ thường
    if (!hasUpperAndLower) {
      // Hiện thông báo lỗi yêu cầu kết hợp hoa - thường
      if (passwordCaseMsg) passwordCaseMsg.classList.remove("hidden");
      // Đánh dấu mật khẩu không đạt
      isValid = false;
    }

    // Nếu có bất kỳ tiêu chí nào không đạt (isValid === false)
    if (!isValid) {
      // Hiển thị khối thông báo lỗi chung
      if (signupError) signupError.classList.remove("hidden");
      // Mở khung hiển thị thông báo
      if (msgContainer) msgContainer.classList.add("show");
    }

    // Trả về trạng thái kiểm tra mật khẩu
    return isValid;
  }

  // 8. Sự kiện submit form
  if (signupForm) { // Kiểm tra thẻ form có tồn tại trên trang hay không
    signupForm.addEventListener("submit", function (e) { // Lắng nghe sự kiện người dùng bấm nút Đăng ký (submit form)
      e.preventDefault(); //Ngăn chặn hành vi mặc định của trình duyệt (tải lại trang / chuyển trang khi submit)
      resetErrorMsg(); // Xóa tất cả các thông báo lỗi đang hiển thị trước đó

      // Lấy dữ liệu người dùng nhập và chuẩn hóa
      const emailVal = emailInput.value.trim();
      const usernameVal = usernameInput.value.trim();
      // Mật khẩu giữ nguyên (không trim để tránh làm sai lệch mật khẩu nếu user cố tình đặt khoảng trắng)
      const passwordVal = passwordInput.value;

     // Bước 1: Nếu có trường rỗng, dừng ngay hàm không xử lý tiếp
      if (isEmpty()) return;
      // Bước 2: Nếu định dạng email không chuẩn, dừng hàm
      if (!isValidationEmail(emailVal)) return;
      // Bước 3: Nếu email đã có người đăng ký, dừng hàm
      if (isExistEmail(emailVal)) return;
      // Bước 4: Nếu mật khẩu không đủ độ bảo mật, dừng hàm
      if (!isPasswordValid(passwordVal)) return;

      // Nếu vượt qua tất cả các bước kiểm tra trên: lấy danh sách user hiện tại
      const userList = getUserList();

      // Khởi tạo đối tượng User mới với đầy đủ thông tin chuẩn hóa
      const newUser = {
        usercode: generateUserCode(userList), // Tự sinh mã user mới (TRxxx)
        username: usernameVal,               // Tên tài khoản vừa nhập
        email: emailVal,                     // Email vừa nhập
        password: passwordVal,               // Mật khẩu vừa nhập
        role: "user",                        // Phân quyền mặc định là user thường
        birthday: "",                        // Mặc định rỗng (bổ sung sau trong trang profile)
        status: "Active",                    // Trạng thái tài khoản hoạt động
        description: ""                      // Mô tả mặc định rỗng
      };

      // Thêm người dùng mới vào mảng userList
      userList.push(newUser);
      // Chuyển mảng thành chuỗi JSON và lưu đè lại vào LocalStorage
      localStorage.setItem("userList", JSON.stringify(userList));

      // Hiển thị thông báo đăng ký thành công (toast popup)
      if (signupToast) signupToast.classList.remove("hidden");
      // Mở khung hiển thị thông báo
      if (msgContainer) msgContainer.classList.add("show");

      // Đợi 1000ms (1 giây) để người dùng kịp nhìn thấy thông báo thành công
      setTimeout(() => {
        // Chuyển hướng trình duyệt sang trang Đăng nhập
        window.location.href = "./sign-in.html";
      }, 1000);
    });
  }

  // 9. Hiện / Ẩn mật khẩu
  // Kiểm tra 2 icon mắt và ô input password có tồn tại trên giao diện hay không
  if (eye && eyeSlash && passwordInput) {
    // Khi click vào icon mắt mở (đang ở trạng thái ẩn pass)
    eye.addEventListener("click", () => {
      // Chuyển kiểu input thành "text" để lộ mật khẩu rõ chữ
      passwordInput.type = "text";
      // Ẩn icon mắt mở
      eye.classList.add("hidden");
      // Hiện icon mắt gạch chéo
      eyeSlash.classList.remove("hidden");
    });

    // Khi click vào icon mắt gạch chéo (đang ở trạng thái hiện pass)
    eyeSlash.addEventListener("click", () => {
      // Chuyển kiểu input về lại "password" để che mật khẩu thành dấu chấm tròn
      passwordInput.type = "password";
      // Ẩn icon mắt gạch chéo
      eyeSlash.classList.add("hidden");
      // Hiện lại icon mắt mở
      eye.classList.remove("hidden");
    });
  }

  // 10. Nút đóng popup lỗi
  // Kiểm tra nút đóng có tồn tại không
  if (closeBtn) {
    // Khi click nút đóng (dấu X), gọi hàm resetErrorMsg để ẩn toàn bộ popup/lỗi đi
    closeBtn.addEventListener("click", resetErrorMsg);
  }

  // ==========================================
  // 11. TỰ ĐỘNG TẮT THÔNG BÁO LỖI KHI NHẬP LẠI
  // ==========================================
  // Đặt 3 ô input vào mảng để gắn sự kiện đồng loạt
  [emailInput, usernameInput, passwordInput].forEach((input) => {
    // Kiểm tra input có tồn tại không
    if (input) {
      // Lắng nghe sự kiện 'input' (mỗi khi người dùng gõ thêm hoặc xóa bớt 1 ký tự)
      // Tự động xóa bảng lỗi để cải thiện trải nghiệm người dùng (UX)
      input.addEventListener("input", resetErrorMsg);
    }
  });
})