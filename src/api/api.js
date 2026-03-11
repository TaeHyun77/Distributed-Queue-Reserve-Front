import axios from 'axios';
import Cookies from 'js-cookie';

const PUBLIC_URLS = [
  '/login',
  '/api/member/create',
  '/api/member/check/validation',
  '/api/reToken'
];

const isPublicUrl = (url) => PUBLIC_URLS.some(u => url?.includes(u));

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

const reTokenApi = axios.create({
  baseURL: 'http://localhost:8080',
});

// 요청 인터셉터 - 공개 API는 토큰 붙이지 않음
api.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken && !isPublicUrl(config.url)) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 공개 API는 reToken 시도 안 함
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicUrl(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const response = await reTokenApi.post('/api/reToken', {}, { withCredentials: true });
        const newAccessToken = response.headers.access;

        Cookies.set('accessToken', newAccessToken, { secure: true, sameSite: 'Strict' });
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (err) {
        console.error('Refresh token 만료 또는 오류');
        Cookies.remove('accessToken');
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;