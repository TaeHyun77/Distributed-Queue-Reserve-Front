import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import * as auth from "../api/auth";
import { v4 as uuidv4 } from 'uuid';
import { LoginContext } from "../contexts/LoginContextProvider";
import Header from "../header/Header";
import "./ReserveInfo.css";

const ReserveInfo = () => {
    const navigate = useNavigate();
    const { userInfo } = useContext(LoginContext);
    const [reserveList, setReserveList] = useState([]);

    function formatToSeconds(datetimeString) {
        if (!datetimeString) return '';
        return datetimeString.split(".")[0].replace("T", " ");
    }

    /**
     * 예약 취소 요청
     */
    const cancelReservation = async (reservationNumber) => {

        const check = window.confirm("예약을 취소하시겠습니까 ?")
        if (!check) return

        const idempotencyKey = uuidv4();

        const headers = {
            'Idempotency-key': idempotencyKey,
        };

        try {
            const response = await auth.cancelReservation(reservationNumber, headers)

            if (response.status === 200) {
                alert("예약 취소 성공 !");

                setReserveList(prev =>
                    prev.filter(reserve => reserve.reservationNumber !== reservationNumber)
                );

                navigate("/");
            }
        } catch (error) {
            const errorMessage = error?.response?.data

            if (errorMessage) {
                switch (errorMessage) {
                    case "NOT_EXIST_RESERVE_INFO":
                        alert("예약 정보가 없습니다.");
                        break
                    case "NOT_EXIST_MEMBER_INFO":
                        alert("사용자 정보가 없습니다.");
                        break
                    case "NOT_EXIST_SEAT_INFO":
                        alert("좌석 정보가 없습니다.");
                        break
                    default:
                        alert("예약 취소 실패, 다시 시도해주세요. " + (errorMessage || "알 수 없는 오류"));
                }
            } else {
                alert("예약 취소 중 오류가 발생했습니다. 서버 응답이 없습니다.");
            }
        }
    }

    useEffect(() => {
        setReserveList(userInfo?.reserveList)
    }, [userInfo]);

    return (
        <>
            <Header />
            <div className="reserve-container">
                <h2 className="reserve-title">나의 예약 내역</h2>
                {reserveList?.length === 0 ? (
                    <p className="no-reserve">예약 내역이 없습니다.</p>
                ) : (
                    <ul className="reserve-list">
                        {reserveList
                            ?.filter(
                                (item, index, self) =>
                                    index === self.findIndex(r => r.reservationNumber === item.reservationNumber)
                            )
                            .map((reserve, index) => (
                                <li key={index} className="reserve-item">
                                    <div className="reserve-header">
                                        <p className="reservation-number">
                                            <strong>예약 번호 :</strong> {reserve.reservationNumber}
                                        </p>
                                        <button
                                            className="cancel-button"
                                            onClick={() => cancelReservation(reserve.reservationNumber)}
                                        >
                                            예약 취소
                                        </button>
                                    </div>

                                    <hr />

                                    <div className="reserve-grid">
                                        <p><strong>관람 일시 :</strong> {formatToSeconds(reserve.startTime)} - {formatToSeconds(reserve.endTime)}</p>
                                        <p><strong>총 금액 :</strong> {reserve.totalPrice.toLocaleString()}원</p>

                                        <p><strong>관람 좌석 :</strong> {reserve.seats.join(", ")}</p>
                                        <p className="reward-discount">리워드 할인 : {reserve.rewardDiscount.toLocaleString()}P</p>

                                        <p><strong>관람 인원 :</strong> {reserve.seats.length}명</p>
                                        <p className="final-price"><strong>결제 금액 :</strong> {reserve.finalPrice.toLocaleString()}원</p>

                                        <p className="created-at"><strong>예약 일자 :</strong> {formatToSeconds(reserve.createdAt)}</p>
                                        <p></p>
                                    </div>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default ReserveInfo;