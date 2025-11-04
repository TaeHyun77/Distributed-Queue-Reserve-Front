import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';

import Home from "./home/Home"

import LoginContextProvider from "./contexts/LoginContextProvider"

import Login from "./login/LoginForm"
import Join from "./join/JoinForm"

import About from "./about/About"
import Venue from "./venue/Venue";
import Seat from "./seat/Seat"
import Payment from "./payment/Payment"
import Reward from "./reward/Reward"
import ScreeningSchedule from "./screening_schedule/screening_schedule"
import ReserveInfo from "./reserveInfo/ReserveInfo"


const App = () => {
  return (
    <BrowserRouter>
      <LoginContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} /> 
          <Route path="/about" element={<About />} /> 
          <Route path="/venue/:venueId" element={<Venue />} />
          <Route path="/Seat/:screenInfoId" element={<Seat />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/reward" element={<Reward />} />
          <Route path="/screening_schedule/:venueId/:performanceId" element={<ScreeningSchedule />} />
          <Route path="/reserveInfo" element={<ReserveInfo />} />
        </Routes>
      </LoginContextProvider>
    </BrowserRouter>
  );
};

export default App;
