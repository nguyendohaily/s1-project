// Chờ cây DOM HTML tải hoàn tất trước khi thực thi script để tránh lỗi gọi phần tử khi chưa xuất hiện.
// Dùng từ khóa 'async' vì bên trong hàm có gọi await để load dữ liệu bất đồng bộ.
document.addEventListener("DOMContentLoaded", async () => {

  // ==========================================
  // 1. CẤU HÌNH & KHỞI TẠO DỮ LIỆU TỪ LOCALSTORAGE
  // ==========================================
  // Hằng số định nghĩa số lượng user tối đa hiển thị trên một trang (phân trang)
  const ITEMS_PER_PAGE = 5;
  // Biến theo dõi số trang hiện tại mà người dùng đang xem, khởi đầu là trang 1
  let currentPage = 1;
  // Biến cờ (flag) kiểm tra xem thanh phân trang có đang mở rộng để xem hết tất cả các trang hay không (khi có nút '...')
  let isExpanded = false;

  // Khai báo hàm bất đồng bộ khởi tạo dữ liệu mẫu nếu trong localStorage chưa có dữ liệu
  async function initUsersData() {
    // Kiểm tra xem đã có key 'userList' trong LocalStorage hay chưa
    const data = localStorage.getItem("userList");
    // Nếu chưa có (người dùng mở web lần đầu tiên)
    if (!data) {
      try {
        // Gửi request đọc file JSON chứa danh sách người dùng mặc định
        const response = await fetch("./users.json"); 
        // Phân giải kết quả trả về thành mảng đối tượng JavaScript
        const jsonUsers = await response.json();
        // Lưu mảng dữ liệu mẫu vào LocalStorage dưới dạng chuỗi JSON
        localStorage.setItem("userList", JSON.stringify(jsonUsers));
      } catch (error) {
        // Bắt lỗi và in ra console nếu file JSON bị lỗi hoặc không tìm thấy đường dẫn
        console.error("Lỗi khi load file users.json:", error);
      }
    }
  }

  // Khai báo hàm đọc danh sách user từ LocalStorage và sắp xếp theo mã usercode
  function getStoredUsers() {
    // Đọc dữ liệu chuỗi từ LocalStorage
    const data = localStorage.getItem("userList");
    // Nếu không có dữ liệu, trả về mảng rỗng để tránh crash code
    if (!data) return [];
    try {
      // Chuyển chuỗi JSON thành mảng đối tượng
      const parsed = JSON.parse(data);
      // Sắp xếp mảng tăng dần theo trường 'usercode' (ví dụ: TR001 < TR002)
      return parsed.sort((a, b) =>
        // localeCompare với { numeric: true } giúp so sánh chuỗi chứa số chuẩn xác theo giá trị số thay vì thứ tự chữ cái
        (a.usercode || "").localeCompare(b.usercode || "", undefined, { numeric: true })
      );
    } catch {
      // Đề phòng dữ liệu bị lỗi format JSON, bắt lỗi và trả về mảng rỗng an toàn
      return [];
    }
  }

  // Chờ (await) hàm initUsersData hoàn tất việc nạp dữ liệu mẫu vào LocalStorage (nếu cần) trước khi chạy tiếp các dòng dưới
  await initUsersData();

  // Lấy danh sách users gốc đã sắp xếp từ LocalStorage
  let users = getStoredUsers();
  // Sao chép mảng users sang filteredUsers (mảng phụ dùng để lọc, tìm kiếm và render giao diện mà không làm mất mảng gốc)
  let filteredUsers = [...users];

  // ==========================================
  // 2. LẤY CÁC PHẦN TỬ DOM CẦN THIẾT
  // ==========================================
  // Lấy ô input nhập từ khóa tìm kiếm theo ID #search-box
  const searchBox = document.querySelector("#search-box");
  // Lấy icon kính lúp (FontAwesome) để gắn sự kiện click tìm kiếm chính xác
  const searchIcon = document.querySelector(".fa-magnifying-glass");
  // Lấy thẻ <tbody> của bảng để hiển thị danh sách dòng dữ liệu người dùng
  const tableBody = document.querySelector("#table-body");
  // Lấy container cha bao bọc thanh phân trang
  const pagination = document.querySelector("#pagination");
  // Lấy thẻ <ul> hoặc container chứa danh sách các số trang (1, 2, 3...)
  const paginationList = document.querySelector("#pagination-list");

  // Khai báo hàm chuyển đổi định dạng ngày từ dạng chuẩn HTML YYYY-MM-DD sang DD/MM/YYYY
  function dateConvert(dateStr) {
    // Nếu không có dữ liệu ngày tháng, trả về chuỗi rỗng
    if (!dateStr) return "";
    // Tách chuỗi ngày thành mảng các phần tử dựa vào dấu gạch ngang '-'
    const parts = dateStr.split("-");
    // Nếu chuỗi không đủ 3 phần (năm, tháng, ngày), giữ nguyên giá trị gốc
    if (parts.length !== 3) return dateStr;
    // Bóc tách biến: parts[0] là năm, parts[1] là tháng, parts[2] là ngày
    const [year, month, day] = parts;
    // padStart(2, "0"): Đảm bảo ngày và tháng luôn có đủ 2 chữ số (ví dụ: '5' -> '05') và ghép thành chuỗi DD/MM/YYYY
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // ==========================================
  // 3. HÀM CHIA DỮ LIỆU THÀNH TỪNG TRANG (CHUNK ARRAY)
  // ==========================================
  // Khai báo hàm cắt mảng 1 chiều lớn thành mảng 2 chiều, mỗi mảng con chứa số lượng phần tử bằng pageSize
  function splitIntoPages(list, pageSize) {
    // Mảng rỗng chứa các trang
    const pages = [];
    // Vòng lặp nhảy theo từng bước nhảy pageSize (ví dụ: 0, 5, 10...)
    for (let i = 0; i < list.length; i += pageSize) {
      // slice(i, i + pageSize): Cắt một đoạn phần tử từ vị trí i đến (i + pageSize) và đẩy vào mảng pages
      pages.push(list.slice(i, i + pageSize));
    }
    // Trả về mảng 2 chiều đại diện cho các trang
    return pages;
  }

  // ==========================================
  // 4. HÀM RENDER DỮ LIỆU VÀO BẢNG (renderTable)
  // ==========================================
  // Khai báo hàm vẽ các thẻ <tr> vào <tbody> dựa trên danh sách user của trang hiện tại
  function renderTable(pageUsers = []) {
    // Nếu không tìm thấy thẻ tbody trong DOM, dừng hàm ngay để tránh lỗi
    if (!tableBody) return;
    // Nếu mảng truyền vào rỗng (không có user nào hoặc kết quả tìm kiếm không thấy ai)
    if (!pageUsers.length) {
      // Hiển thị một hàng thông báo duy nhất gộp 7 cột: "No users found"
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px;">No users found</td></tr>`;
      return;
    }

    // Duyệt qua mảng pageUsers, chuyển mỗi user thành 1 chuỗi HTML <tr>...</tr>, sau đó ghép lại bằng .join("")
    tableBody.innerHTML = pageUsers.map(u => `
      <tr>
        <td>${u.usercode || ""}</td>
        <td><strong>${u.username || ""}</strong></td>
        <td>${u.email || ""}</td>
        <td class="uppercase">${u.role || ""}</td>
        <td>${dateConvert(u.birthday)}</td>
        <td>
          <span class="status-cell ${String(u.status).toLowerCase() === "active" ? "active" : "deactive"}">
            <span class="dot"></span>${u.status}
          </span>
        </td>
        <td>
          <i class="fa-solid fa-trash" style="cursor:pointer;"></i>
          <i class="fa-solid fa-pen" style="cursor:pointer;"></i>
        </td>
      </tr>
    `).join("");
  }

  // ==========================================
  // 5. HÀM RENDER DANH SÁCH NÚT PHÂN TRANG (PAGINATION)
  // ==========================================
  // Khai báo hàm tạo các nút số trang (1, 2, 3... hoặc kèm dấu '...') dựa vào tổng số trang
  function renderListPagination(totalPages) {
    // Nếu không tìm thấy vùng chứa danh sách nút phân trang, dừng hàm
    if (!paginationList) return;
    // Xóa sạch nội dung HTML cũ của danh sách nút
    paginationList.innerHTML = "";
    // Nếu không có trang nào (dữ liệu rỗng), dừng hàm không cần vẽ nút
    if (totalPages <= 0) return;

    // Mảng lưu trữ danh sách các nhãn nút cần hiển thị
    const items = [];

    // Trường hợp 1: Tổng số trang ít (<= 5 trang) HOẶC người dùng đã bấm mở rộng '...'
    if (totalPages <= 5 || isExpanded) {
      // Hiển thị đầy đủ tất cả các số trang từ 1 đến totalPages
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Trường hợp 2: Số trang nhiều (> 5 trang) và đang ở chế độ thu gọn
      // Giới hạn hiển thị tối đa 7 số đầu tiên
      const visibleCount = Math.min(7, totalPages - 1);
      for (let i = 1; i <= visibleCount; i++) {
        items.push(i);
      }
      // Nếu tổng số trang lớn hơn số trang đang hiển thị, thêm nút '...' và số trang cuối cùng
      if (totalPages > visibleCount) {
        items.push("...");
        items.push(totalPages);
      }
    }

    // Biến đổi mảng items thành chuỗi các thẻ <li> và gán vào paginationList
    paginationList.innerHTML = items
      .map((item) => {
        // Nếu phần tử là dấu '...' -> Gán thuộc tính data-action="expand" để bắt sự kiện click mở rộng
        if (item === "...") {
          return `<li class="pagination-element" data-action="expand">...</li>`;
        }
        // Nếu số trang trùng với currentPage hiện tại -> Thêm class 'highlight' để làm nổi bật nút đang chọn
        const isActive = item === currentPage ? "highlight" : "";
        // Trả về thẻ <li> chứa số trang kèm thuộc tính data-page để lấy số trang khi click
        return `<li class="pagination-element ${isActive}" data-page="${item}">${item}</li>`;
      })
      .join("");
  }

  // ==========================================
  // 6. GẮN SỰ KIỆN XÓA & SỬA CHO TỪNG HÀNG TRONG BẢNG
  // ==========================================
  // Khai báo hàm duyệt qua các hàng hiện có trên bảng để gắn sự kiện click cho nút Xóa và Sửa
  function attachEvents(pageUsers = []) {
    // Nếu không có thẻ tbody, dừng hàm
    if (!tableBody) return;
    // Lấy tất cả các thẻ <tr> đang có trong tbody
    const rows = tableBody.querySelectorAll("tr");
    // Lặp qua danh sách user của trang hiện tại theo chỉ số index tương ứng với từng thẻ <tr>
    pageUsers.forEach((user, index) => {
      // Lấy thẻ <tr> tương ứng với user
      const row = rows[index];
      if (!row) return;

      // Tìm nút thùng rác (Xóa) trong hàng đó
      const trashBtn = row.querySelector(".fa-trash");
      // Tìm nút cây bút (Sửa) trong hàng đó
      const penBtn = row.querySelector(".fa-pen");

      // Xử lý sự kiện khi bấm nút Xóa
      if (trashBtn) {
        trashBtn.onclick = () => {
          // Bật popup xác nhận của trình duyệt để tránh người dùng bấm nhầm
          if (confirm(`Bạn có chắc muốn xóa user "${user.username}" (${user.usercode})?`)) {
            // Lọc bỏ user có usercode này ra khỏi mảng dữ liệu gốc
            users = users.filter(u => u.usercode !== user.usercode);
            // Ghi đè lại mảng dữ liệu mới vào LocalStorage
            localStorage.setItem("userList", JSON.stringify(users));
            // Đồng thời lọc bỏ user đó khỏi mảng đang lọc hiển thị
            filteredUsers = filteredUsers.filter(u => u.usercode !== user.usercode);
            // Vẽ lại toàn bộ giao diện sau khi xóa thành công
            updateUI();
          }
        };
      }

      // Xử lý sự kiện khi bấm nút Sửa
      if (penBtn) {
        penBtn.onclick = () => {
          // Lưu tạm thông tin user đang được chọn sửa vào sessionStorage với key "userEdit"
          sessionStorage.setItem("userEdit", JSON.stringify(user));
          // Chuyển hướng trình duyệt sang trang chỉnh sửa người dùng
          window.location.href = "./edit-user.html";
        };
      }
    });
  }

  // ==========================================
  // 7. HÀM ĐỒNG BỘ & CẬP NHẬT TOÀN BỘ GIAO DIỆN (UI)
  // ==========================================
  // Khai báo hàm trung tâm điều phối việc chia trang, vẽ bảng, gán sự kiện và vẽ phân trang
  function updateUI() {
    // Cắt mảng filteredUsers thành các trang dựa trên kích thước ITEMS_PER_PAGE
    const pages = splitIntoPages(filteredUsers, ITEMS_PER_PAGE);
    // Tính tổng số trang hiện có
    const totalPages = pages.length;

    // Đảm bảo currentPage không vượt quá tổng số trang (xảy ra khi vừa xóa hết phần tử ở trang cuối)
    if (currentPage > totalPages) currentPage = totalPages || 1;
    // Đảm bảo currentPage không nhỏ hơn trang 1
    if (currentPage < 1) currentPage = 1;

    // Lấy mảng con chứa các user của trang hiện tại (mảng 0-indexed nên dùng currentPage - 1)
    const currentItems = pages[currentPage - 1] || [];
    
    // Bước 1: Render các hàng dữ liệu của trang hiện tại vào bảng
    renderTable(currentItems);
    // Bước 2: Gắn lại sự kiện Xóa/Sửa cho các phần tử vừa tạo mới
    attachEvents(currentItems);
    // Bước 3: Render lại danh sách nút phân trang
    renderListPagination(totalPages);
  }

  // ==========================================
  // 8. XỬ LÝ SỰ KIỆN CLICK TRÊN THANH PHÂN TRANG (EVENT DELEGATION)
  // ==========================================
  // Kiểm tra container phân trang có tồn tại không
  if (pagination) {
    // Sử dụng cơ chế Event Delegation (ủy thác sự kiện) để bắt tất cả các click con bên trong #pagination
    pagination.addEventListener("click", (e) => {
      // Phần tử trực tiếp nhận sự kiện click
      const target = e.target;
      // Chia lại trang để lấy chính xác tổng số trang hiện tại
      const pages = splitIntoPages(filteredUsers, ITEMS_PER_PAGE);
      const totalPages = pages.length;

      // Nếu người dùng click vào nút mũi tên trái (Trang trước)
      if (target.classList.contains("arrow-left") || target.closest(".arrow-left")) {
        // Nếu chưa phải trang đầu tiên thì giảm số trang đi 1 và vẽ lại UI
        if (currentPage > 1) {
          currentPage--;
          updateUI();
        }
        return;
      }

      // Nếu người dùng click vào nút mũi tên phải (Trang sau)
      if (target.classList.contains("arrow-right") || target.closest(".arrow-right")) {
        // Nếu chưa phải trang cuối cùng thì tăng số trang lên 1 và vẽ lại UI
        if (currentPage < totalPages) {
          currentPage++;
          updateUI();
        }
        return;
      }

      // Nếu người dùng click vào dấu '...' (mở rộng trang)
      if (target.dataset.action === "expand") {
        // Đặt cờ mở rộng thành true
        isExpanded = true;
        // Vẽ lại toàn bộ các nút trang đầy đủ
        renderListPagination(totalPages);
        return;
      }

      // Nếu người dùng click vào một nút số trang cụ thể
      const pageBtn = target.closest("[data-page]");
      if (pageBtn) {
        // Lấy số trang từ thuộc tính data-page và chuyển thành số nguyên hệ cơ số 10
        currentPage = parseInt(pageBtn.dataset.page, 10);
        // Cập nhật giao diện sang trang vừa chọn
        updateUI();
      }
    });
  }

  // ==========================================
  // 9. CHỨC NĂNG TÌM KIẾM NGƯỜI DÙNG
  // ==========================================
  // Khai báo hàm tìm kiếm với tham số exactMatch (mặc định là false - tìm kiếm gần đúng)
  function handleSearch(exactMatch = false) {
    // Lấy từ khóa nhập vào, cắt khoảng trắng 2 đầu và chuyển chữ thường để so sánh không phân biệt hoa/thường
    const query = searchBox ? searchBox.value.trim().toLowerCase() : "";
    // Reset trạng thái mở rộng phân trang về thu gọn
    isExpanded = false;
    // Đưa người dùng quay về trang đầu tiên khi có kết quả tìm kiếm mới
    currentPage = 1;

    // Nếu ô tìm kiếm trống: Khôi phục lại toàn bộ danh sách người dùng
    if (!query) {
      filteredUsers = [...users];
    // Nếu tìm kiếm chính xác (khi bấm icon kính lúp): So sánh username bằng tuyệt đối (===) với query
    } else if (exactMatch) {
      filteredUsers = users.filter(
        (u) => (u.username || "").toLowerCase() === query
      );
    // Nếu tìm kiếm gần đúng (khi gõ realtime): Kiểm tra query có nằm trong chuỗi username bằng .includes()
    } else {
      filteredUsers = users.filter((u) =>
        (u.username || "").toLowerCase().includes(query)
      );
    }

    // Cập nhật lại toàn bộ bảng và phân trang sau khi lọc dữ liệu
    updateUI();
  }

  // Khi click vào icon kính lúp -> Kích hoạt tìm kiếm chính xác (exactMatch = true)
  if (searchIcon) searchIcon.addEventListener("click", () => handleSearch(true));
  // Khi người dùng gõ vào ô tìm kiếm -> Kích hoạt tìm kiếm gần đúng thời gian thực (exactMatch = false)
  if (searchBox) searchBox.addEventListener("input", () => handleSearch(false));

  // ==========================================
  // 10. RENDER BAN ĐẦU KHI TẢI TRANG
  // ==========================================
  // Gọi hàm updateUI lần đầu tiên để nạp dữ liệu lên bảng ngay khi tải trang xong
  updateUI();
});