import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContextProvider";
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import * as auth from "../api/auth";
import Header from "../page/header/Header"
import "./Payment.css"

const Payment = () => {
    const location = useLocation();
    const seatsInfo = location.state;

    const navigate = useNavigate();
    const { userInfo } = useContext(LoginContext);

    const [useReward, setUseReward] = useState(false);

    const price = seatsInfo.seatAmount * seatsInfo.personCount; // 총 가격
    const discount = useReward ? Math.min(userInfo?.reward, price) : 0;  // 할인 가격

    // 결제 요청
    const handlePayment = async () => {
        const check = window.confirm("결제 하시겠습니까 ?")
        if (!check) return;

        // 멱등키 생성
        const idempotencyKey = uuidv4();
        const headers = {
            'idempotency-key': idempotencyKey,
        };

        // 결제 정보
        const paymentInfo = {
            reservedBy: userInfo?.username,
            performanceScheduleId: seatsInfo.performanceScheduleId,
            reservedSeat: seatsInfo.seats,
            rewardDiscountAmount: discount
        }

        try {
            const response = await auth.payAndReserve(paymentInfo, headers);

            const replayed = response.headers?.["idempotent-replayed"] === "true";
            if (replayed) return;

            if (response.status === 200) {
                handleCancelReserve()
                alert("[ 예약 완료 ] 결제가 성공적으로 완료되었습니다.");
                navigate("/");
            }

        } catch (error) {

            const errorMessage = error?.response?.data

            if (errorMessage) {
                switch (errorMessage) {
                    case "TIMEOUT":
                        alert("응답 지연으로 재시도합니다...");
                        return await auth.payAndReserve(seatsInfo, headers)
                    case "SEAT_ALREADY_RESERVED":
                        alert("이미 예약된 좌석이 포함되어 있습니다.");
                        break;
                    case "NOT_ENOUGH_CREDIT":
                        alert("보유하신 금액이 부족합니다.");
                        break;
                    case "NOT_EXIST_SEAT_INFO":
                        alert("선택한 좌석 정보를 찾을 수 없습니다.");
                        break;
                    default:
                        alert("예약 실패, 다시 시도해주세요 - " + (errorMessage || "알 수 없는 오류"));
                }
            } else {
                alert("예약 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        }
    };

    // 허용열에서의 취소
    const handleCancelReserve = () => {
        const user_id = localStorage.getItem('user_id')
        const queueType = seatsInfo.queueType.split(":")[0]

        console.log(user_id, queueType)

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
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <>
            <Header />
            <div className="payment-container">
                <h2>결제 확인</h2>
                <div className="payment-detail">
                    <p><strong>선택한 좌석 :</strong> {seatsInfo.seats.join(", ")}</p>
                    <p><strong>인원 수 :</strong> {seatsInfo.personCount}명</p>
                    <label className="payment_price">
                        <p><strong>보유 포인트 :</strong> {userInfo?.reward}P</p>
                        <button
                            className="reward-toggle-button"
                            onClick={() => {
                                if (userInfo.reward <= 0) {
                                    alert("사용 가능한 포인트가 없습니다.");
                                    return;
                                }
                                setUseReward((prev) => !prev);
                            }}
                        >
                            {useReward ? "사용 취소" : "포인트 사용"}
                        </button>
                    </label>
                    <p><strong>결제 금액 :</strong> {price - discount}원</p>
                </div>
                <button className="payment-button" onClick={handlePayment}>
                    결제하기
                </button>
            </div>
        </>
    );
};

export default Payment;