import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import * as auth from "../api/auth";
import Cookies from 'js-cookie';
import Header from "../page/header/Header";
import "./performance_schedule.css";

const ScreeningSchedule = () => {
    const navigate = useNavigate()
    const location = useLocation();

    const { venueId, performanceId } = useParams();
    const { reserveQueueType } = location.state || {};

    const [performanceScheduleList, setPerformanceScheduleList] = useState({});

    const [secondsLeft, setSecondsLeft] = useState(600)

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    // 공연 정보 리스트
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

            // 그룹 내 상영 시간 정렬
            for (const title in grouped) {
                grouped[title].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            }

            setPerformanceScheduleList(grouped);
        } catch (error) {
            console.error("상영 정보 조회 실패:", error);
        }
    };

    const handleAutoCancelReserve = () => {
        const user_id = localStorage.getItem('user_id')
        const queueType = reserveQueueType.split(":")[0]

        removeAllowUser(user_id, queueType, "allow")
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`reserve-user-access-cookie-${user_id}`)
        navigate('/')
    }

    // 허용열에서의 취소
    const handleCancelReserve = () => {
        const confirm = window.confirm("예매를 취소하시겠습니까 ?")
        if (!confirm) return;

        const user_id = localStorage.getItem('user_id')
        const queueType = reserveQueueType.split(":")[0]

        removeAllowUser(user_id, queueType, "allow")
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`reserve-user-access-cookie-${user_id}`)
        navigate('/')
    }

    const removeAllowUser = async (user_id, queueType, queueCategory) => {
        try {
            const body = {
                userId: user_id,
                queueType: queueType
            }

            const response = await auth.cancelQueue(queueCategory, body)
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
            handleCancelReserve()
            navigate('/')
            return
        }

        const body = {
            userId: user_id,
            queueType: reserveQueueType
        }

        try {
            const response = await auth.tokenValidation(body, token)

            if (!response.data) {
                alert("잘못된 인증입니다.")
                handleCancelReserve()
                navigate('/')
                return
            }

        } catch (error) {
            console.error('토큰 검증 중 에러 발생 : ', error)
            navigate('/')
        }
    }

    useEffect(() => {
        const expireTime = localStorage.getItem('expireTime')
        const user_id = localStorage.getItem('user_id')

        if (!expireTime) {
            const newExpire = Date.now() + 600_000
            localStorage.setItem('expireTime', newExpire.toString())
        }

        // 렌더링 직후 실제 남은 시간 계산
        const current = Date.now()
        const expire = parseInt(localStorage.getItem('expireTime') || '0', 10)
        const diff = Math.floor((expire - current) / 1000)

        setSecondsLeft(diff > 0 ? diff : 0)

        const interval = setInterval(() => {
            const now = Date.now()
            const expireTime = parseInt(localStorage.getItem('expireTime') || '0', 10)
            const diff = Math.floor((expireTime - now) / 1000)

            if (diff <= 0) {
                handleAutoCancelReserve()
                clearInterval(interval)
                localStorage.removeItem('expireTime')
                Cookies.remove(`reserve-user-access-cookie-${user_id}`)
                navigate('/')
            } else {
                setSecondsLeft(diff)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [navigate])

    // 쿠키 유효성 파악
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
                    Object.entries(performanceScheduleList).map(([title, screens]) => (
                        <div key={title} className="performance-group">
                            <div className="header-row">
                                <h2 className="performance-title">{title}</h2>
                                <div className="right-controls">
                                    <p className="target-timer">
                                        남은 시간: {minutes}분 {seconds < 10 ? `0${seconds}` : seconds}초
                                    </p>
                                    <button
                                        className="back-button"
                                        onClick={() => handleCancelReserve()}
                                    >
                                        예매 취소
                                    </button>
                                </div>
                            </div>
                            <div className="screen-list-container">
                                {screens.map((screen) => (
                                    <Link to={`/seat/${reserveQueueType}/${screen.id}`} key={screen.id} className="screen-card-link">
                                        <div className="screen-card">
                                            <p>날짜: {screen.screeningDate}</p>
                                            <p>
                                                {new Date(screen.startTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })} -{' '}
                                                {new Date(screen.endTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="loading-message">상영 정보를 불러오는 중...</p>
                )}
            </div>
        </>
    );
};

export default ScreeningSchedule;