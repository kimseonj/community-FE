# 종주메이트 FE

바닐라 JS 프론트를 React + Vite 기반으로 다시 구성한 모바일 우선 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

로컬 기본값은 `/api` 요청을 `http://localhost:8080` 백엔드로 프록시합니다. 백엔드 포트가 다르면 `.env`에 `VITE_PROXY_TARGET`을 지정하세요.

## 배포

`main` 브랜치에 push되면 GitHub Actions가 `npm ci`, `npm run lint`, `npm run build`를 실행한 뒤 GitHub Pages로 `dist/`를 배포합니다.

운영 API 주소는 GitHub repository secret `VITE_API_BASE_URL`에 넣습니다.

## 구현 범위

- 로그인, 회원가입, 로그아웃
- 게시글 목록, 상세, 작성, 수정, 삭제
- 댓글 목록, 작성, 수정, 삭제
- 좋아요 상태 조회 및 토글
- 코스 목록, 알림받기 등록/취소, 상태 제보
- 인앱 알림 조회/읽음 처리
- 관리자 권한 확인과 제보 수정·삭제 화면

서비스 범위와 백엔드 추가 필요 항목은 [SERVICE_PLAN.md](./SERVICE_PLAN.md)에 정리되어 있습니다.
