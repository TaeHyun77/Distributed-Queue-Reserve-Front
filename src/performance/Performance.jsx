import Cookies from 'js-cookie';
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../api/auth";
import { LoginContext } from "../contexts/LoginContextProvider";
import Header from "../page/header/Header";
import "./Performance.css";

const QUEUE_BASE_URL = "http://localhost:8079";
const MAX_COOKIE_RETRY = 3;
const COOKIE_RETRY_DELAY_MS = 1000;

const Venue = () => {
    const navigate = useNavigate();

    const { isLogin, userInfo } = useContext(LoginContext);
    const { venueId } = useParams();

    const [performanceId, setPerformanceId] = useState(null);
    const [performanceList, setPerformanceList] = useState([]);

    const [userId, setUserId] = useState('');
    const [reserveQueueType, setReserveQueueType] = useState(null);

    const [isWaiting, setIsWaiting] = useState(false);
    const [ranking, setRanking] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    const getPerformanceList = useCallback(async () => {
        try {
            const response = await auth.performanceList(venueId);
            setPerformanceList(response.data);
        } catch (error) {
            console.error("공연 목록 조회 실패:", error);
        }
    }, [venueId]);

    const getPerformanceScheduleId = async (performance_id) => {
        try {
            const response = await auth.performanceScheduleId(venueId, performance_id);
            return response.data;
        } catch (error) {
            console.error("performanceScheduleId 조회 실패:", error);
        }
    };

    const createQueueCookieWithRetry = async (queueType, userId) => {
        for (let attempt = 1; attempt <= MAX_COOKIE_RETRY; attempt++) {
            try {
                await auth.createQueueCookie(queueType, userId);
                return;
            } catch (err) {
                console.error(`쿠키 발급 시도 ${attempt}/${MAX_COOKIE_RETRY} 실패:`, err);
                if (attempt < MAX_COOKIE_RETRY) {
                    await new Promise((res) => setTimeout(res, COOKIE_RETRY_DELAY_MS));
                } else {
                    throw err;
                }
            }
        }
    };

    const registerUser = async (performance_id) => {
        if (!isLogin) {
            alert("예매 시 로그인이 필요합니다.");
            return;
        }

        const confirm = window.confirm("예매 하시겠습니까?");
        if (!confirm) return;

        const scheduleId = await getPerformanceScheduleId(performance_id);
        const queueType = `reserve_${scheduleId}`;
        const requestKey = uuidv4();

        try {
            const headers = {
                "request-key": requestKey,
                "Content-Type": "application/json"
            };
            const body = {
                queueType: queueType,
                userId: userInfo?.username
            };

            const response = await auth.register(body, headers);
            const data = response.data;

            if (data === "SUCCESS") {
                alert(`${userInfo?.username}님, 대기열 등록 완료!`);
                const fullQueueType = queueType + ":user-queue:wait";

                setPerformanceId(performance_id);
                setReserveQueueType(fullQueueType);
                setIsWaiting(true);
                setUserId(userInfo?.username);

                localStorage.setItem("user_id", userInfo?.username);
                localStorage.setItem("is_waiting", "true");
                localStorage.setItem("reserve_queue_type", fullQueueType);
                localStorage.setItem("performance_id", performance_id);
            } else if (data === "ALREADY_REGISTERED") {
                alert("이미 등록된 사용자입니다.");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "예약 중 에러 발생";
            alert(msg);
        }
    };

    useEffect(() => {
        if (!isWaiting || confirmed || !userId || !reserveQueueType) return;

        const queueType = reserveQueueType.split(":")[0];

        const sse = new EventSource(
            `${QUEUE_BASE_URL}/queue/stream?queueType=${queueType}&userId=${userId}`
        );

        sse.onopen = () => console.log("SSE 연결 성공!");

        sse.onerror = (err) => {
            console.error("SSE 연결 오류:", err);
            sse.close();
        };

        sse.addEventListener("update", (event) => {
            const data = JSON.parse(event.data);
            setRanking(data.rank);
        });

        sse.addEventListener("confirmed", async () => {
            try {
                localStorage.removeItem("is_waiting");
                await createQueueCookieWithRetry(queueType, userId);
                setConfirmed(true);

                const currentPerformanceId = performanceId || localStorage.getItem("performance_id");

                navigate(
                    `/performance_schedule/${venueId}/${currentPerformanceId}`,
                    { state: { reserveQueueType } }
                );
            } catch (err) {
                console.error("쿠키 발급 최종 실패:", err);
                alert("접속 토큰 발급에 실패했습니다. 다시 시도해주세요.");
            } finally {
                sse.close();
            }
        });

        sse.addEventListener("error", (event) => {
            try {
                const data = JSON.parse(event.data);
                alert(data.message || "대기열 정보가 없습니다.");
            } catch {
                alert("대기열 정보가 없습니다.");
            }
            sse.close();
        });

        return () => sse.close();
    }, [isWaiting, confirmed, userId, reserveQueueType, performanceId, venueId, navigate]);

    const handleCancelQueue = async () => {
        const confirm = window.confirm("예매를 취소하시겠습니까?");
        if (!confirm) return;

        const currentUserId = userId || localStorage.getItem('user_id');
        const currentQueueType = reserveQueueType
            ? reserveQueueType.split(":")[0]
            : localStorage.getItem("reserve_queue_type")?.split(":")[0];

        if (!currentUserId || !currentQueueType) {
            alert("대기열 정보를 찾을 수 없습니다.");
            return;
        }

        try {
            const body = { userId: currentUserId, queueType: currentQueueType };
            const response = await auth.cancelQueue(body);

            if (!response.data) {
                alert("대기열 삭제 실패");
                return;
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message);
            return;
        }

        localStorage.removeItem('user_id');
        localStorage.removeItem('is_waiting');
        localStorage.removeItem('reserve_queue_type');
        localStorage.removeItem('performance_id');
        localStorage.removeItem('expireTime');

        Cookies.remove(`reserve-user-access-cookie-${currentUserId}`);

        alert("예매 취소가 완료되었습니다.");
        navigate('/');
    };

    useEffect(() => {
        const savedUserId = localStorage.getItem("user_id");
        const waiting = localStorage.getItem("is_waiting") === "true";
        const savedQueueType = localStorage.getItem("reserve_queue_type");
        const savedPerformanceId = localStorage.getItem("performance_id");

        if (savedUserId && waiting && savedQueueType) {
            setUserId(savedUserId);
            setIsWaiting(true);
            setReserveQueueType(savedQueueType);

            if (savedPerformanceId) setPerformanceId(savedPerformanceId);
        }
    }, []);

    useEffect(() => {
        getPerformanceList();
    }, [getPerformanceList]);

    if (isWaiting) {
        return (
            <>
                <Header />
                <div className="reservation-container">
                    <div className="reservation-icon">
                        {confirmed ? '🎉' : '🎟️'}
                    </div>
                    <h2>{confirmed ? '예약이 확정되었습니다!' : '대기 중입니다'}</h2>
                    <p className="reservation-username">
                        <strong>{userInfo?.username}</strong>님, 잠시만 기다려주세요.
                    </p>
                    <p className="reservation-desc">순서가 되면 자동으로 접속됩니다.</p>

                    {ranking !== null && !confirmed && (
                        <div className="reservation-rank">
                            <span className="reservation-rank-label">⏳ 현재 대기 순번</span>
                            <strong className="reservation-rank-number">{ranking}번</strong>
                        </div>
                    )}

                    {!confirmed && (
                        <p className="reservation-warning">
                            ⚠️ 새로고침 시 대기 순번이 가장 뒤로 이동합니다.
                        </p>
                    )}

                    {!confirmed && (
                        <button className="cancel-button" onClick={handleCancelQueue}>
                            예매 취소
                        </button>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="performance-page">
                <h2 className="performance-page-title">공연 목록</h2>

                {performanceList.length === 0 ? (
                    <div className="performance-empty">
                        <div className="performance-empty-icon">🎬</div>
                        <p className="performance-empty-text">등록된 공연이 없습니다</p>
                    </div>
                ) : (
                    <div className="performance-card-container">
                        {performanceList.map((performance) => (
                            <div key={performance.id} className="performance-card">
                                <span className="performance-type-badge">{performance.type}</span>

                                <div className="performance-title">
                                    {performance.title}
                                </div>

                                <div className="performance-duration">
                                    상영 시간 · {performance.duration}
                                </div>

                                <button
                                    className="performance-reserve-button"
                                    onClick={() => registerUser(performance.id)}
                                >
                                    예매하기
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Venue;