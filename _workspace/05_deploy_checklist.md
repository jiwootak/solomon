# 모두의 솔로몬 — Vercel 배포 체크리스트

## 1. Supabase 프로젝트 설정

### SQL Editor에서 실행
```
supabase/schema.sql 전체 실행
```

### Authentication > Providers 설정
- **Email**: Enable (기본 활성)
- **Google**: Client ID / Secret 입력 (Google Cloud Console에서 발급)
  - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

### Authentication > URL Configuration
- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URLs 추가:
  - `https://your-vercel-domain.vercel.app/api/auth/callback`
  - `http://localhost:3000/api/auth/callback` (개발용)

### Database > Extensions (선택)
- `pg_cron` 활성화 → `supabase/migrations/001_auto_close_posts.sql` 실행
  (매 5분마다 만료된 게시글 자동 closed 처리)

---

## 2. 환경 변수 (Vercel Dashboard > Settings > Environment Variables)

| 변수명 | 값 출처 | 필수 |
|--------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API | ✅ |
| `NEXT_PUBLIC_SITE_URL` | `https://your-vercel-domain.vercel.app` | ✅ |

---

## 3. Vercel 배포 설정

```bash
# 로컬 빌드 테스트
npm run build

# Vercel CLI로 배포 (처음)
npx vercel --prod
```

### Build & Output Settings (자동 감지)
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

---

## 4. 배포 전 체크리스트

- [ ] `npm run build` 로컬 빌드 통과
- [ ] `npx tsc --noEmit` TypeScript 에러 없음
- [ ] Supabase schema.sql 실행 완료
- [ ] Google OAuth Provider 설정 완료
- [ ] Vercel 환경 변수 3개 입력 완료
- [ ] Supabase Redirect URL에 Vercel 도메인 추가
- [ ] 모바일 브라우저에서 PWA 설치 테스트

---

## 5. 배포 후 기능 테스트 순서

1. 회원가입 (이메일) → 이메일 인증 확인
2. Google 로그인 → 프로필 자동 생성 확인
3. 게시글 작성 (선택지 2개 이상)
4. 다른 계정으로 투표 → 블라인드 확인
5. 24시간 후 (또는 DB에서 수동 `UPDATE posts SET status='closed'`) → 결과 공개 확인
6. 마이페이지 솔로몬 지수 확인
7. 모바일에서 PWA 설치 ("홈 화면에 추가")

---

## 6. 프로덕션 권장 설정

- Supabase `pg_cron` 으로 만료 게시글 자동 종료 (5분 주기)
- Vercel Analytics 활성화 (무료 플랜)
- PWA 아이콘: SVG → 실제 PNG 교체 권장 (iOS Safari 호환성)
