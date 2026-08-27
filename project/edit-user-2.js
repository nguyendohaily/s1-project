// Chờ toàn bộ cây DOM HTML được nạp hoàn tất trước khi chạy script để tránh lỗi gọi phần tử khi chưa xuất hiện trên trang
document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. LẤY DỮ LIỆU TỪ STORAGE (LOCAL & SESSION)
  // ==========================================
  // Khai báo hàm đọc danh sách tất cả tài khoản từ LocalStorage
  function getStoredUsers() {
    try {
      // localStorage.getItem('userList'): Lấy chuỗi JSON danh sách người dùng
      // JSON.parse(...): Chuyển chuỗi JSON thành mảng đối tượng JavaScript
      // || []: Nếu LocalStorage chưa có dữ liệu (null), trả về mảng rỗng để không bị lỗi
      return JSON.parse(localStorage.getItem('userList')) || [];
    } catch {
      // Bắt lỗi nếu dữ liệu LocalStorage bị hỏng format JSON, trả về mảng rỗng an toàn
      return [];
    }
  }

  // Khai báo hàm đọc thông tin người dùng được chọn để chỉnh sửa (được lưu tạm khi bấm icon Sửa ở Dashboard)
  function getUserCurrentEdit() {
    try {
      // sessionStorage.getItem('userEdit'): Lấy dữ liệu user cần sửa từ SessionStorage (mất đi khi đóng tab)
      // || null: Nếu không có dữ liệu, trả về null
      return JSON.parse(sessionStorage.getItem('userEdit')) || null;
    } catch {
      // Bắt lỗi cú pháp JSON nếu có, trả về null an toàn
      return null;
    }
  }

  // Lấy đối tượng user cần chỉnh sửa hiện tại
  let userCurrentEdit = getUserCurrentEdit();
  // Lấy toàn bộ danh sách users từ LocalStorage
  let userList = getStoredUsers();

  // ==========================================
  // 2. TRUY VẤN VÀ LẤY CÁC PHẦN TỬ DOM
  // ==========================================
  // Lấy thẻ form chỉnh sửa qua ID #edit-user-form
  const editForm = document.querySelector('#edit-user-form');
  // Lấy ô input mã người dùng qua ID #user-code
  const userCodeInput = document.querySelector('#user-code');
  // Lấy ô input tên người dùng qua ID #username
  const usernameInput = document.querySelector('#username');
  // Lấy ô input email qua ID #email
  const emailInput = document.querySelector('#email');
  // Lấy ô input mật khẩu qua ID #password
  const passwordInput = document.querySelector('#password');
  // Lấy thẻ <select> chọn vai trò qua ID #role
  const roleSelect = document.querySelector('#role');
  // Lấy ô input chọn ngày sinh qua ID #dob
  const dobInput = document.querySelector('#dob');
  // Lấy danh sách NodeList các nút radio trạng thái (Active / Inactive) qua name="status"
  const statusRadios = document.querySelectorAll('input[name="status"]');
  // Lấy ô nhập mô tả/ghi chú người dùng qua class .description-text-input
  const descriptionInput = document.querySelector('.description-text-input');

  // Lấy icon con mắt mở (FontAwesome) dùng để hiển thị mật khẩu
  const eyeIcon = document.querySelector('.fa-eye');
  // Lấy icon con mắt gạch chéo (FontAwesome) dùng để ẩn mật khẩu
  const eyeSlashIcon = document.querySelector('.fa-eye-slash');
  // Lấy nút Back (Quay lại trang danh sách) qua class .back-btn
  const backBtn = document.querySelector('.back-btn');

  // Lấy khung chứa tổng (container) bao bọc toàn bộ popup/hộp thông báo
  const msgContainer = document.querySelector('#msg');
  // Lấy popup/thông báo cập nhật thành công qua ID #edit-toast
  const editToast = document.querySelector('#edit-toast');
  // Lấy khối tiêu đề/khung thông báo lỗi chung qua ID #edit-error
  const editError = document.querySelector('#edit-error');

  // Lấy dòng thông báo lỗi: Username hoặc Password bị để trống
  const emptyError = document.querySelector('.username-and-password-empty');
  // Lấy dòng thông báo lỗi: Mật khẩu chưa đủ 8 ký tự
  const minLengthError = document.querySelector('.password-min-length-error');
  // Lấy dòng thông báo lỗi: Mật khẩu thiếu chữ số
  const numberReqError = document.querySelector('.password-number-required-error');
  // Lấy dòng thông báo lỗi: Mật khẩu thiếu chữ in hoa hoặc in thường
  const upperLowerError = document.querySelector('.password-uppercase-lowercase-error');

  // ==========================================
  // 3. KIỂM TRA VÀ ĐIỀN THÔNG TIN CŨ VÀO FORM
  // ==========================================
  // Nếu không có dữ liệu user cần sửa trong sessionStorage (người dùng truy cập trực tiếp bằng URL thay vì bấm nút Sửa từ Dashboard)
  if (!userCurrentEdit) {
    // Bật cảnh báo thông báo không tìm thấy dữ liệu
    alert('Không tìm thấy thông tin người dùng cần chỉnh sửa!');
    // Chuyển hướng người dùng quay trở lại trang quản trị dashboard.html
    window.location.href = './dashboard.html';
    // Dừng toàn bộ code phía sau
    return;
  }

  // Lấy mã usercode hiện tại (chuẩn hóa thuộc tính usercode hoặc userCode) và cắt khoảng trắng thừa
  const currentCode = (userCurrentEdit.usercode || userCurrentEdit.userCode || '').trim();

  // Điền mã usercode vào ô input và khóa lại (disabled = true) không cho phép người dùng thay đổi mã định danh
  if (userCodeInput) {
    userCodeInput.value = currentCode;
    userCodeInput.disabled = true;
  }
  // Điền username cũ vào ô input
  if (usernameInput) usernameInput.value = userCurrentEdit.username || '';
  // Điền email cũ vào ô input và khóa lại (disabled = true) để tránh việc thay đổi email gây xung đột tài khoản
  if (emailInput) {
    emailInput.value = userCurrentEdit.email || '';
    emailInput.disabled = true;
  }
  // Điền mật khẩu hiện tại vào ô input mật khẩu
  if (passwordInput) passwordInput.value = userCurrentEdit.password || '';
  // Điền vai trò (role: admin/user) vào thẻ select, chuyển chữ thường để khớp với value của <option>
  if (roleSelect) roleSelect.value = (userCurrentEdit.role || 'user').toLowerCase();
  // Điền ngày sinh cũ (hỗ trợ cả trường birthday hoặc dob)
  if (dobInput) dobInput.value = userCurrentEdit.birthday || userCurrentEdit.dob || '';
  // Điền thông tin mô tả chi tiết cũ vào ô textarea/input
  if (descriptionInput) descriptionInput.value = userCurrentEdit.description || '';

  // ==========================================
  // 4. HÀM CHỌN GIÁ TRỊ RADIO TRẠNG THÁI CŨ
  // ==========================================
  // Khai báo hàm kích hoạt nút radio (Active/Inactive) khớp với trạng thái của user đang sửa
  function setValueRadio(val) {
    // Nếu giá trị truyền vào rỗng thì dừng hàm
    if (!val) return;
    // Duyệt qua từng thẻ radio trong NodeList
    statusRadios.forEach((radio) => {
      // So sánh giá trị của radio với giá trị trạng thái của user (không phân biệt hoa/thường)
      if (radio.value.toLowerCase() === String(val).toLowerCase()) {
        // Tích chọn radio tương ứng
        radio.checked = true;
      }
    });
  }
  // Gọi hàm để đánh dấu trạng thái ban đầu của user lên giao diện
  setValueRadio(userCurrentEdit.status);

  // ==========================================
  // 5. HÀM LẤY GIÁ TRỊ RADIO ĐANG CHỌN
  // ==========================================
  // Khai báo hàm lấy giá trị trạng thái người dùng vừa chọn trên form
  function getValueRadio() {
    // Duyệt qua từng nút radio
    for (const radio of statusRadios) {
      // Trả về giá trị của nút đang được chọn (checked === true)
      if (radio.checked) return radio.value;
    }
    // Giá trị mặc định nếu không có nút nào được tích
    return 'Active';
  }

  // ==========================================
  // 6. HÀM RESET THÔNG BÁO LỖI
  // ==========================================
  // Khai báo hàm ẩn toàn bộ thông báo lỗi và thông báo thành công để làm sạch giao diện
  function resetErrorMsg() {
    // Gỡ class 'show' khỏi container tổng để ẩn khung thông báo
    if (msgContainer) msgContainer.classList.remove('show');
    // Thêm class 'hidden' để ẩn tiêu đề lỗi
    if (editError) editError.classList.add('hidden');
    // Thêm class 'hidden' để ẩn toast thành công
    if (editToast) editToast.classList.add('hidden');

    // Ẩn tất cả các dòng thông báo lỗi chi tiết
    if (emptyError) emptyError.classList.add('hidden');
    if (minLengthError) minLengthError.classList.add('hidden');
    if (numberReqError) numberReqError.classList.add('hidden');
    if (upperLowerError) upperLowerError.classList.add('hidden');
  }

  // ==========================================
  // 7. HÀM KIỂM TRA DỮ LIỆU BỎ TRỐNG
  // ==========================================
  // Khai báo hàm kiểm tra xem username hoặc password có bị bỏ trống hay không
  function isEmpty(username, password) {
    // Nếu username rỗng HOẶC password rỗng (sau khi cắt khoảng trắng)
    if (!username.trim() || !password.trim()) {
      // Mở khung chứa tổng
      if (msgContainer) msgContainer.classList.add('show');
      // Hiển thị khung tiêu đề lỗi
      if (editError) editError.classList.remove('hidden');
      // Hiển thị thông báo chi tiết "Username and Password cannot be empty"
      if (emptyError) emptyError.classList.remove('hidden');
      // Trả về true báo hiệu có lỗi rỗng
      return true;
    }
    // Trả về false nếu cả 2 trường đều đã được nhập
    return false;
  }

  // ==========================================
  // 8. HÀM KIỂM TRA ĐỘ MẠNH CỦA MẬT KHẨU
  // ==========================================
  // Khai báo hàm kiểm tra các tiêu chuẩn bảo mật cho mật khẩu mới
  function isPasswordValid(password) {
    // Biến cờ đánh dấu tính hợp lệ của mật khẩu, mặc định là true
    let isValid = true;

    // Tiêu chí 1: Mật khẩu phải từ 8 ký tự trở lên
    if (password.length < 8) {
      // Hiển thị dòng thông báo lỗi độ dài tối thiểu
      if (minLengthError) minLengthError.classList.remove('hidden');
      isValid = false;
    }

    // Tiêu chí 2: Mật khẩu phải chứa ít nhất 1 chữ số (\d)
    if (!/\d/.test(password)) {
      // Hiển thị dòng thông báo lỗi yêu cầu có số
      if (numberReqError) numberReqError.classList.remove('hidden');
      isValid = false;
    }

    // Tiêu chí 3: Mật khẩu phải chứa cả chữ thường [a-z] VÀ chữ hoa [A-Z]
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      // Hiển thị dòng thông báo lỗi yêu cầu kết hợp hoa-thường
      if (upperLowerError) upperLowerError.classList.remove('hidden');
      isValid = false;
    }

    // Nếu có bất kỳ tiêu chí nào không đạt (isValid === false)
    if (!isValid) {
      // Hiển thị khung chứa thông báo tổng
      if (msgContainer) msgContainer.classList.add('show');
      // Hiển thị khung tiêu đề lỗi
      if (editError) editError.classList.remove('hidden');
    }

    // Trả về kết quả kiểm tra (true/false)
    return isValid;
  }

  // ==========================================
  // 9. XỬ LÝ SỰ KIỆN SUBMIT FORM CHỈNH SỬA
  // ==========================================
  // Kiểm tra form có tồn tại trên trang hay không
  if (editForm) {
    // Lắng nghe sự kiện người dùng bấm submit form (Lưu thay đổi)
    editForm.addEventListener('submit', function (e) {
      // e.preventDefault(): Ngăn chặn hành vi reload trang mặc định khi submit form
      e.preventDefault();
      // Xóa tất cả thông báo lỗi cũ để kiểm tra lại từ đầu
      resetErrorMsg();

      // Lấy giá trị username và cắt khoảng trắng thừa ở 2 đầu
      const usernameVal = usernameInput ? usernameInput.value.trim() : '';
      // Lấy giá trị mật khẩu (giữ nguyên khoảng cách, không trim)
      const passwordVal = passwordInput ? passwordInput.value : '';

      // Bước 1: Kiểm tra rỗng, nếu có trường rỗng thì dừng hàm
      if (isEmpty(usernameVal, passwordVal)) return;
      // Bước 2: Kiểm tra tính hợp lệ của mật khẩu, nếu không đạt tiêu chuẩn thì dừng hàm
      if (!isPasswordValid(passwordVal)) return;

      // Bước 3: Đọc lại danh sách users mới nhất từ LocalStorage để đảm bảo đồng bộ dữ liệu
      userList = getStoredUsers();

      // Bước 4: Tìm vị trí (index) chính xác của người dùng trong mảng userList dựa theo mã currentCode
      const userIndex = userList.findIndex((user) => {
        const uCode = (user.usercode || user.userCode || '').trim();
        return uCode === currentCode;
      });

      // Nếu không tìm thấy user tương ứng trong danh sách (userIndex === -1)
      if (userIndex === -1) {
        alert('Lỗi: Không tìm thấy người dùng này trong hệ thống để cập nhật!');
        return;
      }

      // Bước 5: Tạo đối tượng user đã cập nhật (sao chép toàn bộ thuộc tính cũ bằng spread operator '...', sau đó ghi đè các trường mới)
      const updatedUser = {
        ...userList[userIndex],
        usercode: currentCode,                                                  // Giữ nguyên mã người dùng không đổi
        username: usernameVal,                                                 // Cập nhật username mới
        email: emailInput ? emailInput.value : userList[userIndex].email,      // Giữ nguyên email gốc
        password: passwordVal,                                                 // Cập nhật mật khẩu mới
        role: roleSelect ? roleSelect.value : userList[userIndex].role,        // Cập nhật vai trò mới
        birthday: dobInput ? dobInput.value : userList[userIndex].birthday,    // Cập nhật ngày sinh mới
        status: getValueRadio(),                                               // Cập nhật trạng thái đang chọn
        description: descriptionInput ? descriptionInput.value.trim() : ''     // Cập nhật mô tả mới
      };

      // Ghi đè đối tượng đã cập nhật trực tiếp vào đúng vị trí index trong mảng userList
      userList[userIndex] = updatedUser;

      // Lưu mảng userList mới vào LocalStorage
      localStorage.setItem('userList', JSON.stringify(userList));
      // Cập nhật lại session 'userEdit' để nếu người dùng ở lại trang thì dữ liệu vẫn đồng bộ
      sessionStorage.setItem('userEdit', JSON.stringify(updatedUser));

      // Bước 6: Hiển thị thông báo cập nhật thành công (toast popup)
      if (msgContainer) msgContainer.classList.add('show');
      if (editToast) editToast.classList.remove('hidden');

      // Đợi 800ms (0.8 giây) để người dùng kịp nhìn thông báo thành công trước khi chuyển trang
      setTimeout(() => {
        // Điều hướng quay trở lại trang quản trị dashboard.html
        window.location.href = './dashboard.html';
      }, 800);
    });
  }

  // ==========================================
  // 10. XỬ LÝ SỰ KIỆN NÚT QUAY LẠI (BUTTON BACK)
  // ==========================================
  // Kiểm tra nút Back có tồn tại không
  if (backBtn) {
    // Lắng nghe sự kiện click vào nút Back
    backBtn.addEventListener('click', (e) => {
      // Ngăn chặn hành vi mặc định
      e.preventDefault();
      // Xóa dữ liệu tạm 'userEdit' trong sessionStorage để dọn dẹp bộ nhớ
      sessionStorage.removeItem('userEdit');
      // Chuyển hướng quay trở lại trang danh sách quản trị dashboard.html
      window.location.href = './dashboard.html';
    });
  }

  // ==========================================
  // 11. CHỨC NĂNG ẨN / HIỆN MẬT KHẨU
  // ==========================================
  // Mặc định ẩn icon con mắt gạch chéo khi vừa vào trang
  if (eyeSlashIcon) eyeSlashIcon.style.display = 'none';

  // Khai báo hàm chuyển đổi qua lại giữa ẩn và hiện mật khẩu
  const togglePasswordVisibility = () => {
    // Nếu không có ô input mật khẩu thì dừng hàm
    if (!passwordInput) return;
    // Kiểm tra xem kiểu hiện tại của input có phải là 'password' hay không
    const isPassword = passwordInput.getAttribute('type') === 'password';
    // Nếu đang là 'password' thì đổi thành 'text' (lộ mật khẩu), ngược lại đổi về 'password' (ẩn mật khẩu)
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    // Chuyển đổi hiển thị giữa 2 icon mắt tương ứng với trạng thái của input
    if (eyeIcon && eyeSlashIcon) {
      eyeIcon.style.display = isPassword ? 'none' : 'inline-block';
      eyeSlashIcon.style.display = isPassword ? 'inline-block' : 'none';
    }
  };

  // Gắn sự kiện click cho icon mắt mở để gọi hàm chuyển đổi
  if (eyeIcon) eyeIcon.addEventListener('click', togglePasswordVisibility);
  // Gắn sự kiện click cho icon mắt gạch chéo để gọi hàm chuyển đổi
  if (eyeSlashIcon) eyeSlashIcon.addEventListener('click', togglePasswordVisibility);

  // ==========================================
  // 12. TỰ ĐỘNG XÓA THÔNG BÁO LỖI KHI NHẬP LẠI
  // ==========================================
  // Gom các ô input và select vào mảng để gắn sự kiện dọn lỗi
  const formInputs = [usernameInput, passwordInput, roleSelect, dobInput, descriptionInput];
  // Duyệt qua từng input trong mảng
  formInputs.forEach((input) => {
    if (input) {
      // Lắng nghe sự kiện 'input' (khi người dùng gõ phím/chỉnh sửa giá trị) -> Tự động xóa bảng thông báo lỗi
      input.addEventListener('input', resetErrorMsg);
    }
  });

  // Duyệt qua từng nút radio trạng thái
  statusRadios.forEach((radio) => {
    // Lắng nghe sự kiện 'change' (khi người dùng đổi lựa chọn Active/Inactive) -> Tự động xóa thông báo lỗi
    radio.addEventListener('change', resetErrorMsg);
  });
});