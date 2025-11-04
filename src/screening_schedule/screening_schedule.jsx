import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import * as auth from "../api/auth";
import Cookies from 'js-cookie';
import Header from "../header/Header";
import "./screening_schedule.css";

const ScreeningSchedule = () => {
    const navigate = useNavigate()
    const location = useLocation();

    const { venueId, performanceId } = useParams();
    const { reserveQueueType } = location.state || {};
    const [groupedScreens, setGroupedScreens] = useState({});

    const [secondsLeft, setSecondsLeft] = useState(600)

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return match ? match[2] : null
    }

    /**
     * 공연 정보 리스트
     */
    const getScreenList = async () => {
        try {
            const response = await api.get(`/api/screenInfo/list/${venueId}/${performanceId}`);
            console.log("조회된 상영 정보:", response.data);

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

            setGroupedScreens(grouped);
        } catch (error) {
            console.error("상영 정보 조회 실패:", error);
        }
    };

    /**
     * 허용열 등록 취소 요청
     */
    const handleCancelReserve = (queueCategory) => {
        const user_id = localStorage.getItem('user_id')

        const confirm = window.confirm("예매를 취소하시겠습니까 ?")
        if (!confirm) return;

        const queueType = reserveQueueType.split(":")[0]
        console.log("asdadasd :" + queueCategory)

        removeAllowUser(user_id, queueType, queueCategory)
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`${performanceId}_user-access-cookie_${user_id}`)
        alert("예매 취소가 완료되었습니다.");
        navigate('/')
    }

    /**
     * 허용열 등록 취소 요청
     */
    const removeAllowUser = async (user_id, queueType, queueCategory) => {

        try {
            const res = await auth.cancelRegister(user_id, queueType, queueCategory)

            if (res) {
                alert("예매 취소 완료");
            } else {
                throw new Error("참가열 삭제 실패");
            }

        } catch (err) {
            alert(err.message);
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
                handleCancelReserve("allow")
                clearInterval(interval)
                localStorage.removeItem('expireTime')
                Cookies.remove(`reserve_user-access-cookie_${user_id}`)
                navigate('/')
            } else {
                setSecondsLeft(diff)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [navigate])

    // 쿠키 유효성 파악
    useEffect(() => {
        const verifyToken = async () => {
            const user_id = localStorage.getItem('user_id')

            const token = Cookies.get(`reserve_user-access-cookie_${user_id}`)

            if (!token || !user_id) {
                alert("인증되지 않은 사용자입니다.");
                navigate('/')
                return
            }

            try {
                const res = await fetch(
                    `http://localhost:8079/queue/isValidateToken?userId=${user_id}&queueType=${reserveQueueType}&token=${token}`
                )

                if (!res.ok) {
                    console.error('검증 실패 : ', res.status)
                    navigate('/')
                    return
                }

                const isValid = await res.json()

                if (!isValid) {
                    navigate('/')
                } else {
                    console.log("인증된 사용자입니다.")
                }

            } catch (error) {
                console.error('토큰 검증 중 에러 발생 : ', error)
                navigate('/')
            }
        }

        verifyToken()
    }, [navigate])


    useEffect(() => {
        getScreenList();
    }, [venueId, performanceId]);

    return (
        <>
            <Header />
            <div className="screening-schedule-container">
                {Object.keys(groupedScreens).length > 0 ? (
                    Object.entries(groupedScreens).map(([title, screens]) => (
                        <div key={title} className="performance-group">
                            <div className="header-row">
                                <h2 className="performance-title">예약 페이지 - {title}</h2>
                                <div className="right-controls">
                                    <p className="target-timer">
                                        남은 시간: {minutes}분 {seconds < 10 ? `0${seconds}` : seconds}초
                                    </p>
                                    <button
                                        className="back-button"
                                        onClick={() => handleCancelReserve("allow")}
                                    >
                                        예매 취소
                                    </button>
                                </div>
                            </div>
                            <div className="screen-list-container">
                                {screens.map((screen) => (
                                    <Link to={`/Seat/${screen.id}`} key={screen.id} className="screen-card-link">
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