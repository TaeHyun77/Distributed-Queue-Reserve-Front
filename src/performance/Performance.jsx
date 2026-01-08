import React, { useEffect, useState, useContext } from "react";
import * as auth from "../api/auth";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { LoginContext } from "../contexts/LoginContextProvider";
import Header from "../page/header/Header";
import "./Performance.css"

const Venue = () => {
    const navigate = useNavigate();

    const { isLogin, userInfo } = useContext(LoginContext);
    const { venueId } = useParams();

    const [performanceId, setPerformanceId] = useState(null)
    const [performanceList, setPerformanceList] = useState([]);

    const [userId, setUserId] = useState('');
    const [reserveQueueType, setReserveQueueType] = useState(null)

    const [isWaiting, setIsWaiting] = useState(false);

    const [ranking, setRanking] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    // 공연 목록 조회
    const getPerformanceList = async () => {
        try {
            const response = await auth.performanceList(venueId)
            console.log("performanceList : " + response.data)

            setPerformanceList(response.data);
        } catch (error) {
            console.error("공연 목록 조회 실패:", error);
        }
    };

    const getPerformanceScheduleId = async (performance_id) => {
        try {
            const response = await auth.performanceScheduleId(venueId, performance_id)
            console.log("performanceScheduleId : " + response.data)

            return response.data
        } catch (error) {
            console.error("performanceScheduleId 조회 실패:", error);
        }
    }

    const createQueueCookie = (queueType, userId) => {
        return auth.createQueueCookie(queueType, userId);
    };

    // 대기열 등록
    const registerUser = async (performance_id) => {
        if (!isLogin) {
            alert("예매 시 로그인이 필요합니다.")
            return;
        }

        const confirm = window.confirm("예매 하시겠습니까 ?");
        if (!confirm) return;

        const scheduleId = await getPerformanceScheduleId(performance_id)
        const queueType = `reserve_${scheduleId}`
        const idempotencyKey = uuidv4()

        try {
            const headers = {
                "idempotency-key": idempotencyKey,
                "Content-Type": "application/json"
            };

            const body = {
                queueType: queueType,
                userId: userInfo?.username
            };

            const response = await auth.register(body, headers)
            const data = response.data;
            console.log(data)

            if (data === "QUEUE_REGISTERED") {
                alert(`${userInfo?.username}님, 대기열 등록 완료!`);
                setPerformanceId(performance_id);
                setReserveQueueType(queueType + ":user-queue:wait");
                setIsWaiting(true);
                setUserId(userInfo?.username);

                localStorage.setItem("user_id", userInfo?.username);
                localStorage.setItem("is_waiting", "true");
            } else if (data === "ALREADY_IDEMPOTENCY_EXISTS") {
                return;
            } else {
                alert("대기열 등록 실패\n다시 시도해주세요")
            }
        } catch (err) {
            const msg = err.response?.data?.message || "예약 중 에러 발생";
            alert(msg);
        }
    };

    // SSE 연결 및 데이터 전송
    useEffect(() => {
        if (!isWaiting || confirmed || !userId || !reserveQueueType) return;

        const queueType = reserveQueueType.split(":")[0];

        const sse = new EventSource(
            `http://localhost:8081/queue/stream?queueType=${queueType}&userId=${userId}`
        );

        sse.onopen = () => console.log("SSE 연결 성공!");

        sse.onerror = (err) => {
            console.error("SSE 연결 오류:", err);
            sse.close();
        };

        sse.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                // 에러 이벤트
                if (data.event === "error") {
                    alert(data.message || "대기열 정보가 없습니다.");
                    sse.close();
                    return;
                }

                // 순위 업데이트
                if (data.event === "update") {
                    setRanking(data.rank);
                    return;
                }

                // 참가열 이동 확정
                if (data.event === "confirmed") {
                    localStorage.removeItem("is_waiting");

                    await createQueueCookie(reserveQueueType, userId);

                    setConfirmed(true);

                    navigate(
                        `/performance_schedule/${venueId}/${performanceId}`,
                        { state: { reserveQueueType } }
                    );

                    sse.close();
                }
            } catch (err) {
                console.error("SSE 메시지 처리 오류:", err);
                sse.close();
            }
        };

        return () => {
            sse.close();
        };
    }, [isWaiting, confirmed, userId, reserveQueueType]);


    // 대기열에서의 취소
    const handleCancelQueue = () => {
        const confirm = window.confirm("예매를 취소하시겠습니까 ?")
        if (!confirm) return;

        const userId = localStorage.getItem('user_id')

        cancelQueue(userId, "wait")
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`reserve-user-access-cookie-${userId}`)
        alert("예매 취소가 완료되었습니다.");
        navigate('/')
    }

    const cancelQueue = async (userId, queueCategory) => {
        try {
            const queueType = reserveQueueType.split(":")[0];
            const body = {
                userId: userId,
                queueType: queueType
            }

            const response = await auth.cancelQueue(queueCategory, body)

            if (response.data) {
                alert("예매 취소 완료");
            } else {
                alert("대기열 삭제 실패");
            }

        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => {
        const savedUserId = localStorage.getItem("user_id");
        const waiting = localStorage.getItem("is_waiting") === "true";

        if (savedUserId && waiting) {
            setUserId(savedUserId);
            setIsWaiting(true);
        }
    }, []);

    useEffect(() => {
        getPerformanceList();
    }, [venueId]);

    if (isWaiting) {
        return (
            <div className="reservation-container">
                <h2>{confirmed ? '예약이 확정되었습니다!' : '서비스 접속 대기 중입니다...'}</h2>
                <p>{userInfo?.username}님, 순서를 기다려주세요.</p>
                <p>잠시만 기다리시면 서비스에 자동 접속됩니다.</p>
                <h4>새로고침하면 대기 순번이 가장 뒤로 이동합니다.</h4>
                {ranking !== null && !confirmed && (
                    <h3 style={{ marginTop: "30px" }}>현재 대기 순번: <strong>{ranking}번</strong></h3>
                )}
                {!confirmed && (
                    <button
                        className="cancel-button"
                        onClick={() => handleCancelQueue()}
                    >
                        취소하기
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="performance-card-container">
                {performanceList.length > 0 ? (
                    performanceList.map((performance) => (
                        <div key={performance.id} className="performance-item">
                            <div
                                className="performance-card"
                                style={{ cursor: "pointer" }}
                            >
                                <div className="performance-title">{performance.title}</div>
                                <div className="performance-type">{performance.type}</div>
                                <div className="performance-duration">상영 시간: {performance.duration}</div>
                            </div>
                            <button
                                className="performance-reserve-button"
                                onClick={() => registerUser(performance.id)}
                            >
                                예매
                            </button>
                        </div>
                    ))
                ) : (
                    <p>공연 정보를 불러오는 중...</p>
                )}
            </div>
        </>
    );
};

export default Venue;