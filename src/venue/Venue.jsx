import React, { useEffect, useState, useContext } from "react";
import * as auth from "../api/auth";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { LoginContext } from "../contexts/LoginContextProvider";
import api from "../api/api";
import Header from "../header/Header";
import "./Venue.css"

const Venue = () => {
    const navigate = useNavigate();

    const { isLogin, userInfo } = useContext(LoginContext);

    const { venueId } = useParams();
    const [performanceId, setPerformanceId] = useState(null)
    const [reserveQueueType, setReserveQueueType] = useState(null)

    const [userId, setUserId] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);

    const [ranking, setRanking] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    const [performanceList, setPerformanceList] = useState([]);

    /**
     * 공연 목록 조회
     */
    const getPerformanceList = async () => {
        try {
            const response = await api.get(`/api/performance/list/${venueId}`);

            console.log(response.data)

            setPerformanceList(response.data);
        } catch (error) {
            console.error("장소 조회 실패:", error);
        }
    };

    /**
     * 대기열 등록
     */
    const registerUser = async (performanceTitle, performanceId) => {

        console.log(performanceTitle)

        if (!isLogin) {
            alert("예매 시 로그인이 필요합니다.")
            return;
        }

        const confirm = window.confirm("예매 하시겠습니까 ?");
        if (!confirm) return;

        try {
            const encodedUserId = encodeURIComponent(userInfo?.username);

            const queueType = "reserve_" + performanceTitle

            const idempotencyKey = uuidv4();

            const headers = {
                "idempotencyKey": idempotencyKey,
            };

            const res = await auth.register(queueType, encodedUserId, headers)

            alert(`${userInfo?.username}님, 대기열 등록 완료!`);
            setPerformanceId(performanceId)
            setReserveQueueType(queueType + ":user-queue:wait")
            setIsWaiting(true);
            setUserId(userInfo?.username)

            localStorage.setItem("user_id", userInfo?.username);
            localStorage.setItem("is_waiting", "true");
        } catch (err) {
            const msg = err.response?.data?.message || "예약 중 에러 발생";
            alert(msg);
        }
    };

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

    /**
     * SSE 연결 및 데이터 전송
     */
    useEffect(() => {

        if (!isWaiting || confirmed || !userId) return;

        const sse = new EventSource(`http://localhost:8079/queue/stream?userId=${userId}&queueType=${reserveQueueType}`);

        sse.onopen = () => console.log("SSE 연결 성공!");
        sse.onerror = (err) => {
            console.error('SSE 연결 오류:', err);
            sse.close();
        };

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event === 'error') {
                    console.log(data.message)
                    alert(data.message || "대기열 정보가 없습니다. 다시 시도해주세요.");
                    sse.close();
                }

                // 'update' : 대기열 순위 변동일 떄
                if (data.event === 'update') {
                    setRanking(data.rank);

                // 'confirmed' : 참가열로 이동했을 때
                } else if (data.event === 'confirmed') {
                    localStorage.removeItem("is_waiting");

                    // 쿠키 생성 후 타겟 페이지 이동
                    fetch(`http://localhost:8079/queue/createCookie?queueType=${reserveQueueType}&userId=${userId}`, {
                        method: 'GET',
                        credentials: 'include'
                    })
                        .then(response => {
                            if (!response.ok) throw new Error("쿠키 발급 실패");

                            setConfirmed(true);
                            navigate(`/screening_schedule/${venueId}/${performanceId}`, {
                                state: {
                                    reserveQueueType,
                                },
                            });
                            sse.close();
                        })
                        .catch(error => {
                            console.error("토큰 발급 중 오류:", error);
                            alert("서버 오류로 이동할 수 없습니다.");
                        });
                }
            } catch (e) {
                console.warn('SSE 데이터 파싱 실패:', event.data);
            }
        };

        return () => sse.close();

    }, [isWaiting, userId]);

    /**
     * 대기열 취소
     */
    const handleCancelQueueing = (queueCategory) => {
        const user_id = localStorage.getItem('user_id')

        const confirm = window.confirm("예매를 취소하시겠습니까 ?")
        if (!confirm) return;

        cancelQueueing(user_id, queueCategory)
        localStorage.removeItem('user_id')
        localStorage.removeItem('expireTime')
        Cookies.remove(`${performanceId}_user-access-cookie_${user_id}`)
        alert("예매 취소가 완료되었습니다.");
        navigate('/')
    }

    /**
     * 대기열 취소
     */
    const cancelQueueing = async (remove_user_id, queueCategory) => {

        try {
            const res = await fetch(`http://localhost:8079/queue/cancel?userId=${remove_user_id}&queueType=${reserveQueueType}&queueCategory=${queueCategory}`, {
                method: 'DELETE',
            });

            const errorText = await res.text(); // 응답 본문 내용 확인
            console.log("응답 상태코드:", res.status);
            console.log("에러 본문 내용:", errorText);

            if (res.ok) {
                alert("예매 취소 완료");
            } else {
                const message = await res.text(); // "이미 삭제가 처리된 사용자"
                console.log("삭제 실패 메세지 : " + message)
                throw new Error("대기열 삭제 실패");
            }

        } catch (err) {
            alert(err.message);
        }
    }

    const removeAllSpace = (str) => {
        return str.replace(/\s+/g, "")
    }

    // // 대기열에서 새로고침 시 맨 뒤로 밀리게 처리
    // useEffect(() => {
    //   if (!isWaiting || !userId) return;

    //   const handleBeforeUnload = () => {
    //     navigator.sendBeacon(
    //       `http://localhost:8080/user/reEnter?user_id=${userId}&queueType=reserve`
    //     );
    //     console.log("새로고침으로 인한 대기열 후순위 재배치");
    //   };

    //   window.addEventListener("beforeunload", handleBeforeUnload);
    //   return () => {
    //     window.removeEventListener("beforeunload", handleBeforeUnload);
    //   };
    // }, [isWaiting, userId]);

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
                        onClick={() => handleCancelQueueing("wait")}
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
                                onClick={() => registerUser(removeAllSpace(performance.title), performance.id)}
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