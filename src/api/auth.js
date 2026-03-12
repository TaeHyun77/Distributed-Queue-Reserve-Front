import api from './api';


// --- 유저 ---

// 로그인
export const login = (username, password) =>
    api.post('http://localhost:8080/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

// 회원가입
export const join = (data) => api.post(`/api/member/create`, data);

export const info = () => api.get(`/api/member/info`)

// username 유효성 검사
export const checkUsername = (username) => api.get(`/api/member/check/validation/${username}`)



// --- 공연 ---

// 공연장 목록
export const venueList = () => api.get(`/api/venue/get/list`)

// 공연 목록
export const performanceList = (venueId) => api.get(`/api/performance/get/list/${venueId}`);

// 공연 정보 목록
export const performanceScheduleListByVenueId = (venueId) => api.get(`/api/performanceSchedule/get/list/${venueId}`);

// 공연 정보 목록
export const performanceScheduleList = (venueId, performanceId) => api.get(`/api/performanceSchedule/get/list/${venueId}/${performanceId}`);

// 공연 정보 id
export const performanceScheduleId = (venueId, performanceId) => api.get(`/api/performanceSchedule/get/${venueId}/${performanceId}`)


// 좌석 목록
export const seatList = (screenInfoId) => api.get(`/api/seat/get/list/${screenInfoId}`)

// 좌석 가격
export const seatPrice = (performanceId) => api.get(`/api/seat/price/${performanceId}`)



// --- 예약 ---

// 예약
export const payAndReserve = (seatsInfo, headers = {}) => {
    return api.post(`/api/reserve`, seatsInfo, { headers });
};

// 예약 취소
export const cancelReservation = (reserveNumber, headers = {}) => {
    return api.delete(`/api/reserve/delete/${reserveNumber}`, {
        headers
    });
}

// 리워드 지급
export const payRewardToday = (headers = {}) => { return api.post(`/api/member/get/reward`, null, { headers }) }



// --- 대기열 ---

// 대기열 등록
export const register = (body, headers = {}) => {
    return api.post(
        `http://localhost:8079/queue/register`, body, { headers }
    );
}

// 허용열에서 등록 취소
export const cancelQueue = (body) => {
    return api.post(`http://localhost:8079/queue/cancel`, body);
};

// 토큰 유효성 검사
export const tokenValidation = (body, token) => api.post(
    `http://localhost:8079/queue/isValidateToken/${token}`, body
)

// 토큰 쿠키 저장
export const createQueueCookie = (queueType, userId) =>
    api.get("http://localhost:8079/queue/create/cookie", {
        params: { queueType, userId },
        withCredentials: true,
    });