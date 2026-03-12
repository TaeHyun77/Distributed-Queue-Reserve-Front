import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import * as auth from "../../api/auth";
import { LoginContext } from "../../contexts/LoginContextProvider";
import Header from "../header/Header";
import "./Reward.css";

const Reward = () => {
    const navigate = useNavigate();
    const { userInfo } = useContext(LoginContext);
    const [reward, setReward] = useState();
    const [claimedToday, setClaimedToday] = useState(false);

    // 로컬 날짜 기준 (toISOString은 UTC라 한국 시간과 다를 수 있음)
    const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    // startsWith로 날짜 앞부분만 비교 (백엔드 포맷이 "2026-03-12" 또는 "2026-03-12T..." 모두 대응)
    const alreadyClaimed = claimedToday || userInfo?.lastRewardDate?.startsWith(today);

    const grantReward = async () => {
        if (userInfo.username == null) {
            alert("로그인 후 이용 가능합니다.");
            navigate("/login");
            return;
        }

        console.log(userInfo)

        const check = window.confirm("오늘 리워드를 지급 받으시겠습니까?");
        if (!check) return;

        const headers = { 'idempotency-key': uuidv4() };

        try {
            const response = await auth.payRewardToday(headers);

            if (response.status === 200) {
                alert("200 포인트 지급 성공!");
                setReward(prev => prev + 200);
                setClaimedToday(true);
            }
        } catch (e) {
            if (e.response.status === 409) {
              alert('오늘 이미 리워드를 받았습니다.')
            } else{
                alert("리워드 지급 실패, 다시 시도해주세요.");
            }
          }
    };

    useEffect(() => {
        setReward(userInfo?.reward);
    }, [userInfo]);

    return (
        <>
            <Header />
            <div className="reward-container">
                <div className="reward-icon">🎁</div>
                <h2 className="reward-title">매일 리워드 받기</h2>
                <p className="reward-desc">하루 한 번, 200 포인트를 무료로 받아보세요!</p>

                <div className="reward-balance">
                    <span className="reward-balance-label">현재 보유 포인트</span>
                    <span className="reward-balance-value">{reward?.toLocaleString() ?? '-'} P</span>
                </div>

                <button
                    className={`reward-button ${alreadyClaimed ? 'reward-button--claimed' : ''}`}
                    onClick={grantReward}
                    disabled={alreadyClaimed}
                >
                    {alreadyClaimed ? '✅ 오늘 리워드를 받았습니다' : '오늘 리워드 받기'}
                </button>

                <p className="reward-notice">매일 자정에 초기화됩니다.</p>
            </div>
        </>
    );
};

export default Reward;
