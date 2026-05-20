# Cung đường diễu hành Phật Đản

Hiển thị cung đường diễu hành trên bản đồ OpenLayers.

## Tech Stack

- React + TypeScript (Vite 5)
- OpenLayers (ol)
- Ant Design (@ant-design/icons)

## Development

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Project Structure

- `src/App.tsx` — component chính, khởi tạo map OpenLayers với OSM layer, vector layer (route line + markers)
- `src/route-data.ts` — định nghĩa các điểm trên cung đường (lon/lat), sinh LineString và Point features, OSRM segments cho đường đi thực tế
- Các điểm đầu/cuối được đánh dấu riêng (xanh lá / đỏ), click vào marker hiển thị popup tên điểm

## Route (20 điểm)

0. Chùa Đào Xuyên
1. Ngã Tư Đa Tốn
2. Đường Giáp Hải
3. Cầu vượt Thanh Trì EcoPark
4. Cầu Phù Đổng
5. Đường đê Đền Gióng
6. Đường Phù Đổng
7. Đường Ninh Hiệp
8. Đường Đặng Công Chất
9. Đường Hà Huy Tập
10. Ngã tư Yên Viên
11. Đường đê Đuống
12. Cầu Phù Đổng
13. Đường Nguyễn Đức Thuận
14. Ngã tư Trâu Quỳ
15. Đường Cổ Bi
16. Đường Ỷ Lan
17. Ngã Tư Phú Thụy
18. Đường Dương Đức Hiền
19. Chùa Keo

## Lưu ý

- Node.js >= 20 (project dùng Vite 5)
- Build: `tsc -b && vite build`
- Server chạy port 5176
- Tọa độ tra cứu từ web, OSRM dùng để tính đường đi thực tế giữa các điểm
