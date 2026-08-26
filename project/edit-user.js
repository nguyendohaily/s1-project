document.addEventListener('DOMContentLoaded', () => {
  // 1. Lấy dữ liệu từ storage
  function getStoredUsers() {
    try {
      return JSON.parse(localStorage.getItem('userList')) || [];
    } catch {
      return [];
    }
  }

  function getUserCurrentEdit() {
    try {
      return JSON.parse(sessionStorage.getItem('userEdit')) || null;
    } catch {
      return null;
    }
  }

  let userCurrentEdit = getUserCurrentEdit();
  let userList = getStoredUsers();

  // 2. Lấy các phần tử DOM cần thiết
  const editForm = document.querySelector('#edit-user-form');
  const userCodeInput = document.querySelector('#user-code');
  const usernameInput = document.querySelector('#username');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const roleSelect = document.querySelector('#role');
  const dobInput = document.querySelector('#dob');
  const statusRadios = document.querySelectorAll('input[name="status"]');
  const descriptionInput = document.querySelector('.description-text-input');

  const eyeIcon = document.querySelector('.fa-eye');
  const eyeSlashIcon = document.querySelector('.fa-eye-slash');
  const backBtn = document.querySelector('.back-btn');

  const msgContainer = document.querySelector('#msg');
  const editToast = document.querySelector('#edit-toast');
  const editError = document.querySelector('#edit-error');

  const emptyError = document.querySelector('.username-and-password-empty');
  const minLengthError = document.querySelector('.password-min-length-error');
  const numberReqError = document.querySelector('.password-number-required-error');
  const upperLowerError = document.querySelector('.password-uppercase-lowercase-error');

  // 3. Kiểm tra và điền thông tin cũ vào Form
  if (!userCurrentEdit) {
    alert('Không tìm thấy thông tin người dùng cần chỉnh sửa!');
    window.location.href = './dashboard.html';
    return;
  }

  // Lấy mã usercode chuẩn (đồng bộ chữ thường)
  const currentCode = (userCurrentEdit.usercode || userCurrentEdit.userCode || '').trim();

  if (userCodeInput) {
    userCodeInput.value = currentCode;
    userCodeInput.disabled = true;
  }
  if (usernameInput) usernameInput.value = userCurrentEdit.username || '';
  if (emailInput) {
    emailInput.value = userCurrentEdit.email || '';
    emailInput.disabled = true;
  }
  if (passwordInput) passwordInput.value = userCurrentEdit.password || '';
  if (roleSelect) roleSelect.value = (userCurrentEdit.role || 'user').toLowerCase();
  if (dobInput) dobInput.value = userCurrentEdit.birthday || userCurrentEdit.dob || '';
  if (descriptionInput) descriptionInput.value = userCurrentEdit.description || '';

  // 4. Hàm chọn giá trị cho Radio Button
  function setValueRadio(val) {
    if (!val) return;
    statusRadios.forEach((radio) => {
      if (radio.value.toLowerCase() === String(val).toLowerCase()) {
        radio.checked = true;
      }
    });
  }
  setValueRadio(userCurrentEdit.status);

  // 5. Hàm lấy giá trị radio đang chọn
  function getValueRadio() {
    for (const radio of statusRadios) {
      if (radio.checked) return radio.value;
    }
    return 'Active';
  }

  // 6. Reset thông báo lỗi
  function resetErrorMsg() {
    if (msgContainer) msgContainer.classList.remove('show');
    if (editError) editError.classList.add('hidden');
    if (editToast) editToast.classList.add('hidden');

    if (emptyError) emptyError.classList.add('hidden');
    if (minLengthError) minLengthError.classList.add('hidden');
    if (numberReqError) numberReqError.classList.add('hidden');
    if (upperLowerError) upperLowerError.classList.add('hidden');
  }

  // 7. Kiểm tra rỗng
  function isEmpty(username, password) {
    if (!username.trim() || !password.trim()) {
      if (msgContainer) msgContainer.classList.add('show');
      if (editError) editError.classList.remove('hidden');
      if (emptyError) emptyError.classList.remove('hidden');
      return true;
    }
    return false;
  }

  // 8. Kiểm tra mật khẩu hợp lệ
  function isPasswordValid(password) {
    let isValid = true;

    if (password.length < 8) {
      if (minLengthError) minLengthError.classList.remove('hidden');
      isValid = false;
    }

    if (!/\d/.test(password)) {
      if (numberReqError) numberReqError.classList.remove('hidden');
      isValid = false;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      if (upperLowerError) upperLowerError.classList.remove('hidden');
      isValid = false;
    }

    if (!isValid) {
      if (msgContainer) msgContainer.classList.add('show');
      if (editError) editError.classList.remove('hidden');
    }

    return isValid;
  }

  // 9. Gắn sự kiện submit cho form (Cập nhật đúng vị trí)
  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      resetErrorMsg();

      const usernameVal = usernameInput ? usernameInput.value.trim() : '';
      const passwordVal = passwordInput ? passwordInput.value : '';

      if (isEmpty(usernameVal, passwordVal)) return;
      if (!isPasswordValid(passwordVal)) return;

      // Load lại danh sách mới nhất từ LocalStorage
      userList = getStoredUsers();

      // Tìm index chính xác dựa vào usercode
      const userIndex = userList.findIndex((user) => {
        const uCode = (user.usercode || user.userCode || '').trim();
        return uCode === currentCode;
      });

      if (userIndex === -1) {
        alert('Lỗi: Không tìm thấy người dùng này trong hệ thống để cập nhật!');
        return;
      }

      // Tạo object cập nhật (giữ nguyên usercode và email)
      const updatedUser = {
        ...userList[userIndex],
        usercode: currentCode,
        username: usernameVal,
        email: emailInput ? emailInput.value : userList[userIndex].email,
        password: passwordVal,
        role: roleSelect ? roleSelect.value : userList[userIndex].role,
        birthday: dobInput ? dobInput.value : userList[userIndex].birthday,
        status: getValueRadio(),
        description: descriptionInput ? descriptionInput.value.trim() : ''
      };

      // Ghi đè trực tiếp vào vị trí cũ
      userList[userIndex] = updatedUser;

      // Lưu lại vào localStorage và cập nhật sessionStorage
      localStorage.setItem('userList', JSON.stringify(userList));
      sessionStorage.setItem('userEdit', JSON.stringify(updatedUser));

      if (msgContainer) msgContainer.classList.add('show');
      if (editToast) editToast.classList.remove('hidden');

      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 800);
    });
  }

  // 10. Gắn sự kiện cho button Back
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('userEdit');
      window.location.href = './dashboard.html';
    });
  }

  // 11. Chức năng ẩn/hiện mật khẩu
  if (eyeSlashIcon) eyeSlashIcon.style.display = 'none';

  const togglePasswordVisibility = () => {
    if (!passwordInput) return;
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

    if (eyeIcon && eyeSlashIcon) {
      eyeIcon.style.display = isPassword ? 'none' : 'inline-block';
      eyeSlashIcon.style.display = isPassword ? 'inline-block' : 'none';
    }
  };

  if (eyeIcon) eyeIcon.addEventListener('click', togglePasswordVisibility);
  if (eyeSlashIcon) eyeSlashIcon.addEventListener('click', togglePasswordVisibility);

  // 12. Reset thông báo khi người dùng gõ lại
  const formInputs = [usernameInput, passwordInput, roleSelect, dobInput, descriptionInput];
  formInputs.forEach((input) => {
    if (input) {
      input.addEventListener('input', resetErrorMsg);
    }
  });

  statusRadios.forEach((radio) => {
    radio.addEventListener('change', resetErrorMsg);
  });
});