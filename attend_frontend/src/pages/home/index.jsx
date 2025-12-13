import React from "react";
import { Button } from "@/components/ui/button";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";

const HomePage = () => {
  const handleGetAttendance = async () => {
    const response = await makeApiRequest(ENDPOINTS.GET_ATTENDANCE);
    if (response.success) {
      console.log(response.data);
    } else {
      console.error(response.message);
    }
  };

  return (
    <div>
      HomePage
      <Button onClick={handleGetAttendance}>Get Attendance</Button>
    </div>
  );
};

export default HomePage;
