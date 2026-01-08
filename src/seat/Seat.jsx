import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContextProvider";
import Header from "../page/header/Header";
import * as auth from "../api/auth";
import "./Seat.css";

const Seat = () => {
    const navigate = useNavigate();
    const { userInfo } = useContext(LoginContext);
    const { queueType, performanceScheduleId } = useParams();

    const [seatList, setSeatList] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [personCount, setPersonCount] = useState(1);
    const [seatAmount, setSeatAmount] = useState();

    const totalRows = 5;
    const totalCols = 5;
    const hasNoSeats = !seatList || seatList.length != 0;

    // 좌석 선택 함수
    const toggleSeat = (seatId) => {
        if (!userInfo?.username) {
            alert("로그인 후 예매를 진행할 수 있습니다.");
            return;
        }

        const isSelected = selectedSeats.includes(seatId);

        if (isSelected) {
            setSelectedSeats((prev) => prev.filter((s) => s !== seatId));
        } else {
            if (selectedSeats.length < personCount) {
                setSelectedSeats((prev) => [...prev, seatId]);
            } else {
                alert(`최대 ${personCount}명까지만 선택할 수 있습니다.`);
            }
        }
    };

    // 좌석 목록 조회
    const getSeatList = async () => {
        try {
            const response = await auth.seatList(performanceScheduleId);
            const data = response.data;

            const reserved = data
                .filter((seat) => seat.is_reserved)
                .map((seat) => seat.seatNumber);

            setSeatList(reserved);

            if (data.length > 0) {
                const price = data[0]?.performanceSchedule?.performance?.price;
                setSeatAmount(price);
            }

        } catch (error) {
            console.error("예약 좌석 리스트 불러오기 실패 : " + error);
        }
    };

    // 결제 페이지 이동
    const goToPayment = () => {
        if (selectedSeats.length === 0) {
            alert("좌석을 선택해주세요!");
            return;
        }

        const seatsInfo = {
            queueType: queueType,
            performanceScheduleId: performanceScheduleId,
            seats: selectedSeats,
            personCount: personCount,
            seatAmount: seatAmount
        };

        navigate("/payment", { state: seatsInfo });
    };

    // 선택 인원 조절 함수
    const increasePerson = () => {
        setPersonCount((prev) => Math.min(prev + 1, 5));
    };

    const decreasePerson = () => {
        setPersonCount((prev) => Math.max(prev - 1, 1));
        setSelectedSeats((prev) => prev.slice(0, personCount - 1));
    };

    useEffect(() => {
        getSeatList();
    }, []);

    return (
        <>
            <Header />
            <div className="seat-container">
                {hasNoSeats ? (
                    <p className="no-seat-message">좌석 정보가 없습니다.</p>
                ) : (
                    <>
                        <h2>좌석을 선택하세요 🍿</h2>

                        <div className="seat-grid">
                            {[...Array(totalRows)].map((_, row) =>
                                [...Array(totalCols)].map((_, col) => {
                                    const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
                                    const isReserved = seatList.includes(seatId);
                                    const isSelected = selectedSeats.includes(seatId);

                                    return (
                                        <div
                                            key={seatId}
                                            className={`seat ${isSelected ? "selected" : ""} ${isReserved ? "reserved" : ""}`}
                                            onClick={() => !isReserved && toggleSeat(seatId)}
                                        >
                                            {seatId}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {userInfo?.username ? (
                            <>
                                <div className="person-counter">
                                    <button onClick={decreasePerson}>-</button>
                                    <span>{personCount}명</span>
                                    <button onClick={increasePerson}>+</button>
                                </div>

                                <button className="reserve-button" onClick={goToPayment}>
                                    예매하기
                                </button>
                            </>
                        ) : (
                            <p className="login-warning">로그인 후 예매하세요.</p>
                        )}
                    </>
                )}
            </div>

        </>
    );
};

export default Seat;