import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../../contexts/LoginContextProvider";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { isLogin, userInfo, logout } = useContext(LoginContext);

  return (
    <header>
      <div className="logo">
        <Link to="/">
          <span className="logo-text">통합 예약 프로젝트</span>
        </Link>
      </div>
      <div className="util">
        <ul>
          {!isLogin ? (
            <>
              <li><Link to="/about">소개글</Link></li>
              <li><Link to="/join">회원가입</Link></li>
              <li><Link to="/login">로그인</Link></li>
            </>
          ) : (
            <>
              <li><h5 className="user-text">{userInfo?.name}님</h5></li>
              <li><p className="header-info">크레딧 {userInfo?.credit}</p></li>
              <li><p className="header-info">포인트 {userInfo?.reward}</p></li>
              <li className="header-divider" />
              <li><Link to="/about">소개글</Link></li>
              <li><Link to="/reserveInfo">예약 내역</Link></li>
              <li><button onClick={() => navigate("/reward")}>리워드</button></li>
              <li><button onClick={logout}>로그아웃</button></li>
            </>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Header;
