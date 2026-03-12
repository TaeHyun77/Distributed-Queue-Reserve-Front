import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as auth from "../../api/auth";
import Header from "../../page/header/Header";
import { LoginContext } from "../../contexts/LoginContextProvider";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { isLogin } = useContext(LoginContext);
  const [venueList, setVenueList] = useState([]);

  const getVenueList = async () => {
    try {
      const response = await auth.venueList();
      const data = response.data;
      if (data != null) {
        setVenueList(data);
      }
    } catch (error) {
      console.log(`장소 리스트 조회 에러 : ${error}`);
    }
  };

  useEffect(() => {
    getVenueList();
  }, []);

  return (
    <>
      <Header />
      <div className="home-container">
        {venueList.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">🏟️</div>
            <p className="home-empty-title">
              {isLogin ? "등록된 공연장이 없습니다" : "공연 예매 서비스"}
            </p>
            <p className="home-empty-sub">
              {isLogin ? "잠시 후 다시 시도해주세요" : "로그인하여 공연을 예매해보세요"}
            </p>
          </div>
        ) : (
          <div>
            <h2 className="home-section-title">공연장 목록</h2>
            <p className="home-venue-hint">원하는 공연장을 선택하여 예매해보세요 !</p>
            <div className="place-card-container">
              {venueList.map((venue) => (
                <button
                  key={venue.id}
                  className="place-card"
                  onClick={() => navigate(`/performance/${venue.id}`)}
                >
                  <div className="place-card-icon">🏟️</div>
                  <h2>{venue.name}</h2>
                  <p>{venue.location}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
