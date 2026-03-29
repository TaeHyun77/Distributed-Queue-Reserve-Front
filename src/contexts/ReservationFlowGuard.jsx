import Cookies from 'js-cookie';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as auth from "../api/auth";

export const ReservationFlowContext = React.createContext();

const FLOW_PATHS = ['/performance_schedule', '/seat', '/payment'];

const isFlowPath = (pathname) => FLOW_PATHS.some(p => pathname.startsWith(p));

const ReservationFlowGuard = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const prevPathRef = useRef(location.pathname);

    const [secondsLeft, setSecondsLeft] = useState(() => {
        const expire = parseInt(localStorage.getItem('expireTime') || '0', 10);
        return Math.max(Math.floor((expire - Date.now()) / 1000), 0);
    });

    const cancelAndCleanup = useCallback(() => {
        const userId = localStorage.getItem('user_id');
        const queueType = localStorage.getItem('reserve_queue_type')?.split(':')[0];

        if (!userId || !queueType) return;

        auth.cancelQueue({ userId, queueType }).catch(() => {});

        sessionStorage.removeItem(`timerStarted_${userId}`);
        localStorage.removeItem('user_id');
        localStorage.removeItem('expireTime');
        localStorage.removeItem('reserve_queue_type');
        localStorage.removeItem('performance_id');
        Cookies.remove(`reserve-user-access-cookie-${userId}`);
    }, []);

    // 경로 전환 감지: flow → non-flow 이동 시 cancel
    useEffect(() => {
        const prevPath = prevPathRef.current;
        const currentPath = location.pathname;
        prevPathRef.current = currentPath;

        const wasInFlow = isFlowPath(prevPath);
        const isInFlow = isFlowPath(currentPath);

        if (wasInFlow && !isInFlow) {
            cancelAndCleanup();
        }
    }, [location.pathname, cancelAndCleanup]);

    // 공유 타이머: flow 페이지에서만 동작
    useEffect(() => {
        if (!isFlowPath(location.pathname)) {
            setSecondsLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const expire = parseInt(localStorage.getItem('expireTime') || '0', 10);
            const remaining = Math.floor((expire - Date.now()) / 1000);

            if (expire > 0 && remaining <= 0) {
                clearInterval(interval);
                cancelAndCleanup();
                alert("시간이 만료되어 예매가 취소되었습니다.");
                navigate('/');
            } else {
                setSecondsLeft(Math.max(remaining, 0));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [location.pathname, cancelAndCleanup, navigate]);

    // beforeunload: flow 페이지에서 탭 닫기 시 경고
    useEffect(() => {
        if (!isFlowPath(location.pathname)) return;

        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [location.pathname]);

    return (
        <ReservationFlowContext.Provider value={{ secondsLeft }}>
            {children}
        </ReservationFlowContext.Provider>
    );
};

export default ReservationFlowGuard;
