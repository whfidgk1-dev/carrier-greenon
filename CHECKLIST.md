# Carrier GreenON 개발 체크리스트

## PHASE 1 — 기본 웹앱

- [x] 프로젝트 기본 구조 생성
- [x] White + Blue 디자인 시스템
- [x] 모바일 반응형 레이아웃
- [x] 하단 Navigation
- [x] 홈 화면


## PHASE 2 — 에어컨 상태

- [x] 가상 Carrier 에어컨 데이터
- [x] POWER 상태
- [x] 냉방 MODE
- [x] 설정온도
- [x] FAN 상태
- [x] 사용시간
- [x] 필터 상태
- [x] 정상 상태 Blue UI
- [x] 비정상 상태 Red UI
- [x] 상태 시뮬레이션 패널


## PHASE 3 — GREEN MISSION

- [x] 오늘의 미션
- [x] 미션 참여
- [x] 미션 진행 상태
- [x] 진행률 표시
- [x] 시간 +30분 시뮬레이션
- [x] 미션 조건 확인
- [x] 미션 Warning
- [x] 미션 성공
- [x] 미션 실패


## PHASE 4 — GREEN POINT

- [x] 미션 성공 시 포인트 지급
- [x] GREEN WALLET
- [x] 현재 포인트
- [x] 포인트 적립 기록
- [x] 포인트 사용 기록


## PHASE 5 — REWARD SHOP

- [x] 리워드 상품 목록
- [x] FOOD 카테고리
- [x] LIFE 카테고리
- [x] CARRIER 카테고리
- [x] 상품 상세
- [x] 포인트 구매
- [x] 포인트 차감
- [x] 포인트 부족 Warning
- [x] 구매내역


## PHASE 6 — 사용자

- [x] 회원가입 (원격 Auth 사용자 생성 확인)
- [x] 로그인 (실제 이메일 인증·비밀번호 로그인 PASS)
- [x] 로그아웃 (Supabase Auth 연동 구현)
- [x] MY 페이지
- [x] GREEN LEVEL
- [x] GREEN REPORT


## PHASE 7 — Supabase

> 원격 `carrier-greenon` 프로젝트 연결 완료. 테이블/RLS/보호된 RPC와 Auth 트리거를 원격에서 직접 확인했습니다.

> 2026-08-11: 원격 마이그레이션 3개와 publishable key를 연결했고 앱 필드/RPC를 원격 스키마에 맞게 전환했습니다.

- [x] Supabase 프로젝트 연결
- [x] Auth 연결
- [x] profiles 테이블
- [x] missions 테이블
- [x] user_missions 테이블
- [x] point_transactions 테이블
- [x] rewards 테이블
- [x] reward_orders 테이블
- [x] aircon_status 테이블
- [x] GREEN LEVEL 데이터
- [x] RLS 설정
- [x] 사용자별 데이터 접근 테스트 (JWT 소유자 모사 + RLS owner read assertion 통과)


## PHASE 8 — 실제 DB 전환

- [x] 임시 사용자 데이터 제거
- [x] 임시 포인트 데이터 제거
- [x] GREEN POINT Supabase 저장
- [x] 미션 기록 Supabase 저장
- [x] 상품 데이터 Supabase 연결
- [x] 구매내역 Supabase 저장
- [x] 새로고침 후 데이터 유지 (원격 테이블 영속 구조 및 재조회 검증)
- [x] 다른 기기 로그인 테스트 (독립 클라이언트 2개 데이터 일치 PASS)

> 2026-08-12 원격 롤백 트랜잭션 assertion: 미션 성공, 300P 적립, 250P 구매, 잔액 50P, 포인트/구매 기록, 소유자 RLS 조회 모두 PASS. 테스트 데이터 변경 없음.


## PHASE 9 — 날씨

- [x] 샘플 날씨 데이터
- [x] 날씨 API 연결 구조
- [x] 외부온도 표시
- [x] 습도 표시
- [x] 날씨 조건별 미션


## PHASE 10 — 배포 준비

- [x] 환경변수 분리
- [x] .env.example
- [x] API Key 노출 검사
- [x] production build 확인
- [x] Git 저장소 정리
- [x] README 작성


## PHASE 11 — Render 배포

> Render `My Workspace` 배포 완료: https://carrier-greenon-elk8.onrender.com (2026-08-12 공개 URL E2E PASS)

- [x] Render 서비스 생성
- [x] Git 저장소 연결 (`whfidgk1-dev/carrier-greenon`)
- [x] 환경변수 등록
- [x] Build 성공
- [x] 배포 성공
- [x] 배포 URL 접속
- [x] 회원가입 테스트
- [x] 로그인 테스트
- [x] 미션 테스트
- [x] 포인트 적립 테스트
- [x] Reward 구매 테스트


## PHASE 12 — 광주 시간별 날씨

> 외부 날씨 API 없이 광주의 가상 여름 기온 데이터를 현재 시각부터 24시간 동안 한 시간 단위로 표시합니다.

- [x] 날씨 지역 광주 변경
- [x] 현재 시각 기준 기온 표시
- [x] 한 시간 단위 24시간 기온 데이터
- [x] 자정 이후 내일 표기
- [x] 모바일 가로 스크롤
- [x] 시간별 날씨 단위 테스트
- [x] 모바일 브라우저 표시 및 스크롤 검증


## PHASE 13 — 곰 캐릭터 연어 애니메이션

- [x] 곰 캐릭터 식사 자세 이미지
- [x] 연어 이동 애니메이션
- [x] 연어 먹은 뒤 사라짐 및 재등장
- [x] 2.8초 무한 반복
- [x] 모션 최소화 접근성 대응
- [x] 모바일 시작·먹기·완료 프레임 검증


## FINAL CHECK

- [x] PROJECT.md 요구사항 누락 검사
- [x] 모바일 화면 검사
- [x] 정상 상태 Blue 확인
- [x] Warning/Error Red 확인
- [x] Supabase 보안 정적 확인 (RLS/권한/브라우저 secret 미노출)
- [x] 전체 로컬 기능 회귀 테스트
- [x] 최종 배포 확인
