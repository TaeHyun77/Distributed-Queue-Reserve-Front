import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';

import Home from "./page/home/Home"

import LoginContextProvider from "./contexts/LoginContextProvider"

import Login from "./account/login/LoginForm"
import Join from "./account/join/JoinForm"

import About from "./page/about/About"
import Performance from "./performance/Performance";
import Seat from "./seat/Seat"
import Payment from "./payment/Payment"
import Reward from "./page/reward/Reward"
import PerformanceSchedule from "./performance_schedule/performance_schedule"
import ReserveInfo from "./page/reserveInfo/ReserveInfo"


const App = () => {
  return (
    <BrowserRouter>
      <LoginContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} /> 
          <Route path="/about" element={<About />} /> 
          <Route path="/performance/:venueId" element={<Performance />} />
          <Route path="/seat/:queueType/:performanceScheduleId" element={<Seat />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/reward" element={<Reward />} />
          <Route path="/performance_schedule/:venueId/:performanceId" element={<PerformanceSchedule />} />
          <Route path="/reserveInfo" element={<ReserveInfo />} />
        </Routes>
      </LoginContextProvider>
    </BrowserRouter>
  );
};

export default App;
