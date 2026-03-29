import Cookies from 'js-cookie';
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../api/auth";
import { LoginContext } from "../contexts/LoginContextProvider";
import { ReservationFlowContext } from "../contexts/ReservationFlowGuard";
import Header from "../page/header/Header";
import "./Payment.css";

const Payment = () => {
    const location = useLocation();
    const seatsInfo = location.state;

    const navigate = useNavigate();
    const { isLogin, authReady, userInfo } = useContext(LoginContext);
    const { secondsLeft } = useContext(ReservationFlowContext);

    const [useReward, setUseReward] = useState(false);

    useEffect(() => {
        if (authReady && !isLogin) navigate("/");
    }, [authReady, isLogin, navigate]);
    const [isLoading, setIsLoading] = useState(false);

    const price = seatsInfo.seatAmount * seatsInfo.personCount;
    const discount = useReward ? Math.min(userInfo?.reward, price) : 0;
    const finalPrice = price - discount;

    const handlePayment = async () => {
        const check = window.confirm("결제 하시겠습니까?"); 
        if (!check) return;
        if (isLoading) return;
        setIsLoading(true);

        const idempotencyKey = uuidv4();
        const headers = { 'idempotency-key': idempotencyKey };
        const paymentInfo = {
            performanceScheduleId: seatsInfo.performanceScheduleId,
            reservedSeat: seatsInfo.seats,
            rewardDiscountAmount: discount
        };

        const MAX_RETRIES = 3;

        try {
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    await auth.payAndReserve(paymentInfo, headers);
                    handleCancelReserve();
                    alert("[ 예약 완료 ] 결제가 성공적으로 완료되었습니다.");
                    navigate("/");
                    return;
                } catch (e) {
                    if (e.response) {
                        alert(e.response.data.message || "예약에 실패했습니다.");
                        return;
                    }
                    if (attempt < MAX_RETRIES - 1) {
                        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                        continue;
                    }
                    alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
                    return;
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelReserve = () => {
        const user_id = localStorage.getItem('user_id');
        const queueType = seatsInfo.queueType.split(":")[0];
        removeAllowUser(user_id, queueType);
        localStorage.removeItem('user_id');
        localStorage.removeItem('expireTime');
        Cookies.remove(`reserve-user-access-cookie-${user_id}`);
        navigate('/');
    };

    const removeAllowUser = async (user_id, queueType) => {
        try {
            await auth.cancelQueue({ userId: user_id, queueType });
        } catch (err) {
            alert(err.message);
        }
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
                            {secondsLeft > 0 && (
                                <div className="payment-timer">
                                    <span className="timer-label">남은 시간</span>
                                    <span className="timer-value">
                                        {Math.floor(secondsLeft / 60)}분 {(secondsLeft % 60) < 10 ? `0${secondsLeft % 60}` : secondsLeft % 60}초
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="payment-section">
                        <h3 className="payment-section-title">예매 정보</h3>
                        <div className="payment-rows">
                            <div className="payment-row">
                                <span className="payment-label">선택 좌석</span>
                                <span className="payment-value">{seatsInfo.seats.join(", ")}</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">인원 수</span>
                                <span className="payment-value">{seatsInfo.personCount}명</span>
                            </div>
                            <div className="payment-row">
                                <span className="payment-label">좌석 금액</span>
                                <span className="payment-value">{seatsInfo.seatAmount.toLocaleString()}원 × {seatsInfo.personCount}</span>
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
                                    if (userInfo?.reward <= 0) {
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

                    <button
                        className="payment-submit-btn"
                        onClick={handlePayment}
                        disabled={isLoading}
                    >
                        {isLoading ? "처리 중..." : "결제하기"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Payment;
