import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LoginContext } from "../../contexts/LoginContextProvider";
import Header from "../../page/header/Header";
import "./LoginForm.css";

const LoginForm = () => {
  const { login } = useContext(LoginContext);

  const onLogin = (e) => {
    e.preventDefault();
    const form = e.target;
    login(form.username.value, form.password.value);
  };

  return (
    <>
      <Header />
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">로그인</h2>
            <p className="auth-subtitle">서비스를 이용하려면 로그인이 필요합니다</p>
          </div>

          <form className="auth-form" onSubmit={onLogin}>
            <div className="form-field">
              <label htmlFor="username">아이디</label>
              <input
                type="text"
                id="username"
                placeholder="아이디를 입력하세요"
                name="username"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                placeholder="비밀번호를 입력하세요"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="auth-link-row">
              <span className="auth-link-text">아직 계정이 없으신가요?</span>
              <Link to="/join" className="auth-link">회원가입</Link>
            </div>

            <button type="submit" className="auth-submit-btn">
              로그인
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
