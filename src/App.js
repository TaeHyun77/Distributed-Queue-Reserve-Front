import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';

import Home from "./page/home/Home";

import LoginContextProvider from "./contexts/LoginContextProvider";
import ReservationFlowGuard from "./contexts/ReservationFlowGuard";

import Join from "./account/join/JoinForm";
import Login from "./account/login/LoginForm";

import About from "./page/about/About";
import ReserveInfo from "./page/reserveInfo/ReserveInfo";
import Reward from "./page/reward/Reward";
import Payment from "./payment/Payment";
import Performance from "./performance/Performance";
import PerformanceSchedule from "./performance_schedule/performance_schedule";
import Seat from "./seat/Seat";


const App = () => {
  return (
    <BrowserRouter>
      <LoginContextProvider>
        <ReservationFlowGuard>
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
        </ReservationFlowGuard>
      </LoginContextProvider>
    </BrowserRouter>
  );
};

export default App;
