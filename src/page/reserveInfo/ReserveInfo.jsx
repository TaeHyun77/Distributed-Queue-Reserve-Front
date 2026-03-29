import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../../api/auth";
import Header from "../header/Header";
import "./ReserveInfo.css";

const ERROR_MESSAGES = {
    "RESERVATION_NOT_FOUND": "예약을 찾을 수 없습니다.",
    "UNAUTHORIZED": "권한이 없습니다.",
};

const ReserveInfo = () => {
    const navigate = useNavigate();
    const [reserveList, setReserveList] = useState([]);

    function formatToSeconds(datetimeString) {
        if (!datetimeString) return '';
        return datetimeString.split(".")[0].replace("T", " ");
    }
    const cancelReservation = async (reservationNumber) => {
        if (!window.confirm("예약을 취소하시겠습니까?")) return;
    
        try {
            await auth.cancelReservation(reservationNumber, {
                'request-key': uuidv4()
            });
            alert("예약 취소 성공!");
            setReserveList(prev =>
                prev.filter(r => r.reservationNumber !== reservationNumber)
            );
            navigate("/");
        } catch (error) {
            const message = ERROR_MESSAGES[error?.response?.data]
                ?? "예약 취소 실패, 다시 시도해주세요.";
            alert(message);
        }
    };

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await auth.getMyReservations();
                setReserveList(response.data);
            } catch (error) {
                console.error("예약 목록 조회 실패:", error);
                setReserveList([]);
            }
        };
        fetchReservations();
    }, []);

    return (
        <>
            <Header />
            <div className="reserve-container">
                <h2 className="reserve-title">나의 예약 내역</h2>

                {reserveList?.length === 0 ? (
                    <div className="reserve-empty">
                        <div className="reserve-empty-icon">🎫</div>
                        <p className="reserve-empty-text">예약 내역이 없습니다</p>
                    </div>
                ) : (
                    <ul className="reserve-list">
                        {reserveList
                            ?.filter(
                                (item, index, self) =>
                                    index === self.findIndex(r => r.reservationNumber === item.reservationNumber)
                            )
                            .map((reserve, index) => (
                                <li key={index} className="reserve-item">
                                    <div className="reserve-item-header">
                                        <div className="reserve-number-wrap">
                                            <span className="reserve-number-label">예약 번호</span>
                                            <span className="reserve-number-value">{reserve.reservationNumber}</span>
                                        </div>
                                        <button
                                            className="reserve-cancel-button"
                                            onClick={() => cancelReservation(reserve.reservationNumber)}
                                        >
                                            예약 취소
                                        </button>
                                    </div>

                                    <div className="reserve-divider" />

                                    <div className="reserve-grid">
                                        <div className="reserve-row">
                                            <span className="reserve-label">예약 일자</span>
                                            <span className="reserve-value">{formatToSeconds(reserve.createdAt)}</span>
                                        </div>
                                        <div className="reserve-row">
                                            <span className="reserve-label">예약 좌석</span>
                                            <span className="reserve-value">{reserve.reservedSeat.join(", ")}</span>
                                        </div>
                                        <div className="reserve-row">
                                            <span className="reserve-label">예약 인원</span>
                                            <span className="reserve-value">{reserve.reservedSeat.length}명</span>
                                        </div>
                                        <div className="reserve-row">
                                            <span className="reserve-label">총 금액</span>
                                            <span className="reserve-value">{reserve.totalAmount.toLocaleString()}원</span>
                                        </div>
                                        <div className="reserve-row">
                                            <span className="reserve-label">리워드 할인</span>
                                            <span className="reserve-value reserve-discount">- {reserve.rewardDiscountAmount.toLocaleString()} P</span>
                                        </div>
                                    </div>

                                    <div className="reserve-divider" />

                                    <div className="reserve-final">
                                        <span className="reserve-final-label">최종 결제 금액</span>
                                        <span className="reserve-final-value">{reserve.finalAmount.toLocaleString()}원</span>
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
