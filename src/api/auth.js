import api from './api';

// 대기열 서비스는 별도 포트(8079)를 사용 - 나머지 API는 api 인스턴스 기본값(8080)
const QUEUE_BASE_URL = 'http://localhost:8079';


// --- 유저 ---

// 로그인
export const login = (username, password) =>
    api.post('/reserve/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

// 회원가입
export const join = (data) => api.post('/reserve/member/create', data);

// 회원 정보
export const info = () => api.get('/reserve/member/info');

export const sendEmailCode = (email) => api.post("/member/email/send-code", { email });    
                                                                                            
export const verifyEmailCode = (email, code) => api.post("/member/email/verify-code", { email, code });

// username 유효성 검사
export const checkUsername = (username) => api.get(`/reserve/member/check/validation/${username}`);


// --- 공연 ---

// 공연장 목록
export const venueList = () => api.get('/reserve/venue/get/list');

// 공연 스케줄 목록 (공연장별)
export const performanceScheduleListByVenueId = (venueId) => api.get(`/reserve/performanceSchedule/get/list/${venueId}`);

// 공연 스케줄 목록 (공연장 + 공연별)
export const performanceScheduleList = (venueId, performanceId) => api.get(`/reserve/performanceSchedule/get/list/${venueId}/${performanceId}`);

// 좌석 목록
export const seatList = (screenInfoId) => api.get(`/reserve/seat/get/list/${screenInfoId}`);

// 좌석 가격
export const seatPrice = (performanceId) => api.get(`/reserve/seat/price/${performanceId}`);



// --- 예약 ---

// 좌석 선점 (결제창 진입 전 호출, 응답: { heldUntil })
export const holdSeats = (body) =>
    api.post('/reserve/hold', body);

// 결제 확정 (idempotency-key 헤더 필수, 재시도 시 같은 키 재사용)
export const confirmReservation = (body, headers = {}) =>
    api.post('/reserve/confirm', body, { headers });

// 좌석 선점 해제 (결제창 이탈 시 즉시 반납, 미호출 시 5분 후 자동 해제)
export const releaseSeats = (body) =>
    api.post('/reserve/release', body);

// 예약 취소 (예약 완료 후 취소용 — 결제창 흐름과 무관)
export const cancelReservation = (reserveNumber, headers = {}) => {
    return api.delete(`/reserve/delete/${reserveNumber}`, { headers });
};

// 리워드 지급
export const payRewardToday = (headers = {}) => {
    return api.post('/reserve/member/get/reward', null, { headers });
};


// 좌석 목록
export const getMyReservations = () => api.get(`/reserve/get/list`);


// --- 대기열 ---

// 대기열 등록
export const register = (body, headers = {}) => {
    return api.post('/queue/register', body, { headers, baseURL: QUEUE_BASE_URL });
};

// 허용열에서 등록 취소
export const cancelQueue = (body) => {
    return api.post('/queue/cancel', body, { baseURL: QUEUE_BASE_URL });
};

// 토큰 유효성 검사
export const tokenValidation = (body, token) => api.post(
    `/queue/isValidateToken/${token}`, body, { baseURL: QUEUE_BASE_URL }
);

// 토큰 쿠키 저장
export const createQueueCookie = (queueType, userId) =>
    api.get('/queue/create/cookie', {
        params: { queueType, userId },
        withCredentials: true,
        baseURL: QUEUE_BASE_URL,
    });

// 새로고침 시 대기열 맨 뒤로 이동 — SSE 연결 전에 호출해야 init이 밀린 순번을 전달함
export const moveToTail = (queueType, userId) =>
    api.post('/queue/move-to-tail', { queueType, userId }, { baseURL: QUEUE_BASE_URL });