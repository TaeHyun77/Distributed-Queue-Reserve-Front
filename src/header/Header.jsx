import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../contexts/LoginContextProvider";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate()
  const { isLogin, userInfo, logout } = useContext(LoginContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header>
      <div className="logo">
        <Link to="/">
          <span className="logo-text">통한 예약 프로젝트</span>
        </Link>
      </div>
      <div className="util">
        <ul>
          {!isLogin ? (
            <>
              <li>
                <Link to="/about">소개글</Link>
              </li>
              <li>
                <Link to="/join">회원가입</Link>
              </li>
              <li>
                <Link to="/login">로그인</Link>
              </li>

            </>
          ) : (
            <>
              <li><h5 class="user-text">{userInfo?.name}님 환영합니다</h5></li>

              <li>
                <p>보유 크레딧 : {userInfo?.credit}</p>
              </li>

              <li>
                <p>보유 포인트 : {userInfo?.reward}</p>
              </li>

              <li>
                <button onClick={logout}>
                  로그아웃
                </button>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    if (!userInfo?.username) {
                      e.preventDefault(); // 링크 이동 금지
                      alert("로그인을 먼저 해주세요");
                      navigate("/login")
                    } else {
                      navigate("/reward")
                    }
                  }}
                >
                  리워드
                </a>
              </li>

              <li>
                <Link to="/about">소개글</Link>
              </li>

              <li>
                <Link to="/reserveInfo">예약 내역</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Header;
