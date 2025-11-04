import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import * as auth from "../api/auth";
import Cookies from "js-cookie";

export const LoginContext = React.createContext();
LoginContext.displayName = "LoginContextName";

const LoginContextProvider = ({ children }) => {

  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [roles, setRoles] = useState({ isUser: false, isAdmin: false });

  /**
   * 로그인 여부
   */
  const loginCheck = async () => {
    const accessToken = Cookies.get("accessToken");

    if (!accessToken) {
      console.log(`쿠키에 accessToken 없음`);

      logoutSetting();
      return;
    }

    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    let response;
    let data;

    try {
      response = await auth.info();
      data = response.data;

      if (data == "UNAUTHORIZED" || response.status == 401) {
        console.error(`accessToken이 만료되거나 인증 실패되었습니다.`);
        return;
      }

      loginSetting(data, accessToken);
    } catch (error) {
      console.log(`error : ${error}`);

      if (error.response && error.response.status) {
        console.log(`status : ${error.response.status}`);
      }

      return;
    }
  };

  /**
   * 로그인 요청
   */
  const login = async (username, password) => {

    try {
      const response = await auth.login(username, password);
      const status = response.status;
      const headers = response.headers;
      const authorization = headers.authorization;

      if (status === 200) {
        Cookies.set("accessToken", authorization);

        loginCheck();
        alert(`로그인 성공`);

        navigate("/");
      }
    } catch (error) {
      alert(`로그인 실패되었습니다..!`);
    }
  };

  
  /**
   * 로그인 세팅
   */
  const loginSetting = (userData, accessToken) => {
    const { username, role, name, email, last_reward_date, reward, credit, reserveList, createdAt, seats, startTime, endTime } = userData;

    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    setIsLogin(true);

    const updatedUserInfo = { username, role, name, email, last_reward_date, reward, credit, reserveList, createdAt, seats, startTime, endTime };
    setUserInfo(updatedUserInfo);

    const updatedRoles = { isUser: false, isAdmin: false };

    if (role === "USER") {
      updatedRoles.isUser = true;
    } else if (role === "ADMIN") {
      updatedRoles.isAdmin = true;
    }

    setRoles(updatedRoles);
  };

  /**
   * 로그아웃 요청
   */
  const logout = () => {
    const check = window.confirm("로그아웃 하시겠습니까 ?");

    if (check) {
      alert("로그아웃 되었습니다.")
      logoutSetting();
      navigate("/");
    }
  };

  /**
   * 로그아웃 세팅
   */
  const logoutSetting = () => {
    api.defaults.headers.common.Authorization = undefined;

    Cookies.remove("accessToken");

    setIsLogin(false);

    setUserInfo(null);

    setRoles({ isUser: false, isAdmin: false });
  };

  const DeleteLogout = () => {
    logoutSetting();
    navigate("/");
  };

  useEffect(() => {
    loginCheck();
  }, []);

  return (
    <LoginContext.Provider
      value={{ isLogin, userInfo, roles, login, logout, DeleteLogout }}
    >
      {children}
    </LoginContext.Provider>
  );
};

export default LoginContextProvider;
