import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContextProvider";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../api/auth";
import Header from "../header/Header"
import "./Reward.css";

const Reward = () => {
    const navigate = useNavigate()

    const { userInfo } = useContext(LoginContext);
    const [reward, setReward] = useState();

    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const setRewardDate = async () => {

        if (userInfo.username == null) {
            alert("로그인 후 이용 가능합니다.")
            navigate("/login")
        }

        const check = window.confirm("오늘 리워드를 지급 받으시겠습니까 ?")

        if (!check) return;

        const idempotencyKey = uuidv4(); // 멱등키 생성

        const headers = {
            'Idempotency-key': idempotencyKey,
        };

        console.log(idempotencyKey)

        try {
            const response = await auth.payRewardToday(today, headers)

            if (response.status === 200) {
                alert("200 포인트 지급 성공 !");
                setReward(prev => prev + 200);
                navigate("/reward");
            }

        } catch (error) {

            const errorMessage = error?.response?.data

            if (errorMessage) {
                switch (errorMessage) {
                    case "REWARD_ALREADY_CLAIMED":
                        alert("오늘 이미 리워드가 지급되었습니다.");
                        break;
                    default:
                        alert("리워드 지급 실패, 다시 시도해주세요 " + (errorMessage || "알 수 없는 오류"));
                }
            } else {
                alert("리워드 지급 실패 ! 서버 응답이 없습니다.");
            }
        }
    }

    // 이번 년도 이번 달의 모든 날짜 리스트 반환 - new Date(2025, 5, 1), new Date(2025, 5, 2) ...
    const getDaysInMonth = (year, month) => {
        const date = new Date(year, month, 1); // 특정 달의 1일을 기준으로 한 날짜 객체를 생성
        const days = [];

        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const today = formatDate(new Date())
    console.log(today)

    const days = getDaysInMonth(new Date().getFullYear(), new Date().getMonth());

    useEffect(() => {
        setReward(userInfo?.reward);
    }, [userInfo]);

    return (
        <>
            <Header />
            <div className="calendar-container">
                <h2 className="calendar-title">당일 리워드 지급 현황</h2>
                <p className="reward-point">
                    보유 리워드: <strong>{reward}</strong> 포인트
                </p>
                <p style={{ marginBottom: "40px" }}>하루 한 번 리워드를 받아보세요!</p>
                <button onClick={setRewardDate} className="reward-button">
                    리워드 받기
                </button>
            </div>
        </>
    );
}

export default Reward