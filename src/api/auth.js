import api from './api';

// --- 유저 ---

// 로그인
export const login = (username, password) =>
    api.post('http://localhost:8080/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

// 회원가입
export const join = (data) => api.post(`/api/member/save`, data);

export const info = () => api.get(`/api/member/info`)

// 유저 이름 유효성 검사
export const checkUsername = (username) => api.get(`/api/member/check/validation/${username}`)


// --- 공연 정보 ---
export const venueList = () => api.get(`/api/venue/list`)

export const seatList = (screenInfoId) => api.get(`/api/seat/list/${screenInfoId}`)

export const seatPrice = (performanceId) => api.get(`/api/seat/price/${performanceId}`)


// --- 예약 ---
export const payAndReserve = (seatsInfo, headers = {}) => {
    return api.post(`/api/reserve/reserve`, seatsInfo, { headers });
};

export const payRewardToday = (today, headers = {}) => { return api.post(`/api/member/reward/${today}`, null, { headers }) }

export const cancelReservation = (reserveNumber, headers = {}) => {
    return api.delete(`/api/reserve/delete/${reserveNumber}`, {
        headers
    });
}


// --- 대기열 ---

// 대기열 등록
export const register = (queueType, userId, headers = {}) => {
    return api.post(
        `/queue/register/${userId}/${queueType}`,
        {},
        { headers }
    );
}

// 허용열에서 등록 취소
export const cancelRegister = (userId, queueType, category) => api.delete(
    `http://localhost:8079/queue/cancel?userId=${userId}&queueType=${queueType}&queueCategory=${category}`
)
