import React, { useState, useRef } from "react";
import * as auth from "../../api/auth";
import { useNavigate } from "react-router-dom";
import "./JoinForm.css";
import Header from "../../page/header/Header";

const JoinForm = () => {

  const navigate = useNavigate()
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
      username : username, // 검증 + 정제된 값
      password: form.password.value.trim(),
      name: form.name.value.trim(),
      email: form.email.value.trim(),
    };

    join(user);
  };

  /**
   * 회원가입 요청
   */
  const join = async (form) => {

    try {
      const response = await auth.join(form);

      if (response.status === 200) {
        alert(`회원가입 성공 !`);
        navigate("/login");
      } else {
        setUsernameChecked(false);
        alert(`회원가입 실패.. !!`);
      }

    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);

      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      if (errorCode) {
        switch (errorCode) {
          case "DUPLICATED_USERNAME":
            setUsernameChecked(false);
            alert("이미 사용 중인 아이디입니다.");
            break;
          case "INVALID_USERNAME":
            setUsernameChecked(false);
            alert("유효하지 않은 아이디입니다.");
            break;
          case "FAIL_TO_SAVE_DATA":
            setUsernameChecked(false);
            alert("회원가입 중 오류 발생");
            break;
          default:
            setUsernameChecked(false);
            alert("회원가입 중 오류 발생: " + (errorMessage || "알 수 없는 오류"));
        }
      } else {
        setUsernameChecked(false);
        alert("회원가입 중 오류 발생");
      }
    }
  };

  /**
   * 사용자 이름 유효성 검사
   */
  const checkUsername = async () => {
    try {
      const response = await auth.checkUsername(username);
      const cleanedUsername = response.data

      alert("사용 가능한 아이디입니다.");
      setUsername(cleanedUsername);
      setUsernameChecked(true);

    } catch (error) {
      console.error("아이디 확인 중 오류 발생:", error);

      const errorMessage = error?.response?.data.code
      console.log(errorMessage)

      if (errorMessage) {
        switch (errorMessage) {
          case "DUPLICATED_USERNAME":
            setUsernameChecked(false);
            alert("이미 사용 중인 아이디입니다.");
            break;
          case "INVALID_USERNAME":
            setUsernameChecked(false);
            alert("유효하지 않은 형식의 아이디입니다.");
            break;
          default:
            setUsernameChecked(false);
            alert("아이디 검증 실패: " + (errorMessage || "알 수 없는 오류"));
        }
      } else {
        setUsernameChecked(false);
        alert("아이디 검증 실패 !");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="join_container">
        <h2 className="join-title">회원가입</h2>

        <form className="join-form" onSubmit={(e) => onJoin(e)}>
          <div className="username-area">
            <label htmlFor="username">아이디</label>
            <p className="form-hint">
              대문자, 숫자를 적어도 하나 이상 포함해야 하며, 특수문자는 ( @*^ )만 허용됩니다.
            </p>
            <p className="form-hint2">
              공백 및 하이픈( - )은 자동으로 제거됩니다.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameChecked(false); // 값 바뀌면 검증 무효
                }}
                required
                style={{ flex: 1 }}
              />

              <button
                type="button"
                className="btn-check"
                onClick={() => checkUsername(username)}
              >
                확인
              </button>
            </div>
            <p className={usernameChecked ? "text-blue" : "text-red"}>
              {usernameChecked ? "사용 가능한 아이디입니다." : "아이디 검증을 진행해주세요."}
            </p>
          </div>

          <div>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              placeholder="password"
              name="password"
              autoComplete="password"
              required
            />
          </div>

          <div>
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              placeholder="name"
              name="name"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="age">나이</label>
            <input
              type="text"
              id="age"
              name="age"
              placeholder="age"
              list="ageList"
              required
            />
            <datalist id="ageList">
              <option value="20대" />
              <option value="30대" />
              <option value="40대" />
              <option value="50대" />
              <option value="60대" />
            </datalist>
          </div>

          <div>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              placeholder="email"
              name="email"
              autoComplete="email"
              required
            />
          </div>

          <button
            className="btn-join"
            style={{ marginTop: "10px" }} >
            가입
          </button>
        </form>
      </div>
    </>
  );
};

export default JoinForm;
