import React from "react";
import CustomHeader from "./components/CustomHeader/CustomHeader";
import UploadPage from "./pages/UploadPage/UploadPage";
import LogInPage from "./pages/LogInPage/LogInPage";
import UserListPage from "./pages/UserListPage/UserListPage";
import SettingPage from "./pages/SettingPage/SettingPage";
import EmployeePage from "./pages/EmployeePage/EmployeePage";
import "./App.css"

const App = () => {
  return (
    <div>
      {/* <CustomHeader /> */}
      {/* <UploadPage/> */}
      {/* <LogInPage/>  */}
      {/* <UserListPage/> */}
      {/* <SettingPage/> */}
      <EmployeePage/>
    </div>
  );
};

export default App;
