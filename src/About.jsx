import React from "react";
import Header from "./header/Header";
import "./About.css"

const About = () => {
  return (
    <>
      <Header />
      <div className="containerAbout">
        <h1>통합 예약 프로젝트를 소개해요 !</h1>
        <hr />
        <p>티켓 예약 로직에서 좌석 선택 → 예약 → 결제 , 포인트 리워드 지급의 일련의 과정에서 멱등적인 API와 동시성을 다뤄보고 해결해보고자 하는 프로젝트입니다.</p>
        <p>멱등성( Idempotency )을 기반으로 예약 및 취소, 리워드 지급 로직에서 API의 중복 호출로 인한 오류를 방지했습니다.</p>
        <p>동시성 문제가 발생할 수 있는 예약, 예약 취소, 리워드 지급 등의 핵심 로직에 Redis 분산 락 ( metex )을 도입하여 충돌을 방지했습니다.</p>
      </div>
    </>
  );
};

export default About;
