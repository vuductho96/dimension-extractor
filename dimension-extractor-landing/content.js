/*
 * CHỈNH NỘI DUNG WEBSITE TẠI ĐÂY
 * ----------------------------------------------------
 * Bạn có thể đổi tên sản phẩm, tiêu đề, mô tả, tính năng,
 * quy trình, FAQ và CTA mà không cần chạm vào HTML/CSS.
 */

window.SITE_CONTENT = {
  brand: {
    name: "Dimension Extractor",
    tagline: "OCR bản vẽ dành cho đội ngũ kỹ thuật.",
  },
  nav: {
    cta: "Dùng thử",
  },
  hero: {
    title: "Biến bản vẽ kỹ thuật thành dữ liệu có cấu trúc.",
    description:
      "Phát hiện kích thước, dung sai và ký hiệu. Kiểm tra, chỉnh sửa và xuất Excel trong một quy trình rõ ràng.",
    primaryCta: "Thử với bản vẽ mẫu",
    secondaryCta: "Xem quy trình",
  },
  features: {
    title: "Đọc đúng thứ kỹ sư cần.",
    description:
      "Tập trung vào dữ liệu kiểm tra, không biến bản vẽ thành một mớ văn bản.",
    items: [
      {
        icon: "measure",
        title: "Bắt kích thước & dung sai",
        description: "Nhận diện số đo, Ø, R, góc và dung sai hai phía.",
      },
      {
        icon: "steps",
        title: "Gom dữ liệu theo STEP",
        description: "Sắp xếp kết quả theo trình tự kiểm tra rõ ràng.",
      },
      {
        icon: "edit",
        title: "Sửa nhanh trước khi xuất",
        description: "Chỉnh số, trạng thái và đánh dấu kích thước quan trọng.",
      },
      {
        icon: "excel",
        title: "Xuất Excel sạch",
        description: "Dữ liệu sẵn sàng cho QA, so sánh lot và lưu hồ sơ.",
      },
    ],
  },
  workflow: {
    title: "Từ PDF đến Excel trong 4 bước.",
    description:
      "Một luồng làm việc đủ ngắn để dùng hằng ngày, đủ rõ để kiểm soát kết quả.",
    steps: [
      { icon: "upload", title: "Thả bản vẽ", description: "PDF hoặc ảnh scan." },
      { icon: "select", title: "Khoanh vùng", description: "Quét toàn trang hoặc chọn vùng cần đọc." },
      { icon: "check", title: "Kiểm tra", description: "Sửa số, dung sai và trạng thái." },
      { icon: "excel", title: "Xuất dữ liệu", description: "Excel sẵn cho báo cáo QA." },
    ],
  },
  example: {
    title: "Một vùng quét. Một dòng dữ liệu rõ ràng.",
    description:
      "Kết quả giữ đúng ngữ cảnh kỹ thuật để bạn kiểm tra nhanh trước khi đưa vào báo cáo.",
  },
  faq: {
    title: "Câu hỏi thường gặp.",
    items: [
      {
        question: "Công cụ đọc được định dạng nào?",
        answer:
          "Có thể xử lý PDF và các định dạng ảnh phổ biến như PNG, JPG. Bản demo trên trang chạy hoàn toàn ở trình duyệt.",
      },
      {
        question: "Có nhận diện dung sai và ký hiệu Ø, R không?",
        answer:
          "Có. Giao diện được thiết kế riêng cho kích thước, dung sai một hoặc hai phía, đường kính, bán kính và góc.",
      },
      {
        question: "Dữ liệu có thể chỉnh sửa trước khi xuất không?",
        answer:
          "Có. Người dùng có thể kiểm tra, sửa giá trị, đổi trạng thái và đánh dấu kích thước quan trọng trước khi xuất.",
      },
      {
        question: "Website có cần máy chủ để chạy không?",
        answer:
          "Không. Landing page này là website tĩnh, có thể mở trực tiếp hoặc đưa lên bất kỳ dịch vụ hosting tĩnh nào.",
      },
    ],
  },
  cta: {
    title: "Bắt đầu với một bản vẽ thật.",
    description:
      "Thả bản vẽ mẫu, xem dữ liệu được tách ra và quyết định phần nào cần kiểm tra lại.",
  },
};
