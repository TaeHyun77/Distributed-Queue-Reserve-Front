import React from "react";
import Header from "../header/Header";
import "./About.css";

const FEATURES = [
  {
    icon: "🎯",
    title: "프로젝트 목적",
    desc: "티켓 예약 로직에서 좌석 선택 → 예약 → 결제, 포인트 리워드 지급의 일련의 과정에서 멱등적인 API와 동시성을 다뤄보고 해결해보고자 하는 프로젝트입니다.",
  },
  {
    icon: "🔁",
    title: "멱등성 (Idempotency)",
    desc: "멱등성을 기반으로 예약 및 취소, 리워드 지급 로직에서 API의 중복 호출로 인한 오류를 방지했습니다.",
  },
  {
    icon: "🔒",
    title: "Redis 분산 락",
    desc: "동시성 문제가 발생할 수 있는 예약, 예약 취소, 리워드 지급 등의 핵심 로직에 Redis 분산 락(mutex)을 도입하여 충돌을 방지했습니다.",
  },
];

const About = () => {
  return (
    <>
      <Header />
      <div className="about-container">
        <div className="about-hero">
          <p className="about-subtitle">멱등성과 동시성을 직접 구현하는 실전 예약 시스템</p>
        </div>

        <div className="about-card-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="about-card">
              <div className="about-card-icon">{f.icon}</div>
              <h3 className="about-card-title">{f.title}</h3>
              <p className="about-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default About;
