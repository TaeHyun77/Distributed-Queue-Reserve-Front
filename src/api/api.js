import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8079', 
});

// 요청 인터셉터: 요청 시 accessToken을 자동으로 추가
api.interceptors.request.use(

  (config) => {
    const accessToken = Cookies.get('accessToken');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

// 응답 인터셉터: accessToken 만료 시 refresh token으로 새 토큰 요청
api.interceptors.response.use((response) => response,

  async (error) => {

    // 실패한 요청 정보
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      console.log('Access token이 만료되었습니다. 재발급 시도 중...');

      originalRequest._retry = true; // 재시도를 했다는 의미

      try {

        const response = await api.post('/api/reToken', {}, { withCredentials: true });

        console.log(response)

        const newAccessToken = response.headers.access;

        Cookies.set('accessToken', newAccessToken, { secure: true, sameSite: 'Strict' });

        console.log('Access token이 성공적으로 재발급되었습니다.');

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (err) {
        console.error('Refresh token이 만료되었거나 오류가 발생했습니다. 로그아웃 처리 필요.');

        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
