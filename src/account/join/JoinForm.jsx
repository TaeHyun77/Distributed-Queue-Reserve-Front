import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as auth from "../../api/auth";
import Header from "../../page/header/Header";
import "./JoinForm.css";

const JoinForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [usernameChecked, setUsernameChecked] = useState(false);

  const onJoin = (e) => {
    e.preventDefault();

    if (!usernameChecked) {
      alert("아이디 검증을 진행해주세요");
      return;
    }

    const form = e.target;
    const user = {
      username,
      password: form.password.value.trim(),
      name: form.name.value.trim(),
      email: form.email.value.trim(),
    };

    join(user);
  };

  const join = async (form) => {
    try {
      const response = await auth.join(form);
      if (response.status === 201) {
        alert("회원가입 성공 !");
        navigate("/login");
      } else {
        setUsernameChecked(false);
        alert("회원가입 실패.. !!");
      }
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      setUsernameChecked(false);
      if (errorCode) {
        const messages = {
          DUPLICATED_USERNAME: "이미 사용 중인 아이디입니다.",
          INVALID_USERNAME: "유효하지 않은 아이디입니다.",
          FAIL_TO_SAVE_DATA: "회원가입 중 오류 발생",
        };
        alert(messages[errorCode] ?? "회원가입 중 오류 발생: " + (errorMessage || "알 수 없는 오류"));
      } else {
        alert("회원가입 중 오류 발생");
      }
    }
  };

  const checkUsername = async () => {
    try {
      const response = await auth.checkUsername(username);
      alert("사용 가능한 아이디입니다.");
      setUsername(response.data);
      setUsernameChecked(true);
    } catch (error) {
      console.error("아이디 확인 중 오류 발생:", error);
      const errorCode = error?.response?.data?.code;
      setUsernameChecked(false);

      const messages = {
        DUPLICATED_USERNAME: "이미 사용 중인 아이디입니다.",
        INVALID_USERNAME: "유효하지 않은 형식의 아이디입니다.",
      };
      alert(messages[errorCode] ?? "아이디 검증 실패 !");
    }
  };

  return (
    <>
      <Header />
      <div className="auth-wrapper">
        <div className="auth-card join-card">
          <div className="auth-header">
            <h2 className="auth-title">회원가입</h2>
            <p className="auth-subtitle">정보를 입력하고 서비스를 시작해보세요</p>
          </div>

          <form className="auth-form" onSubmit={onJoin}>
            <div className="form-field">
              <label htmlFor="username">아이디</label>
              <p className="form-hint">대문자, 숫자를 적어도 하나 이상 포함 / 특수문자는 ( @*^ )만 허용</p>
              <p className="form-hint-warn">공백 및 하이픈( - )은 자동으로 제거됩니다.</p>
              <div className="input-with-btn">
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="아이디를 입력하세요"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameChecked(false);
                  }}
                  required
                />
                <button type="button" className="btn-check" onClick={checkUsername}>
                  확인
                </button>
              </div>
              <p className={usernameChecked ? "status-ok" : "status-warn"}>
                {usernameChecked ? "✓ 사용 가능한 아이디입니다." : "아이디 검증을 진행해주세요."}
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                placeholder="비밀번호를 입력하세요"
                name="password"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                placeholder="이름을 입력하세요"
                name="name"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                placeholder="이메일을 입력하세요"
                name="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-link-row">
              <span className="auth-link-text">이미 계정이 있으신가요?</span>
              <Link to="/login" className="auth-link">로그인</Link>
            </div>

            <button type="submit" className="auth-submit-btn">
              가입하기
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default JoinForm;
