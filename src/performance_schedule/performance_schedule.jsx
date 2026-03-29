import Cookies from 'js-cookie';
import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import * as auth from "../api/auth";
import { LoginContext } from "../contexts/LoginContextProvider";
import { ReservationFlowContext } from "../contexts/ReservationFlowGuard";
import Header from "../page/header/Header";
import "./performance_schedule.css";

const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
};

const PerformanceSchedule = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const { isLogin, authReady } = useContext(LoginContext);
    const { secondsLeft } = useContext(ReservationFlowContext);

    useEffect(() => {
        if (authReady && !isLogin) navigate("/");
    }, [authReady, isLogin, navigate]);

    const { venueId, performanceId } = useParams();
    const { reserveQueueType } = location.state || {};

    const [performanceScheduleList, setPerformanceScheduleList] = useState({});

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    const getPerformanceScheduleList = async () => {
        try {
            const response = await auth.performanceScheduleList(venueId, performanceId)

            const grouped = {};

            response.data.forEach((screen) => {
                const title = screen.performance.title;

                if (!grouped[title]) {
                    grouped[title] = [];
                }
                grouped[title].push(screen);
            });

            for (const title in grouped) {
                grouped[title].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            }

            setPerformanceScheduleList(grouped);
        } catch (error) {
            console.error("상영 정보 조회 실패:", error);
        }
    };

    const handleCancelReserve = () => {
        const confirm = window.confirm("예매를 취소하시겠습니까 ?")
        if (!confirm) return;

        const user_id = localStorage.getItem('user_id')
        const queueType = reserveQueueType?.split(":")[0]

        removeAllowUser(user_id, queueType)

        sessionStorage.removeItem(`timerStarted_${user_id}`)
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        localStorage.removeItem('reserve_queue_type')
        localStorage.removeItem('performance_id')
        Cookies.remove(`reserve-user-access-cookie-${user_id}`)

        navigate('/')
    }

    const removeAllowUser = async (user_id, queueType) => {
        try {
            const body = {
                userId: user_id,
                queueType: queueType
            }

            const response = await auth.cancelQueue(body)
            const data = response.data

            if (data) {
                alert("예매 취소가 완료되었습니다.");
            } else {
                alert("예매 취소 실패, 다시 시도해주세요");
            }
        } catch (err) {
            alert(err.message);
        }
    }

    const verifyToken = async () => {
        const user_id = localStorage.getItem('user_id')
        const token = Cookies.get(`reserve-user-access-cookie-${user_id}`)

        if (!token || !user_id) {
            alert("인증되지 않은 사용자입니다.");
            navigate('/')
            return
        }

        const body = {
            userId: user_id,
            queueType: reserveQueueType.split(":")[0]
        }

        try {
            const response = await auth.tokenValidation(body, token)

            if (!response.data) {
                alert("잘못된 인증입니다.")
                navigate('/')
                return
            }

        } catch (error) {
            console.error('토큰 검증 중 에러 발생 : ', error)
            navigate('/')
        }
    }

    useEffect(() => {
        const user_id = localStorage.getItem('user_id')
        const sessionKey = `timerStarted_${user_id}`
        const alreadyStarted = sessionStorage.getItem(sessionKey)

        if (!alreadyStarted) {
            const newExpire = Date.now() + 600_000
            localStorage.setItem('expireTime', newExpire.toString())
            sessionStorage.setItem(sessionKey, 'true')
        }
    }, [])

    useEffect(() => {
        verifyToken()
    }, [navigate])

    useEffect(() => {
        getPerformanceScheduleList();
    }, [venueId, performanceId]);

    return (
        <>
            <Header />
            <div className="screening-schedule-container">
                {Object.keys(performanceScheduleList).length > 0 ? (
                    Object.entries(performanceScheduleList).map(([title, screens]) => {
                        const perf = screens[0]?.performance;
                        return (
                            <div key={title} className="performance-group">

                                <div className="schedule-header">
                                    <div className="schedule-header-info">
                                        <span className="schedule-type-badge">{perf?.type}</span>
                                        <h2 className="schedule-title">{title}</h2>
                                        <p className="schedule-meta">
                                            상영 시간 · {formatDuration(perf?.duration)}
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            {perf?.price?.toLocaleString()}원
                                        </p>
                                    </div>

                                    <div className="schedule-controls">
                                        <div className="schedule-timer">
                                            <span className="timer-label">남은 시간</span>
                                            <span className="timer-value">
                                                {minutes}분 {seconds < 10 ? `0${seconds}` : seconds}초
                                            </span>
                                        </div>
                                        <button className="cancel-reserve-button" onClick={handleCancelReserve}>
                                            예매 취소
                                        </button>
                                    </div>
                                </div>

                                <div className="screen-list-container">
                                    {screens.map((screen) => {
                                        const start = new Date(screen.startTime);
                                        const end = new Date(screen.endTime);
                                        return (
                                            <Link
                                                to={`/seat/${reserveQueueType}/${screen.id}`}
                                                key={screen.id}
                                                className="screen-card-link"
                                            >
                                                <div className="screen-card">
                                                    <p className="screen-date">
                                                        {start.toLocaleDateString('ko-KR', {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            weekday: 'short'
                                                        })}
                                                    </p>
                                                    <p className="screen-time">
                                                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        {' ~ '}
                                                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="loading-message">상영 정보를 불러오는 중...</p>
                )}
            </div>
        </>
    );
};

export default PerformanceSchedule;
