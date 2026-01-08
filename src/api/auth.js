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


// --- 공연 정보 ---
export const venueList = () => api.get(`/api/venue/get/list`)

export const seatList = (screenInfoId) => api.get(`/api/seat/get/list/${screenInfoId}`)

export const seatPrice = (performanceId) => api.get(`/api/seat/price/${performanceId}`)

export const performanceScheduleList = (venueId, performanceId) => api.get(`/api/performanceSchedule/get/list/${venueId}/${performanceId}`);

export const performanceList = (venueId) => api.get(`/api/performance/get/list/${venueId}`);

export const performanceScheduleId = (venueId, performanceId) => api.get(`/api/performanceSchedule/get/${venueId}/${performanceId}`)


// --- 예약 ---
export const payAndReserve = (seatsInfo, headers = {}) => {
    return api.post(`/api/reserve`, seatsInfo, { headers });
};

export const payRewardToday = (headers = {}) => { return api.post(`/api/member/get/reward`, null, { headers }) }

export const cancelReservation = (reserveNumber, headers = {}) => {
    return api.delete(`/api/reserve/delete/${reserveNumber}`, {
        headers
    });
}


// --- 대기열 ---

// 대기열 등록
export const register = (body, headers = {}) => {
    return api.post(
        `http://localhost:8081/queue/register`, body, { headers }
    );
}

// 허용열에서 등록 취소
export const cancelQueue = (queueCategory, body) => {
    return api.post(`http://localhost:8081/queue/cancel/${queueCategory}`, body);
};

export const tokenValidation = (body, token) => api.post(
    `http://localhost:8081/queue/isValidateToken/${token}`, body
)

export const createQueueCookie = (queueType, userId) =>
    api.get("http://localhost:8081/queue/create/cookie", {
        params: { queueType, userId },
        withCredentials: true,
    });