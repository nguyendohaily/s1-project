document.addEventListener("DOMContentLoaded", async () => {
  // 1. Cấu hình & Khởi tạo/Lấy dữ liệu từ localStorage
  const ITEMS_PER_PAGE = 5;
  let currentPage = 1;
  let isExpanded = false;

  async function initUsersData() {
    const data = localStorage.getItem("userList");
    if (!data) {
      try {
        const response = await fetch("./users.json"); 
        const jsonUsers = await response.json();
        localStorage.setItem("userList", JSON.stringify(jsonUsers));
      } catch (error) {
        console.error("Lỗi khi load file users.json:", error);
      }
    }
  }

  function getStoredUsers() {
    const data = localStorage.getItem("userList");
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return parsed.sort((a, b) =>
        (a.usercode || "").localeCompare(b.usercode || "", undefined, { numeric: true })
      );
    } catch {
      return [];
    }
  }

  // Chờ nạp dữ liệu từ json vào localStorage (nếu có) trước khi lấy ra dùng
  await initUsersData();

  let users = getStoredUsers();
  let filteredUsers = [...users];

  // 2. Lấy các phần tử DOM cần thiết
  const searchBox = document.querySelector("#search-box");
  const searchIcon = document.querySelector(".fa-magnifying-glass");
  const tableBody = document.querySelector("#table-body");
  const pagination = document.querySelector("#pagination");
  const paginationList = document.querySelector("#pagination-list");

  function dateConvert(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  // 3. Hàm phân trang (splitIntoPages) -> Trả về mảng 2 chiều
  function splitIntoPages(list, pageSize) {
    const pages = [];
    for (let i = 0; i < list.length; i += pageSize) {
      pages.push(list.slice(i, i + pageSize));
    }
    return pages;
  }

  // 4. Hàm render bảng (renderTable)
  function renderTable(pageUsers = []) {
    if (!tableBody) return;
    if (!pageUsers.length) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px;">No users found</td></tr>`;
      return;
    }

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

  // 5. Hàm render danh sách nút pagination (renderListPagination)
  function renderListPagination(totalPages) {
    if (!paginationList) return;
    paginationList.innerHTML = "";
    if (totalPages <= 0) return;

    const items = [];

    if (totalPages <= 5 || isExpanded) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      const visibleCount = Math.min(7, totalPages - 1);
      for (let i = 1; i <= visibleCount; i++) {
        items.push(i);
      }
      if (totalPages > visibleCount) {
        items.push("...");
        items.push(totalPages);
      }
    }

    paginationList.innerHTML = items
      .map((item) => {
        if (item === "...") {
          return `<li class="pagination-element" data-action="expand">...</li>`;
        }
        const isActive = item === currentPage ? "highlight" : "";
        return `<li class="pagination-element ${isActive}" data-page="${item}">${item}</li>`;
      })
      .join("");
  }

  // 6. Gắn sự kiện click cho #table-body (Xóa & Sửa)
  function attachEvents(pageUsers = []) {
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll("tr");
    pageUsers.forEach((user, index) => {
      const row = rows[index];
      if (!row) return;

      const trashBtn = row.querySelector(".fa-trash");
      const penBtn = row.querySelector(".fa-pen");

      if (trashBtn) {
        trashBtn.onclick = () => {
          if (confirm(`Bạn có chắc muốn xóa user "${user.username}" (${user.usercode})?`)) {
            users = users.filter(u => u.usercode !== user.usercode);
            localStorage.setItem("userList", JSON.stringify(users));
            filteredUsers = filteredUsers.filter(u => u.usercode !== user.usercode);
            updateUI();
          }
        };
      }

      if (penBtn) {
        penBtn.onclick = () => {
          sessionStorage.setItem("userEdit", JSON.stringify(user));
          window.location.href = "./edit-user.html";
        };
      }
    });
  }

  // 7. Hàm cập nhật toàn bộ UI
  function updateUI() {
    const pages = splitIntoPages(filteredUsers, ITEMS_PER_PAGE);
    const totalPages = pages.length;

    if (currentPage > totalPages) currentPage = totalPages || 1;
    if (currentPage < 1) currentPage = 1;

    const currentItems = pages[currentPage - 1] || [];
    
    renderTable(currentItems);
    attachEvents(currentItems);
    renderListPagination(totalPages);
  }

  // 8. Gắn sự kiện click cho #pagination
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const target = e.target;
      const pages = splitIntoPages(filteredUsers, ITEMS_PER_PAGE);
      const totalPages = pages.length;

      if (target.classList.contains("arrow-left") || target.closest(".arrow-left")) {
        if (currentPage > 1) {
          currentPage--;
          updateUI();
        }
        return;
      }

      if (target.classList.contains("arrow-right") || target.closest(".arrow-right")) {
        if (currentPage < totalPages) {
          currentPage++;
          updateUI();
        }
        return;
      }

      if (target.dataset.action === "expand") {
        isExpanded = true;
        renderListPagination(totalPages);
        return;
      }

      const pageBtn = target.closest("[data-page]");
      if (pageBtn) {
        currentPage = parseInt(pageBtn.dataset.page, 10);
        updateUI();
      }
    });
  }

  // 9. Chức năng tìm kiếm
  function handleSearch(exactMatch = false) {
    const query = searchBox ? searchBox.value.trim().toLowerCase() : "";
    isExpanded = false;
    currentPage = 1;

    if (!query) {
      filteredUsers = [...users];
    } else if (exactMatch) {
      filteredUsers = users.filter(
        (u) => (u.username || "").toLowerCase() === query
      );
    } else {
      filteredUsers = users.filter((u) =>
        (u.username || "").toLowerCase().includes(query)
      );
    }

    updateUI();
  }

  if (searchIcon) searchIcon.addEventListener("click", () => handleSearch(true));
  if (searchBox) searchBox.addEventListener("input", () => handleSearch(false));

  // 10. Render ban đầu khi load trang
  updateUI();
});