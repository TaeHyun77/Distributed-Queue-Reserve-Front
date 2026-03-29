import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContextProvider";
import { ReservationFlowContext } from "../contexts/ReservationFlowGuard";
import Header from "../page/header/Header";
import * as auth from "../api/auth";
import "./Seat.css";

const Seat = () => {
    const navigate = useNavigate();
    const { isLogin, authReady, userInfo } = useContext(LoginContext);
    const { secondsLeft } = useContext(ReservationFlowContext);
    const { queueType, performanceScheduleId } = useParams();

    useEffect(() => {
        if (authReady && !isLogin) navigate("/");
    }, [authReady, isLogin, navigate]);

    const [seatMap, setSeatMap] = useState(new Map());
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [personCount, setPersonCount] = useState(1);
    const [seatAmount, setSeatAmount] = useState(0);

    const totalRows = 5;
    const totalCols = 5;

    const toggleSeat = (seatId) => {
        if (!userInfo?.username) {
            alert("로그인 후 예매를 진행할 수 있습니다.");
            return;
        }

        const isSelected = selectedSeats.includes(seatId);

        if (isSelected) {
            setSelectedSeats(prev => prev.filter(s => s !== seatId));
        } else {
            if (selectedSeats.length < personCount) {
                setSelectedSeats(prev => [...prev, seatId]);
            } else {
                alert(`최대 ${personCount}명까지만 선택할 수 있습니다.`);
            }
        }
    };

    const getSeatList = async () => {
        try {
            const response = await auth.seatList(performanceScheduleId);
            const data = response.data;

            const map = new Map();
            data.forEach(seat => {
                map.set(seat.seatNumber, seat);
            });
            setSeatMap(map);

            if (data.length > 0) {
                const price = data[0]?.performanceSchedule?.performance?.price;
                setSeatAmount(price ?? 0);
            }
        } catch (error) {
            console.error("좌석 리스트 조회 실패:", error);
        }
    };

    const goToPayment = () => {
        if (selectedSeats.length === 0) {
            alert("좌석을 선택해주세요!");
            return;
        }

        navigate("/payment", {
            state: {
                queueType,
                performanceScheduleId,
                seats: selectedSeats,
                personCount,
                seatAmount
            }
        });
    };

    const increasePerson = () => {
        setPersonCount(prev => Math.min(prev + 1, 5));
    };

    const decreasePerson = () => {
        setPersonCount(prev => Math.max(prev - 1, 1));
        setSelectedSeats(prev => prev.slice(0, personCount - 1));
    };

    useEffect(() => {
        getSeatList();
    }, []);

    const totalPrice = selectedSeats.length * seatAmount;

    return (
        <>
            <Header />
            <div className="seat-page">
                <div className="seat-card">
                    <div className="seat-card-header">
                        <div className="seat-header-top">
                            <div>
                                <h2 className="seat-title">좌석 선택</h2>
                                <p className="seat-subtitle">원하는 좌석을 선택해주세요</p>
                            </div>
                            {secondsLeft > 0 && (
                                <div className="seat-timer">
                                    <span className="timer-label">남은 시간</span>
                                    <span className="timer-value">
                                        {Math.floor(secondsLeft / 60)}분 {(secondsLeft % 60) < 10 ? `0${secondsLeft % 60}` : secondsLeft % 60}초
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="stage-bar">STAGE</div>

                    <div className="seat-grid">
                        {[...Array(totalRows)].map((_, row) =>
                            [...Array(totalCols)].map((_, col) => {
                                const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
                                const seat = seatMap.get(seatId);
                                const isExist = !!seat;
                                const isReserved = seat?.isReserved;
                                const isSelected = selectedSeats.includes(seatId);

                                return (
                                    <div
                                        key={seatId}
                                        className={`seat
                                            ${!isExist ? "seat--disabled" : ""}
                                            ${isExist && isReserved ? "seat--reserved" : ""}
                                            ${isExist && !isReserved && isSelected ? "seat--selected" : ""}
                                            ${isExist && !isReserved && !isSelected ? "seat--available" : ""}
                                        `}
                                        onClick={() => isExist && !isReserved && toggleSeat(seatId)}
                                    >
                                        {!isExist ? "✕" : seatId}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="seat-legend">
                        <div className="legend-item">
                            <span className="legend-box legend-available" />
                            <span>선택 가능</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-box legend-selected" />
                            <span>선택됨</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-box legend-reserved" />
                            <span>예약됨</span>
                        </div>
                    </div>

                    <div className="seat-divider" />

                    {userInfo?.username ? (
                        <div className="seat-bottom">
                            <div className="person-section">
                                <span className="section-label">인원 선택</span>
                                <div className="person-counter">
                                    <button className="counter-btn" onClick={decreasePerson}>−</button>
                                    <span className="counter-value">{personCount}명</span>
                                    <button className="counter-btn" onClick={increasePerson}>+</button>
                                </div>
                            </div>

                            <div className="seat-summary">
                                <div className="summary-row">
                                    <span className="summary-label">선택한 좌석</span>
                                    <span className="summary-value">
                                        {selectedSeats.length > 0 ? selectedSeats.join(", ") : "—"}
                                    </span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">좌석당 금액</span>
                                    <span className="summary-value">{seatAmount.toLocaleString()}원</span>
                                </div>
                                <div className="summary-row summary-total">
                                    <span className="summary-label">총 금액</span>
                                    <span className="summary-value summary-price">{totalPrice.toLocaleString()}원</span>
                                </div>
                            </div>

                            <button className="reserve-button" onClick={goToPayment}>
                                예매하기
                            </button>
                        </div>
                    ) : (
                        <p className="login-warning">로그인 후 예매를 진행할 수 있습니다.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default Seat;
