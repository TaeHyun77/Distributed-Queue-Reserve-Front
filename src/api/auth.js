import api from './api';


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

// 예약
export const payAndReserve = (seatsInfo, headers = {}) => {
    return api.post('/reserve', seatsInfo, { headers });
};

// 예약 취소
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
    return api.post('/queue/register', body, { headers });
};

// 허용열에서 등록 취소
export const cancelQueue = (body) => {
    return api.post('/queue/cancel', body);
};

// 토큰 유효성 검사
export const tokenValidation = (body, token) => api.post(
    `/queue/isValidateToken/${token}`, body
);

// 토큰 쿠키 저장
export const createQueueCookie = (queueType, userId) =>
    api.get('/queue/create/cookie', {
        params: { queueType, userId },
        withCredentials: true,
    });