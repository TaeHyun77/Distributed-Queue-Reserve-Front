import React, { useContext, useEffect } from "react";
import { LoginContext } from "../../contexts/LoginContextProvider";
import Header from "../../page/header/Header"
import "./LoginForm.css";

const LoginForm = () => {
  const { login } = useContext(LoginContext);

  const onLogin = (e) => {
    e.preventDefault();

    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    login(username, password);
  };

  return (
    <>
      <Header />
      <div className="form">
        <h2 className="login-title">Login</h2>

        <form className="login-form" onSubmit={(e) => onLogin(e)}>
          <div>
            <label htmlFor="username">username</label>

            <input
              type="text"
              id="username"
              placeholder="username"
              name="username"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password">password</label>

            <input
              type="text"
              id="password"
              placeholder="password"
              name="password"
              autoComplete="password"
              required
            />
          </div>

          <button className="btn btn--form btn-login" login>
            Login
          </button>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
