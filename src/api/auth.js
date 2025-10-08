import api from './api';

// 로그인
export const login = (username, password) =>
    api.post('http://localhost:8080/login', new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
// 회원가입
export const join = (data) => api.post(`/api/member/save`, data);

// 유저 정보
export const info = () => api.get(`/api/member/info`)

export const venueList = () => api.get(`/api/venue/list`)

export const checkUsername = (username) => api.get(`/api/member/check/validation/${username}`)


export const seatList = (screenInfoId) => api.get(`/api/seat/list/${screenInfoId}`)

export const seatPrice = (performanceId) => api.get(`/api/seat/price/${performanceId}`)


export const reserveSeat = (seatsInfo, headers = {}) => {
    return api.post(`/api/reserve/reserve`, seatsInfo, { headers });
};


export const payRewardToday = (today, headers = {}) => { return api.post(`/api/member/reward/${today}`, null, { headers }) }


export const cancelReservation = (reserveNumber, headers = {}) => {
    return api.delete(`http://localhost:8079/api/reserve/delete/${reserveNumber}`, {
        headers
    });
}


export const register = (queueType, userId, headers = {}) => {
    return api.post(
        `/queue/register/${userId}/${queueType}`,
        {},
        { headers }
    );
}