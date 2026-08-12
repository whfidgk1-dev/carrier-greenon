# Carrier GreenON

캐리어 에어컨 사용자를 위한 친환경 냉방 미션 + 포인트 리워드 웹앱입니다. 실제 에어컨 API 대신 시뮬레이션 데이터를 사용합니다.

## 로컬 실행

```bash
npm install
copy .env.example .env
npm run dev
```

환경변수가 없으면 데이터가 새로고침 시 초기화되는 데모 모드로 실행됩니다. 실제 저장은 Supabase 프로젝트에서 `supabase/migrations/20260811000000_initial_greenon.sql`을 적용하고 `.env`에 프로젝트 URL과 publishable key를 입력해야 합니다. 브라우저에는 publishable key만 사용하며 secret/service role key를 넣지 마세요.

## Render 배포

Git 저장소를 Render Blueprint로 연결하고 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 등록합니다. `render.yaml`이 빌드와 SPA rewrite를 설정합니다.
