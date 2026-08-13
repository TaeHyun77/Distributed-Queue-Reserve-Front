import Cookies from 'js-cookie';
import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../api/auth";
import { LoginContext } from "../contexts/LoginContextProvider";
import Header from "../page/header/Header";
import "./Payment.css";

const Payment = () => {
    const location = useLocation();
    const seatsInfo = location.state;

    const navigate = useNavigate();
    const { isLogin, authReady, userInfo } = useContext(LoginContext);

    const [useReward, setUseReward] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // hold 카운트다운 — heldUntil(서버 시각) 기준, UX 표시용 (최종 판정은 서버)
    const [holdSecondsLeft, setHoldSecondsLeft] = useState(() => {
        if (!seatsInfo?.heldUntil) return 0;
        return Math.max(0, Math.floor((new Date(seatsInfo.heldUntil).getTime() - Date.now()) / 1000));
    });
    const holdExpired = holdSecondsLeft === 0;

    // 마운트 시 1회 생성 — 네트워크 재시도 시 같은 키 재사용해 중복 결제 방지
    const idempotencyKeyRef = useRef(uuidv4());
    const reservationNumberRef = useRef(uuidv4());
    // 결제 완료 또는 hold 만료 후 unmount 시 release를 막기 위한 플래그
    const paymentDoneRef = useRef(false);

    useEffect(() => {
        if (authReady && !isLogin) navigate("/");
    }, [authReady, isLogin, navigate]);

    // hold 카운트다운 타이머
    useEffect(() => {
        if (!seatsInfo?.heldUntil || holdExpired) return;
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((new Date(seatsInfo.heldUntil).getTime() - Date.now()) / 1000));
            setHoldSecondsLeft(remaining);
            if (remaining === 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [seatsInfo?.heldUntil, holdExpired]);

    // 결제창 이탈 시 좌석 선점 즉시 반납
    // - 탭 닫기/새로고침: fetch keepalive (beforeunload에서 axios 완료 보장 불가)
    // - 뒤로가기/SPA 이탈: unmount cleanup에서 axios 호출
    useEffect(() => {
        if (!seatsInfo) return;
        const releaseBody = {
            seatNumbers: seatsInfo.seats,
            performanceScheduleId: seatsInfo.performanceScheduleId,
        };

        const handleBeforeUnload = () => {
            if (paymentDoneRef.current) return;
            const accessToken = Cookies.get('accessToken');
            fetch('http://localhost:8080/reserve/release', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(releaseBody),
                keepalive: true,
                credentials: 'include',
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (!paymentDoneRef.current) {
                auth.releaseSeats(releaseBody).catch(() => {});
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const price = (seatsInfo?.seatAmount ?? 0) * (seatsInfo?.personCount ?? 0);
    const discount = useReward ? Math.min(userInfo?.reward ?? 0, price) : 0;
    const finalPrice = price - discount;

    // 결제 성공 후 참가열 제거 및 로컬 상태 정리
    const clearAfterPayment = () => {
        const userId = localStorage.getItem('user_id');
        const queueType = seatsInfo.queueType?.split(":")[0];
        if (userId && queueType) {
            auth.cancelQueue({ userId, queueType }).catch(() => {});
        }
        localStorage.removeItem('user_id');
        localStorage.removeItem('expireTime');
        if (userId) Cookies.remove(`reserve-user-access-cookie-${userId}`);
    };

    const handlePayment = async () => {
        if (holdExpired || isLoading) return;
        if (!window.confirm("결제 하시겠습니까?")) return;
        setIsLoading(true);

        try {
            await auth.confirmReservation(
                {
                    reservationNumber: reservationNumberRef.current,
                    rewardDiscountAmount: discount,
                    seatNumbers: seatsInfo.seats,
                    performanceScheduleId: seatsInfo.performanceScheduleId,
                },
                { 'idempotency-key': idempotencyKeyRef.current }
            );

            paymentDoneRef.current = true;
            clearAfterPayment();
            alert("[ 예약 완료 ] 결제가 성공적으로 완료되었습니다.");
            navigate("/");
        } catch (e) {
            const data = e.response?.data;
            const code = data?.code ?? data?.message ?? data;

            if (code === 'HOLD_EXPIRED_OR_NOT_OWNED') {
                alert("선점 시간이 만료됐습니다. 좌석을 다시 선택해주세요.");
                // hold가 이미 없으므로 release 불필요
                paymentDoneRef.current = true;
                navigate(`/seat/${seatsInfo.queueType}/${seatsInfo.performanceScheduleId}`);
            } else if (code === 'NOT_ENOUGH_CREDIT') {
                alert("잔액이 부족합니다. 다시 시도해주세요.");
            } else {
                alert(data?.message || "결제에 실패했습니다. 다시 시도해주세요.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatHoldTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}분 ${s < 10 ? `0${s}` : s}초`;
    };

    return (
        <>
            <Header />
            <div className="payment-page">
                <div className="payment-card">
                    <div className="payment-card-header">
                        <div className="payment-header-top">
                            <div>
                                <h2 className="payment-title">결제 확인</h2>
                                <p className="payment-subtitle">예매 정보를 확인해주세요</p>
                            </div>
                            <div className="payment-timer">
                                <span className="timer-label">좌석 선점 남은 시간</span>
                                {holdExpired ? (
                                    <span className="timer-value" style={{ color: '#ef4444' }}>시간 초과</span>
                                ) : (
                                    <span className="timer-value">{formatHoldTime(holdSecondsLeft)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="payment-section">
                        <h3 className="payment-section-title">예매 정보</h3>
                        <div className="payment-rows">
                            <div className="payment-row">
                                <span className="payment-label">선택 좌석</span>
                                <span className="payment-value">{seatsInfo?.seats?.join(", ")}</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">인원 수</span>
                                <span className="payment-value">{seatsInfo?.personCount}명</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">좌석 금액</span>
                                <span className="payment-value">{seatsInfo?.seatAmount?.toLocaleString()}원 × {seatsInfo?.personCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="payment-divider" />

                    <div className="payment-section">
                        <h3 className="payment-section-title">포인트 사용</h3>
                        <div className="reward-row">
                            <div className="reward-info">
                                <span className="payment-label">보유 포인트</span>
                                <span className="reward-point">{(userInfo?.reward ?? 0).toLocaleString()} P</span>
                            </div>
                            <button
                                className={`reward-toggle-btn ${useReward ? "active" : ""}`}
                                onClick={() => {
                                    if ((userInfo?.reward ?? 0) <= 0) {
                                        alert("사용 가능한 포인트가 없습니다.");
                                        return;
                                    }
                                    setUseReward(prev => !prev);
                                }}
                            >
                                {useReward ? "사용 취소" : "포인트 사용"}
                            </button>
                        </div>
                        {useReward && (
                            <p className="reward-applied">− {discount.toLocaleString()} P 적용됨</p>
                        )}
                    </div>

                    <div className="payment-divider" />

                    <div className="payment-total-row">
                        <span className="payment-total-label">최종 결제 금액</span>
                        <span className="payment-total-price">{finalPrice.toLocaleString()}원</span>
                    </div>

                    {holdExpired ? (
                        <>
                            <p className="payment-subtitle" style={{ color: '#ef4444', textAlign: 'center' }}>
                                선점 시간이 만료됐습니다. 좌석을 다시 선택해주세요.
                            </p>
                            <button
                                className="payment-submit-btn"
                                onClick={() => navigate(`/seat/${seatsInfo.queueType}/${seatsInfo.performanceScheduleId}`)}
                            >
                                좌석 다시 선택
                            </button>
                        </>
                    ) : (
                        <button
                            className="payment-submit-btn"
                            onClick={handlePayment}
                            disabled={isLoading}
                        >
                            {isLoading ? "처리 중..." : "결제하기"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Payment;
